const path = require('path');
const fs = require('fs-extra');
const { build: buildTestModule, pathRelTests } = require('../build');
const { units } = require('./units');

const modPath = pathRelTests('../examples/base');
const libName = 'test-mod';
const libobjName = 'TestMod';

const outDir = pathRelTests('node/target');
const modUmd = `${outDir}/${libName}.min.js`;
const modEsm = `${outDir}/${libName}.esm.js`;
const modEsmCompat = `${outDir}/${libName}.esm.compat.js`;

beforeAll(async () => {
    if (0) { return console.error('!! skipping build !!'); }

    fs.removeSync(outDir);
    await buildTestModule({ outDir, modPath, libName, libobjName });
});

test('umd: require', () => units['umd-require'](modUmd));
test('umd: static import', async () => await units['umd-import-static'](modUmd));
test('umd: dynamic import', async () => await units['umd-import-dynamic'](modUmd));

test('esm: static import', async () => await units['esm-import-static'](modEsm));
test('esm: dynamic import', async () => await units['esm-import-dynamic'](modEsm));

test('esm-compat: require', () => units['esm-compat-require'](modEsmCompat));
test('esm-compat: static import', async () => await units['esm-compat-import-static'](modEsmCompat));
test('esm-compat: dynamic import', async () => await units['esm-compat-import-dynamic'](modEsmCompat));

test('functionality: umd TestMod', () => {
    const Mod = require(`${outDir}/test-mod.min`); // Mod: { Foo: [Function: e], Bar: [Function: e] }
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


const { exitCodeOf } = require('../../src/utils');
const esp = pathRelTests('../bin/es-pack');

test('exit_code: bare', async () => {
    // expect(await exitCodeOf('ls')).toBe('0'); // debug
    // expect(await exitCodeOf('ls --noexist')).toBe('1'); // debug
    expect(await exitCodeOf(`${esp}`)).toBe('1');
});
test('exit_code: build', async () => {
    expect(await exitCodeOf(`${esp} build ${modPath}`)).toBe('0');
});
test('exit_code: build - noexist', async () => {
    expect(await exitCodeOf(`${esp} build ${modPath}_noexist`)).toBe('1');
});
test('exit_code: build - WebpackOptionsValidationError', async () => {
    const examplePath = pathRelTests('../examples/webpack-exception');
    expect(fs.existsSync(examplePath)).toBe(true);
    expect(await exitCodeOf(`${esp} build ${examplePath}`)).toBe('1');
});
test('exit_code: build - wrong external config property', async () => {
    const examplePath = pathRelTests('../examples/extconfig-exception');
    expect(fs.existsSync(examplePath)).toBe(true);
    expect(await exitCodeOf(`${esp} build ${examplePath}`)).toBe('1');
});
test('exit_code: test', async () => {
    // $ esp test --node examples/base
    // PASS examples/base/tests/node/will-pass.test.js
    expect(await exitCodeOf(`${esp} test --node ${modPath}`)).toBe('0');
});
test('exit_code: test - noexist', async () => {
    expect(await exitCodeOf(`${esp} test --node ${modPath}_noexist`)).toBe('1');
});
test('exit_code: test - demand at least one preset', async () => {
    expect(await exitCodeOf(`${esp} test ${modPath}`)).toBe('1');
});
