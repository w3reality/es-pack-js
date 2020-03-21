const path = require('path');

module.exports = {
    onBundle: (webpackConfig) => {
        // https://webpack.js.org/configuration/externals/
        webpackConfig.externals = { 'hoge': 'HOGE' };
    },
    onVerify: (preloadJs) => {
        // !!!! TODO --
        // mkdir -p ./node_modules && ln -sf ../src/hoge.js ./node_modules/HOGE

        preloadJs.node = path.resolve(__dirname, './src/hoge.js');
        preloadJs.browser = path.resolve(__dirname, './src/hoge.js');
    },
};
