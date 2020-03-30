module.exports = {
    onVerify: (preloadJs, units) => {
        // Due to the `window` symbol in `dat.gui`, node-verify only these units
        units.node.push('umd-require', 'esm-compat-require');
    },
};
