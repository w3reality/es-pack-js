module.exports = {
    onConfigCreated: config => {
        config.output.library = 'FooMod';
        config['JustNotExist'] = 42; // `webpack()` should raise a `WebpackOptionsValidationError`
    },
};
