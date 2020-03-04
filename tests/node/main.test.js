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

// TO BE REPLACED BY tests/node/verify.test.js
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

// TO BE REPLACED BY tests/node/verify.test.js
test('umd, esm, esm-compat: load via `import`', async () => {
    const mjs = `${outDir}/${libName}.mjs`;
    fs.copySync(`${outDir}/${libName}.esm.js`, mjs);

    const index = `
let ty;

import Mod from './test-mod.mjs'; // OK
// import Mod from './test-mod.esm.js'; // NG!!
console.log('Mod:', Mod);
ty = typeof Mod;
if (ty !== 'function' && ty !== 'object') throw 1;

import ModEsmCompat from './test-mod.esm.compat.js'; // OK
console.log('ModEsmCompat:', ModEsmCompat);
ty = typeof ModEsmCompat;
if (ty !== 'function' && ty !== 'object') throw 2;

import ModUmd from './test-mod.min.js'; // OK
console.log('ModUmd:', ModUmd);
ty = typeof ModUmd;
if (ty !== 'function' && ty !== 'object') throw 3;

process.exit(0);
    `;
    fs.writeFileSync(`${outDir}/index.mjs`, index);

    let hasErr = false;
    try {
        const ret = await EsPack._execCommand(
            `node --experimental-modules ${outDir}/index.mjs`);
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
