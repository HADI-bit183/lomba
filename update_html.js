const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'FutureInnovators/index.html')
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove dark/gradient backgrounds and text-white from sections
  content = content.replace(/class="([^"]*)bg-dark([^"]*)"/g, 'class="$1$2"');
  content = content.replace(/class="([^"]*)bg-gradient([^"]*)"/g, 'class="$1$2"');
  content = content.replace(/class="([^"]*)text-white([^"]*)"/g, 'class="$1$2"');
  
  // Clean up extra spaces in class attributes
  content = content.replace(/class="\s+/g, 'class="');
  content = content.replace(/\s+"/g, '"');
  
  // Replace text-danger, text-warning, text-info, text-success with text-neutral-icon
  content = content.replace(/text-(danger|warning|info|success)/g, 'text-neutral-icon');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
