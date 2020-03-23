const path = require('path');
const fs = require('fs');

module.exports = {
    onBundle: (webpackConfig) => {
        // https://webpack.js.org/configuration/externals/
        // { '<module's name in index.js>': '<module's name under node_modules/>' }
        webpackConfig.externals = { '@babel/standalone': 'BABEL' };
    },
    onVerify: (preloadJs) => {
        // ├── node_modules
        // │   └── BABEL -> ../../../node_modules/@babel/standalone
        const pathNm = path.resolve(__dirname, './node_modules');
        const pathSymlink = pathNm + '/BABEL';
        try { fs.mkdirSync(pathNm); } catch (_) {}
        try { fs.unlinkSync(pathSymlink); } catch (_) {}
        try { fs.symlinkSync('../../../node_modules/@babel/standalone', pathSymlink); } catch (_) {}

        preloadJs.node = path.resolve(__dirname, './tests/node/preload.js');
        // preloadJs.browser = path.resolve(__dirname, './node_modules/BABEL/babel.min.js'); // NG in this case because the external symbol exposed is `Babal` not `BABEL`
        preloadJs.browser = path.resolve(__dirname, './tests/browser/preload.js'); // SHIM approach
    },
};
