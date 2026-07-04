const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    // Check if gsap is loaded
    if (!content.includes('gsap.min.js')) {
        // Insert it right before app.js
        content = content.replace(
            '<script type="module" src="js/app.js"></script>',
            '<script src="assets/vendor/js/gsap.min.js"></script>\n  <script src="assets/vendor/js/ScrollTrigger.min.js"></script>\n  <script type="module" src="js/app.js"></script>'
        );
    }
    
    // Check if ai.js throws error because of missing GSAP
    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log(`Added GSAP to ${file}`);
    }
});
