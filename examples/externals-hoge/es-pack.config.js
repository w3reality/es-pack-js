const path = require('path');

module.exports = {
    onBuild: () => {
        // !!!!!!!! TODO: setup symlink ./node_modules/HOGE
    },
    onWebpackConfigCreated: config => {
        // https://webpack.js.org/configuration/externals/
        config.externals = { 'hoge': 'HOGE' };
    },
    onVerifyNode: () => {
        return {
            preloadJs: path.resolve(__dirname, './src/hoge.js'),
        };
    },
    onVerifyBrowser: () => {
        return {
            preloadJs: path.resolve(__dirname, './src/hoge.js'),
        };
    },
};
