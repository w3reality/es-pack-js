const path = require('path');
const EsPack = require('../src/index');

const testModPath = path.join(__dirname, '../examples/test');
const libName = 'test-mod';
const libobjName = 'TestMod';

const buildTestModule = async (outDir) => {
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

module.exports = buildTestModule;
