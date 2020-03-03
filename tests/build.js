const path = require('path');
const EsPack = require('../src/index');

const pathRelTests = (rel) => path.join(__dirname, rel);

const testModPath = pathRelTests('../examples/test');
const libName = 'test-mod';
const libobjName = 'TestMod';

const build = async (outDir) => {
    const argv = {
        _: ['build', testModPath],
        outDir,
        libName,
        libobjName,
        module: ['umd', 'esm', 'esm-compat'],
    };
    await (new EsPack({ argv })).runAsApi();
    return { libName, libobjName };
};

module.exports = { build, pathRelTests };
