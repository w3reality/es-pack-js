const path = require('path');
const fs = require('fs-extra');
const { Server } = require('../../../../src');

const libName = 'no-pkg-name';
const outDir = path.join(__dirname, '../../target');
const modPath = `${outDir}/${libName}.min.js`;

const tmpModPath = `${__dirname}/__tmp.min.js`;

let output;
let server = null;
beforeAll(async () => {
    const serveDir = __dirname;
    server = await (new Server(serveDir)).listen();

    fs.copySync(modPath, tmpModPath);

    const page = await browser.newPage();
    await page.goto(`http://localhost:${server.port}/index.html`);

    expect(await page.title()).toBe('tests');

    await page.waitForFunction(`typeof window.output === "object"`);
    output = await page.evaluate(() => window.output);

    fs.removeSync(tmpModPath);
});
afterAll(async () => {
    server.close();
    server = null;
});

test('output', () => {
    expect(typeof output).toBe('object');
});
test('misc', () => {
    expect(output['results']).toEqual([42, false, 'number']);
});
