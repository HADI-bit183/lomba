/*
 * Compatibility module entry.
 *
 * The HTML pages load bundle.js and ui-refresh.js directly. If an older
 * integration still loads app.js as a module, these imports execute the same
 * maintained files without depending on the removed modular source tree.
 */
import './bundle.js';
import './ui-refresh.js';
