module.exports = {
    onBundle: (webpackConfig) => {
        // This should be properly processed by `BundleTask.applyCustom()`,
        // and "test:verify:extconfig" should pass.
        webpackConfig.output.library = 'SuperFoo';
    },
};
