const path = require('path');

module.exports = {
    onWebpackConfigCreated: config => {
        // https://webpack.js.org/configuration/externals/
        config.externals = { 'hoge': 'HOGE' };
    },
    onVerify: () => {
        // !!!! TODO --
        // mkdir -p ./node_modules && ln -sf ../src/hoge.js ./node_modules/HOGE

        return {
            preloadJs: {
                node: path.resolve(__dirname, './src/hoge.js'),
                browser: path.resolve(__dirname, './src/hoge.js'),
            },
        };
    },
};
