const path = require('path');

module.exports = {
    onBundle: (webpackConfig) => {
        // https://webpack.js.org/configuration/externals/
        // { '<module's name in index.js>': '<module's name under node_modules/>' }
        webpackConfig.externals = { '@babel/standalone': 'BABEL' };
    },
    onVerify: (preloadJs) => {
        // !!!! TODO --
        // mkdir -p ./node_modules && ln -sf ../../../node_modules/@babel/standalone ./node_modules/BABEL

        preloadJs.node = path.resolve(__dirname, './tests/node/preload.js');
        // preloadJs.browser = path.resolve(__dirname, './node_modules/BABEL/babel.min.js'); // NG in this case because the external symbol exposed is `Babal` not `BABEL`
        preloadJs.browser = path.resolve(__dirname, './tests/browser/preload.js'); // SHIM approach
    },
};
