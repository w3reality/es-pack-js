const path = require('path');
const fs = require('fs-extra');
const { Server } = require('../../../../src/index');

const libName = 'no-pkg-name';
const outDir = path.join(__dirname, '../../target');
const modPath = `${outDir}/${libName}.min.js`;

const tmpModPath = `${__dirname}/__tmp.min.js`;

let output;
let server = null;
beforeAll(async () => {
    const serveDir = __dirname;
    server = await (new Server(serveDir)).listen();

    const tmpBabelPath = path.join(__dirname, './__babel.min.js');
    fs.copySync(path.join(__dirname, '../../node_modules/BABEL/babel.min.js'), tmpBabelPath);
    fs.copySync(modPath, tmpModPath);

    const page = await browser.newPage();
    await page.goto(`http://localhost:${server.port}/index.html`);

    expect(await page.title()).toBe('tests');

    await page.waitForFunction(`typeof window.output === "object"`);
    output = await page.evaluate(() => window.output);

    fs.removeSync(tmpBabelPath);
    fs.removeSync(tmpModPath);
});
afterAll(async () => {
    server.close();
    server = null;
});

test('output', () => {
    expect(typeof output).toBe('object');
});
test('constructor', () => {
    expect(output['constructor']).toBe('function');
});
test('`new`', () => {
    expect(output['new']).toEqual(['string']);
});

