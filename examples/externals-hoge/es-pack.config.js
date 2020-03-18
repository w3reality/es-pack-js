const path = require('path');

module.exports = {
    onWebpackConfigCreated: config => {
        // https://webpack.js.org/configuration/externals/
        config.externals = { 'hoge': 'HOGE' };
    },
    onVerifyNode: () => { // not being used; STUB interface
        // nop
    },
    onVerifyBrowser: () => {
        return { // TODO rename to `preloadjs`
            preloadJs: path.resolve(__dirname, './src/hoge.js'),
        };
    },
};
