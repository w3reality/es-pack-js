const path = require('path');

const BABEL = require(path.resolve(__dirname, '../../node_modules/BABEL'));
global['BABEL'] = BABEL; // node: esm-import-dynamic, esm-compat-{require,import-dynamic}
module.exports = BABEL; // node: umd-require
