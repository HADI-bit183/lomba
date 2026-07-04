const fs = require('fs');

let content = fs.readFileSync('resources.html', 'utf8');

// Ensure all row g-4 mb-5 have d-flex align-items-stretch
content = content.replace(/<div class="row g-4 mb-5">/g, '<div class="row g-4 mb-5 d-flex align-items-stretch">');

// Ensure all unified-card in resources have flex-column
content = content.replace(/class="unified-card glass p-4 h-100 position-relative group hover-lift border-(.*?)"/g, 'class="unified-card glass p-4 h-100 position-relative group hover-lift border-$1 d-flex flex-column"');

// Ensure all text-muted small mb-4 have flex-grow-1
content = content.replace(/<p class="text-muted small mb-4">/g, '<p class="text-muted small mb-4 flex-grow-1">');

// Ensure all download buttons have mt-auto
content = content.replace(/class="btn btn-outline-(.*?) w-100 d-flex justify-content-between align-items-center/g, 'class="btn btn-outline-$1 w-100 d-flex justify-content-between align-items-center mt-auto');

// We might have double added mt-auto to the ones we already replaced, let's fix
content = content.replace(/mt-auto mt-auto/g, 'mt-auto');
content = content.replace(/flex-grow-1 flex-grow-1/g, 'flex-grow-1');
content = content.replace(/d-flex flex-column d-flex flex-column/g, 'd-flex flex-column');
content = content.replace(/d-flex align-items-stretch d-flex align-items-stretch/g, 'd-flex align-items-stretch');

fs.writeFileSync('resources.html', content);
console.log('Fixed resources.html grid layout');
