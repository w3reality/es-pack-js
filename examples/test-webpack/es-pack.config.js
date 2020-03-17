module.exports = {
    onWebpackConfigCreated: config => {
        config['JustNotExist'] = 42; // `webpack()` should raise a `WebpackOptionsValidationError`
    },
};
