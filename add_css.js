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
  
  // Replace the font link with the local fonts if needed, or just append the missing CSS
  // We'll look for style.css and append the others.
  
  if (!content.includes('refresh.css')) {
    content = content.replace(
      '<link href="css/style.css" rel="stylesheet">',
      '<link href="css/style.css" rel="stylesheet">\n  <link href="css/responsive.css" rel="stylesheet">\n  <link href="css/animation.css" rel="stylesheet">\n  <link href="css/refresh.css" rel="stylesheet">'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added missing CSS to ${file}`);
  } else {
    console.log(`${file} already has refresh.css`);
  }
});
