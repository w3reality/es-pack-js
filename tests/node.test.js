const path = require('path');
const fs = require('fs-extra');
const EsPack = require('../src/index');

// console.log('__dirname:', __dirname);
const testPkgPath = path.join(__dirname, '../examples/test');
const outDir = path.join(__dirname, './target');
const libName = 'test-mod';
const libobjName = 'TestMod';

beforeAll(() => {
    if (0) return console.error('!!!! skipping build !!!!');

    // nop when the file/dir does not exist - https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove-sync.md
    fs.removeSync(outDir);

    const argv = {
        _: [testPkgPath],
        outDir,
        libName,
        libobjName,
        module: ['umd', 'esm', 'esm-compat'],
    };
    return (new EsPack({ argv })).runAsApi();
});

// beforeEach(async done => {
//     mod = {r: Math.random(), add: (a, b) => a + b};
//     console.log('beforeEach: new and init!! mod:', mod);
//
//     // await fetch();
//     done();
// });

// afterEach(async done => {
//     mod = null;
//     console.log('afterEach: cleanup!! mod:', mod);
//
//     // await fetch();
//     done();
// });

const testTestMod = Mod => {
    expect(Mod.hasOwnProperty('Foo')).toBe(true);
    expect(Mod.hasOwnProperty('Bar')).toBe(true);

    const { Foo, Bar } = Mod;
    expect(typeof Foo).toBe('function');
    expect(typeof Bar).toBe('function');

    const foo = new Foo();
    expect(foo.add(1,2)).toBe(3);

    const bar = new Bar();
    expect(bar.num).toBe(42);
}

test('umd: via `require()`', () => {
    const Mod = require(`${outDir}/${libName}.min`); // Mod: { Foo: [Function: e], Bar: [Function: e] }
    console.log('Mod:', Mod);

    testTestMod(Mod);
});

test('esm-compat: via `require()`', () => {
    const Mod = require(`${outDir}/${libName}.esm.compat`); // Mod: { default: { Foo: [Function: e], Bar: [Function: e] } }
    // - also usable as UMD: https://github.com/w3reality/es6-esm-boilerplate#how-it-works
    // - also usable in Observable

    console.log('Mod:', Mod);
    expect(Mod.hasOwnProperty('default')).toBe(true);

    testTestMod(Mod.default);
});

test('umd, esm, esm-compat: via `import`', async () => {
    const mjs = `${outDir}/${libName}.mjs`;
    fs.copySync(`${outDir}/${libName}.esm.js`, mjs);

    let hasErr = false;
    try {
        const index = path.join(__dirname, './index.mjs');
        const ret = await EsPack._execCommand(index);
        console.log('ret:', ret);
    } catch (_err) {
        console.log('_err:', _err);
        hasErr = true;
    }
    expect(hasErr).toBe(false);
});
