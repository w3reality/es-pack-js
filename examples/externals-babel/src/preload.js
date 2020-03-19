const path = require('path');

const BABEL = require(path.resolve(__dirname, '../node_modules/BABEL'));

global['BABEL'] = BABEL; // node esm dynamic import

module.exports = BABEL;
