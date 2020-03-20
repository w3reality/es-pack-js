const path = require('path');

module.exports = {
    onWebpackConfigCreated: config => {
        // https://webpack.js.org/configuration/externals/
        // { '<module's name in index.js>': '<module's name under node_modules/>' }
        config.externals = { '@babel/standalone': 'BABEL' };
    },
    onVerify: () => {
        // !!!! TODO --
        // mkdir -p ./node_modules && ln -sf ../../../node_modules/@babel/standalone ./node_modules/BABEL
        return {
            preloadJs: {
                node: path.resolve(__dirname, './src/preload-node.js'),
                //browser: path.resolve(__dirname, './node_modules/BABEL/babel.min.js'),
                browser: path.resolve(__dirname, './src/preload-browser.js'), // SHIM approach
            },//-----
        };
    },
};
