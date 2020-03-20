window.BABEL = {}; // SHIM for 'verify browser esm static/dynamic import'

// In 'test' stages (not 'verify' stages), we should indeed
// load ./node_modules/BABEL/babel.min.js and set up like
// window.BABEL = Babel; // babel.min.js exposes the symbol `Babel`
