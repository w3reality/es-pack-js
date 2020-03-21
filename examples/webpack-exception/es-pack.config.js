module.exports = {
    onBundle: (webpackConfig) => {
        webpackConfig['JustNotExist'] = 42; // `webpack()` should raise a `WebpackOptionsValidationError`
    },
};
