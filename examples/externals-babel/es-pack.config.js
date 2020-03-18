module.exports = {
    onWebpackConfigCreated: config => {
        // https://webpack.js.org/configuration/externals/
        // { '<module's name in index.js>': '<module's name under node_modules/>' }
        config.externals = { '@babel/standalone': 'BABEL' };
    },
};
