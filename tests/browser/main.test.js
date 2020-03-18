const path = require('path');
const fs = require('fs-extra');
const { build: buildTestModule, pathRelTests } = require('../build');
const { units } = require('./units');

const modPath = pathRelTests('../examples/base');
const libName = 'test-mod';
const libobjName = 'TestMod';

const outDir = pathRelTests('browser/target');
const modUmd = `${outDir}/${libName}.min.js`;
const modEsm = `${outDir}/${libName}.esm.js`;
const modEsmCompat = `${outDir}/${libName}.esm.compat.js`;

const Server = require('./server');
let server = null;

let metaArgs = null;

beforeAll(async () => {
    if (0) { console.error('!! skipping build !!'); } else {
        fs.removeSync(outDir);
        await buildTestModule({ outDir, modPath, libName, libobjName });
    }

    const serverDir = outDir;
    server = await (new Server(serverDir)).listen();
    console.log('server.port:', server.port);

    metaArgs = [libobjName, serverDir, server.port];
});

afterAll(async () => {
    console.log('closing server!!');
    server.close();
    server = null;
});

test('umd: tag', async () => units['umd-tag'](modUmd, ...metaArgs));
test('esm: static import', async () => units['esm-import-static'](modEsm, ...metaArgs));
test('esm: dynamic import', async () => units['esm-import-dynamic'](modEsm, ...metaArgs));
test('esm-compat: tag', async () => units['esm-compat-tag'](modEsmCompat, ...metaArgs));
