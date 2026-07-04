
const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    // Optimize chart.js (Only needed in dashboard.html)
    if (file !== 'dashboard.html') {
        content = content.replace(/<script src="assets\/vendor\/js\/chart\.js"><\/script>\n?/g, '');
    }

    // Optimize particles.min.js
    if (!content.includes('id="particles-')) {
        content = content.replace(/<script src="assets\/vendor\/js\/particles\.min\.js"><\/script>\n?/g, '');
    }

    // Optimize swiper-bundle.min.js
    if (!content.includes('class="swiper') && !content.includes('class="swiper-')) {
        content = content.replace(/<script src="assets\/vendor\/js\/swiper-bundle\.min\.js"><\/script>\n?/g, '');
    }

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log(`Optimized ${file}`);
    }
});
console.log('Optimization complete.');
