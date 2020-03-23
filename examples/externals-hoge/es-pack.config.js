const path = require('path');
const fs = require('fs');

module.exports = {
    onBundle: (webpackConfig) => {
        // https://webpack.js.org/configuration/externals/
        webpackConfig.externals = { 'hoge': 'HOGE' };
    },
    onVerify: (preloadJs) => {
        // ├── node_modules
        // │   └── HOGE -> ../src/hoge.js
        const pathNm = path.resolve(__dirname, './node_modules');
        const pathSymlink = pathNm + '/HOGE';
        try { fs.mkdirSync(pathNm); } catch (_) {}
        try { fs.unlinkSync(pathSymlink); } catch (_) {}
        try { fs.symlinkSync('../src/hoge.js', pathSymlink); } catch (_) {}

        preloadJs.node = path.resolve(__dirname, './src/hoge.js');
        preloadJs.browser = path.resolve(__dirname, './src/hoge.js');
    },
};
