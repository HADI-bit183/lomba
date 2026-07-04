const fs = require('fs');
const path = require('path');

const dir = '/Users/user/Documents/lomba';
const cssFilePath = path.join(dir, 'css', 'style.css');
const htmlFiles = [
  'achievements.html',
  'ai-evaluator.html',
  'ai-mentor.html',
  'daily-challenge.html',
  'global-innovation-map.html',
  'innovation-impact.html',
  'innovation-readiness.html',
  'innovation-roadmap.html',
  'pitch-deck-generator.html',
  'recommended-resources.html',
  'skill-gap.html'
];

let appendedCSS = '\n/* =========================================\n   Styles extracted from new pages\n   ========================================= */\n';

htmlFiles.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract all <style> blocks
  const styleRegex = /<style>([\s\S]*?)<\/style>/gi;
  let match;
  let hasStyle = false;
  
  while ((match = styleRegex.exec(content)) !== null) {
    hasStyle = true;
    appendedCSS += `\n/* --- ${file} --- */\n`;
    appendedCSS += match[1].trim() + '\n';
  }
  
  if (hasStyle) {
    // Remove the style blocks from the HTML
    content = content.replace(styleRegex, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Extracted and removed styles from ${file}`);
  }
});

if (appendedCSS.trim() !== '/* =========================================\n   Styles extracted from new pages\n   ========================================= */') {
  fs.appendFileSync(cssFilePath, appendedCSS, 'utf8');
  console.log('Successfully appended all extracted styles to style.css!');
} else {
  console.log('No styles found to extract.');
}
