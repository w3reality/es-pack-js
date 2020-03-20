const path = require('path');

module.exports = {
    onBuild: () => {
        // !!!! TODO --
        // mkdir -p ./node_modules && ln -sf ../../../node_modules/@babel/standalone ./node_modules/BABEL
    },
    onWebpackConfigCreated: config => {
        // https://webpack.js.org/configuration/externals/
        // { '<module's name in index.js>': '<module's name under node_modules/>' }
        config.externals = { '@babel/standalone': 'BABEL' };
    },
    onVerifyNode: () => {
        return {
            preloadJs: path.resolve(__dirname, './src/preload-node.js'),
        };
    },
    onVerifyBrowser: () => {
        return {
            //preloadJs: path.resolve(__dirname, './node_modules/BABEL/babel.min.js'),
            preloadJs: path.resolve(__dirname, './src/preload-browser.js'), // SHIM approach
        };
    },
};
