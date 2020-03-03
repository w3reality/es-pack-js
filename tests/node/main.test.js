const path = require('path');
const fs = require('fs-extra');
const EsPack = require('../../src/index');
const { build: buildTestModule, pathRelTests } = require('../build');

const outDir = pathRelTests('node/target');
let libName, libobjName;

beforeAll(async () => {
    if (0) return console.error('!! skipping build !!');

    // nop when the file/dir does not exist - https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove-sync.md
    fs.removeSync(outDir);

    const ret = await buildTestModule(outDir);
    libName = ret.libName;
    libobjName = ret.libobjName;
});

test('umd, esm-compat: load via `require()`', () => {
    const ModUmd = require(`${outDir}/${libName}.min`); // ModUmd: { Foo: [Function: e], Bar: [Function: e] }
    console.log('ModUmd:', ModUmd);
    const ty = typeof ModUmd;
    expect(ty === 'function' || ty === 'object').toBe(true);

    const ModEsmCompat = require(`${outDir}/${libName}.esm.compat`); // ModEsmCompat: { default: { Foo: [Function: e], Bar: [Function: e] } }
    console.log('ModEsmCompat:', ModEsmCompat);
    // - also usable as UMD: https://github.com/w3reality/es6-esm-boilerplate#how-it-works
    // - also usable in Observable
    expect(ModEsmCompat.hasOwnProperty('default')).toBe(true);
});

test('umd, esm, esm-compat: load via `import`', async () => {
    const mjs = `${outDir}/${libName}.mjs`;
    fs.copySync(`${outDir}/${libName}.esm.js`, mjs);

    let hasErr = false;
    try {
        const index = pathRelTests('node/index.mjs');
        const ret = await EsPack._execCommand(`node --experimental-modules ${index}`);
        console.log('ret:', ret);
    } catch (e) {
        console.log('e.error:', e.error);
        hasErr = true;
    }
    expect(hasErr).toBe(false);
});

test('umd: functionality (specific to TestMod)', () => {
    const Mod = require(`${outDir}/${libName}.min`); // Mod: { Foo: [Function: e], Bar: [Function: e] }
    console.log('Mod:', Mod);

    expect(Mod.hasOwnProperty('Foo')).toBe(true);
    expect(Mod.hasOwnProperty('Bar')).toBe(true);

    const { Foo, Bar } = Mod;
    expect(typeof Foo).toBe('function');
    expect(typeof Bar).toBe('function');

    const foo = new Foo();
    expect(foo.add(1,2)).toBe(3);

    const bar = new Bar();
    expect(bar.num).toBe(42);
});
