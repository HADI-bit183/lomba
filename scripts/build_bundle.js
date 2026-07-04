const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, '..', 'js', 'bundle.js');

if (!fs.existsSync(bundlePath)) {
  throw new Error(`Prebuilt bundle is missing: ${bundlePath}`);
}

const bundleSource = fs.readFileSync(bundlePath, 'utf8');

try {
  // Compile without executing to catch accidental syntax errors.
  new Function(bundleSource);
} catch (error) {
  throw new Error(`js/bundle.js contains invalid JavaScript: ${error.message}`);
}

console.log('No build required: js/bundle.js is the maintained prebuilt bundle and passed syntax validation.');
