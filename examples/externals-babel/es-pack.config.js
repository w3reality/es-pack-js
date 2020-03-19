const path = require('path');

module.exports = {
    onBuild: () => {
        // !!!!!!!! TODO: setup symlink ./node_modules/BABEL
    },
    onWebpackConfigCreated: config => {
        // https://webpack.js.org/configuration/externals/
        // { '<module's name in index.js>': '<module's name under node_modules/>' }
        config.externals = { '@babel/standalone': 'BABEL' };
    },
    onVerifyNode: () => {
        return {
            preloadJs: path.resolve(__dirname, './src/preload.js'),
        };
    },
};
