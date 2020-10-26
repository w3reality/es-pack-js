module.exports = {
    onBundle: (webpackConfig) => {
        // Keep async/await to work around "ReferenceError: regeneratorRuntime is not defined"
        for (let rule of webpackConfig.module.rules) {
            if (rule.loader === 'babel-loader') {
                rule.options.presets = [['@babel/preset-env', {targets: {node: '10'}, modules: false}]];
            }
        }
    },
};
