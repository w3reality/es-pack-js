const path = require('path');
const EsPack = require('../src/index');

const pathRelTests = (rel) => path.join(__dirname, rel);

const build = async (args) => {
    const { outDir, modPath, libName, libobjName } = args;
    const argv = {
        _: ['build', modPath],
        outDir,
        libName,
        libobjName,
        module: ['umd', 'esm', 'esm-compat'],
    };
    await (new EsPack({ argv })).runAsApi();
};

module.exports = { build, pathRelTests };
