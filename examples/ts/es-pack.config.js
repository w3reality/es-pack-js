const path = require('path');

module.exports = {
    onBundle: (webpackConfig, webpack) => {
        webpackConfig.entry = path.resolve(__dirname, './src/index.ts');
    },
};
