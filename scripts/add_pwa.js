const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Add manifest
    if (!content.includes('manifest.json')) {
        content = content.replace('</head>', '  <link rel="manifest" href="manifest.json">\n</head>');
    }

    // Add service worker registration
    if (!content.includes('navigator.serviceWorker')) {
        content = content.replace('</body>', `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
          console.log('SW registration failed: ', err);
        });
      });
    }
  </script>
</body>`);
    }

    fs.writeFileSync(path.join(dir, file), content, 'utf8');
    console.log(`Added PWA to ${file}`);
});
