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

const { createServer00 } = require('./server');
let serv = null;

const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
    <title>__TITLE__</title>
</head>
<body>
__BODY__
</body>
</html>
`;

beforeAll(async () => {
    if (1) {
        console.error('!! skipping build !!');
    } else {
        fs.removeSync(outDir);
        await buildTestModule({ outDir, modPath, libName, libobjName });
    }

    serv = await createServer00(pathRelTests('browser'));
    console.log('serv.port:', serv.port);
});

afterAll(async () => {
    console.log('terminating `serv`!!');
    serv._server.close();
    serv = null;
});

test('umd: load via script tag', async () => {
    const page = await browser.newPage();

    const html = htmlTemplate
        .replace('__TITLE__', 'script tag')
        .replace('__BODY__', `<script src='./test-mod.min.js'></script>`);
    fs.writeFileSync(`${outDir}/index-tag.html`, html);

    // await page.goto(`file:${pathRelTests('browser/target/index-tag.html')}`);
    await page.goto(`http://localhost:${serv.port}/target/index-tag.html`);

    console.log('title:', await page.title());

    console.log('libobjName:', libobjName); // TODO !!!! refactor `TestMod`
    const ret = await page.evaluate(() => typeof window['TestMod']);
    expect(ret).toBe('object');
});

test('esm: load via static/dynamic `import`', async () => {
    const page = await browser.newPage();
    page.on('console', consoleObj => console.log(consoleObj.text())); // https://stackoverflow.com/questions/46198527/puppeteer-log-inside-page-evaluate

    const html = htmlTemplate
        .replace('__TITLE__', 'static/dynamic import')
        .replace('__BODY__', `
<script type="module">
    window.foo = 42;

    import Mod1 from './test-mod.esm.js';
    window.Mod1 = Mod1;

    (async () => {
        const Mod2 = await import('./test-mod.esm.js');
        window.Mod2 = Mod2;
    })();
</script>
        `);
    fs.writeFileSync(`${outDir}/index-import.html`, html);

    // NG per CORS
    // await page.goto(`file:${pathRelTests('browser/target/index-import.html')}`);
    //====
    await page.goto(`http://localhost:${serv.port}/target/index-import.html`);

    console.log('title:', await page.title());

    let foo = await page.evaluate(() => window['foo']);
    expect(foo).toBe(42);

    let Mod, ty;

    // static import
    Mod = await page.evaluate(() => window['Mod1']);
    console.log('Mod1:', Mod);
    ty = typeof Mod;
    expect(ty === 'function' || ty === 'object').toBe(true);

    // dynamic import
    Mod = await page.evaluate(() => window['Mod2']);
    console.log('Mod2:', Mod);
    ty = typeof Mod;
    expect(Mod.hasOwnProperty('default')).toBe(true);
});
