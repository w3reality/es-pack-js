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

    const htmlFile = '__index-tag.html';
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

const testImport = mode => async (mod, _libobjName, serveDir, port) => {
    console.log('mod:', mod);
    const copyFile = '__copy.esm.js';
    const copyPath = `${serveDir}/${copyFile}`;
    fs.copySync(mod, copyPath);

    const snippets = {
        'static': `
            import Mod from './${copyFile}';
            window.Mod = Mod;
        `,
        'dynamic': `
            (async () => {
                const Mod = await import('./${copyFile}');
                window.Mod = Mod;
            })();
        `,
    };

    const page = await browser.newPage();
    page.on('console', obj => console.log(obj.text())); // https://stackoverflow.com/questions/46198527/puppeteer-log-inside-page-evaluate

    const htmlFile = '__index-import.html';
    const htmlPath = `${serveDir}/${htmlFile}`;
    const html = htmlTemplate
        .replace('__TITLE__', `${mode} import`)
        .replace('__BODY__', `<script type="module">window.foo = 42; ${snippets[mode]}</script>`);
    fs.writeFileSync(htmlPath, html);

    // await page.goto(`file:${htmlPath}`); // NG per CORS
    await page.goto(`http://localhost:${port}/${htmlFile}`);

    console.log('title:', await page.title());

    expect(await page.evaluate(() => window['foo'])).toBe(42);

    let Mod = await page.evaluate(() => window['Mod']);
    console.log(`${mode} import - Mod:`, Mod);

    if (mode === 'dynamic') {
        expect(Mod.hasOwnProperty('default')).toBe(true);
        Mod = Mod.default;
    }

    const ty = typeof Mod;
    expect(ty === 'function' || ty === 'object').toBe(true);

    fs.removeSync(htmlPath);
    fs.removeSync(copyPath);
};

const units = {
    'umd-tag': testTag,
    'esm-import-static': testImport('static'),
    'esm-import-dynamic': testImport('dynamic'),
    'esm-compat-tag': testTag,
};

module.exports = { units };
