const path = require('path');
const fs = require('fs-extra');
const EsPack = require('../../src/index');
const { build: buildTestModule, pathRelTests } = require('../build');

const outDir = pathRelTests('browser/target');
let libName, libobjName;

const express = require('express');
const createExpressServer = port => {
    const _app = express();
    _app.use('/', express.static(pathRelTests('browser')));

    return new Promise((res, rej) => {
        try {
            const _server = _app.listen(port, 'localhost', () => {
                const port = _server.address().port;
                // console.log(`listening on port ${port}`);
                res({ _app, _server, port });
            });
        } catch (err) {
            rej(err);
        }
    });
};
let serv = null;

beforeAll(async () => {
    if (0) {
        console.error('!! skipping build !!');
    } else {
        fs.removeSync(outDir);

        const ret = await buildTestModule(outDir);
        libName = ret.libName;
        libobjName = ret.libobjName;
    }

    const port = 0; // 0: will search for an available port
    serv = await createExpressServer(port);
    console.log('serv.port:', serv.port);
});

afterAll(async () => {
    console.log('terminating `serv`!!');
    serv._server.close();
    serv = null;
});

test('umd: load via script tag', async () => {
    const page = await browser.newPage();

    // await page.goto(`file:${pathRelTests('browser/index-tag.html')}`);
    await page.goto(`http://localhost:${serv.port}/index-tag.html`);
    console.log('title:', await page.title());

    console.log('libobjName:', libobjName); // TODO !!!! refactor `TestMod`
    const ret = await page.evaluate(() => typeof window['TestMod']);
    expect(ret).toBe('object');
});

test('esm: load via static/dynamic `import`', async () => {
    const page = await browser.newPage();

    page.on('console', consoleObj => console.log(consoleObj.text())); // https://stackoverflow.com/questions/46198527/puppeteer-log-inside-page-evaluate

    // NG per CORS
    // await page.goto(`file:${pathRelTests('browser/index-import.html')}`);
    //====
    await page.goto(`http://localhost:${serv.port}/index-import.html`);

    console.log('title:', await page.title());

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

    let foo = await page.evaluate(() => window['foo']);
    expect(foo).toBe(42);
});
