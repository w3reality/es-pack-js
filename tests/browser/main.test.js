const path = require('path');
const fs = require('fs-extra');
const { build: buildTestModule, pathRelTests } = require('../build');
const { units } = require('./units');

const modPath = pathRelTests('../examples/test');
const libName = 'test-mod';
const libobjName = 'TestMod';

const outDir = pathRelTests('browser/target');
const modUmd = `${outDir}/${libName}.min.js`;
const modEsm = `${outDir}/${libName}.esm.js`;
const modEsmCompat = `${outDir}/${libName}.esm.compat.js`;

const Server = require('./server');
let server = null;

beforeAll(async () => {
    if (1) {
        console.error('!! skipping build !!');
    } else {
        fs.removeSync(outDir);
        await buildTestModule({ outDir, modPath, libName, libobjName });
    }

    server = await (new Server(outDir)).listen();
    console.log('server.port:', server.port);
});

afterAll(async () => {
    console.log('closing server!!');
    server.close();
    server = null;
});

test('umd: tag', async () => units['umd-tag'](modUmd, libobjName, outDir, server.port));

test('esm-compat: tag', async () => units['esm-compat-tag'](modEsmCompat, libobjName, outDir, server.port));

// test('esm: load via static/dynamic `import`', async () => {
//     const page = await browser.newPage();
//     page.on('console', consoleObj => console.log(consoleObj.text())); // https://stackoverflow.com/questions/46198527/puppeteer-log-inside-page-evaluate
//
//     const html = htmlTemplate
//         .replace('__TITLE__', 'static/dynamic import')
//         .replace('__BODY__', `
// <script type="module">
//     window.foo = 42;
//
//     import Mod1 from './test-mod.esm.js';
//     window.Mod1 = Mod1;
//
//     (async () => {
//         const Mod2 = await import('./test-mod.esm.js');
//         window.Mod2 = Mod2;
//     })();
// </script>
//         `);
//     fs.writeFileSync(`${outDir}/index-import.html`, html);
//
//     // NG per CORS
//     // await page.goto(`file:${pathRelTests('browser/target/index-import.html')}`);
//     //====
//     await page.goto(`http://localhost:${server.port}/target/index-import.html`);
//
//     console.log('title:', await page.title());
//
//     let foo = await page.evaluate(() => window['foo']);
//     expect(foo).toBe(42);
//
//     let Mod, ty;
//
//     // static import
//     Mod = await page.evaluate(() => window['Mod1']);
//     console.log('Mod1:', Mod);
//     ty = typeof Mod;
//     expect(ty === 'function' || ty === 'object').toBe(true);
//
//     // dynamic import
//     Mod = await page.evaluate(() => window['Mod2']);
//     console.log('Mod2:', Mod);
//     ty = typeof Mod;
//     expect(Mod.hasOwnProperty('default')).toBe(true);
// });
