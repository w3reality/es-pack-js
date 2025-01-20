const path = require('path');
const fs = require('fs-extra');
const { Server, getBrowser } = require('../../../../src');

const libName = 'ffi';
const outDir = path.join(__dirname, '../../pkg-es-pack');
const modPath = `${outDir}/${libName}.min.js`;

const tmpModPath = `${__dirname}/__tmp.min.js`;

let browser = null;

let output;
let server = null;
beforeAll(async () => {
    browser = await getBrowser();
    server = await (new Server(__dirname /* serveDir */)).listen();

    fs.copySync(modPath, tmpModPath);

    const page = await browser.newPage();
    await page.goto(`http://localhost:${server.port}/index.html`);

    expect(await page.title()).toBe('tests');

    await page.waitForFunction(`typeof window.output === "object"`);
    output = await page.evaluate(() => window.output);

    fs.removeSync(tmpModPath);
});
afterAll(async () => {
    await browser.close();
    server.close();
    server = null;
});

test('output', () => {
    expect(typeof output).toBe('object');
});
test('MyClass', () => {
    expect(output['results']).toEqual(['object', 10]);
});
