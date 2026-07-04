const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Replace app.js module with deferred bundle
    content = content.replace(/<script type="module" src="js\/app\.js"><\/script>/g, '<script defer src="js/bundle.js"></script>');
    
    // Remove individual module imports if any were left in HTML (there shouldn't be, but just in case)
    // Defer all other scripts
    content = content.replace(/<script src="assets\/vendor\/js\/bootstrap\.bundle\.min\.js"><\/script>/g, '<script defer src="assets/vendor/js/bootstrap.bundle.min.js"></script>');
    content = content.replace(/<script src="assets\/vendor\/js\/swiper-bundle\.min\.js"><\/script>/g, '<script defer src="assets/vendor/js/swiper-bundle.min.js"></script>');
    content = content.replace(/<script src="assets\/vendor\/js\/gsap\.min\.js"><\/script>/g, '<script defer src="assets/vendor/js/gsap.min.js"></script>');
    content = content.replace(/<script src="assets\/vendor\/js\/ScrollTrigger\.min\.js"><\/script>/g, '<script defer src="assets/vendor/js/ScrollTrigger.min.js"></script>');
    content = content.replace(/<script src="assets\/vendor\/js\/chart\.js"><\/script>/g, '<script defer src="assets/vendor/js/chart.js"></script>');

    fs.writeFileSync(path.join(dir, file), content, 'utf8');
    console.log(`Updated scripts in ${file}`);
});
