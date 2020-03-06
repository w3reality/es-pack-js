const os = require('os');
const fs = require('fs-extra');

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
const testTag = async (mod, libobjName, serveDir, port) => {
    console.log('mod:', mod);
    const copyFile = '__copy.min.js';
    const copyPath = `${serveDir}/${copyFile}`;
    fs.copySync(mod, copyPath);

    const page = await browser.newPage();
    const htmlFile = 'index-tag.html';
    const htmlPath = `${serveDir}/${htmlFile}`;
    const html = htmlTemplate
        .replace('__TITLE__', 'script tag')
        .replace('__BODY__', `<script src='./${copyFile}'></script>`);
    fs.writeFileSync(htmlPath, html);

    // await page.goto(`file:${htmlPath}`);
    await page.goto(`http://localhost:${port}/${htmlFile}`);

    console.log('title:', await page.title());
    const ret = await page.evaluate((libobjName) => typeof window[libobjName], libobjName);
    expect(ret).toBe('object');

    fs.removeSync(htmlPath);
    fs.removeSync(copyPath);
};

const testImport = mode => async (mod, libobjName, serveDir, port) => {
    expect(1).toBe(100); return; // !!!!!!!!!!!!!
    // begin TODO *****************************

    const page = await browser.newPage();
    page.on('console', obj => console.log(obj.text())); // https://stackoverflow.com/questions/46198527/puppeteer-log-inside-page-evaluate

    const html = htmlTemplate
        .replace('__TITLE__', `${mode} import`)
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
    await page.goto(`http://localhost:${server.port}/target/index-import.html`);

    console.log('title:', await page.title());

    let foo = await page.evaluate(() => window['foo']);
    expect(foo).toBe(42);
    // end TODO *****************************

    switch (mode) {
        case 'static': {
            const Mod = await page.evaluate(() => window['Mod1']);
            console.log('static import - Mod:', Mod);
            const ty = typeof Mod;
            expect(ty === 'function' || ty === 'object').toBe(true);
            break;
        }
        case 'dynamic': {
            const Mod = await page.evaluate(() => window['Mod2']);
            console.log('dynamic import - Mod:', Mod);
            expect(Mod.hasOwnProperty('default')).toBe(true);
            break;
        }
        default: throw `invalid mode: ${mode}`;
    }
};

const units = {
    'umd-tag': testTag,
    'esm-import-static': testImport('static'),
    'esm-import-dynamic': testImport('dynamic'),
    'esm-compat-tag': testTag,
};

module.exports = { units };
