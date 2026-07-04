const fs = require('fs');
const path = require('path');

const dir = '/Users/user/Documents/lomba';
const newFiles = [
  'achievements.html',
  'innovation-roadmap.html',
  'ai-mentor.html',
  'skill-gap.html',
  'innovation-canvas.html',
  'recommended-resources.html',
  'global-innovation-map.html',
  'pitch-deck-generator.html',
  'innovation-impact.html',
  'daily-challenge.html'
];

newFiles.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('js/bundle.js')) {
    content = content.replace('</body>', '  <script defer src="js/bundle.js"></script>\n</body>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added bundle.js to ${file}`);
  } else {
    console.log(`${file} already has bundle.js`);
  }
});
