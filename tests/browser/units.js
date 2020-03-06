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

const units = {
    'umd-tag': async (mod, libobjName, serveDir, port) => {
        const copyFile = '__copy.min.js'
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
    },
    'esm-import-static': async (mod) => {
    },
    'esm-import-dynamic': async (mod) => {
    },
    'esm-compat-tag': async (mod) => {
    },
};

module.exports = { units };
