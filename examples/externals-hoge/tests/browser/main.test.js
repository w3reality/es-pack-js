const path = require('path');
const fs = require('fs-extra');
const { Server, getBrowser } = require('../../../../src/index');

const libName = 'no-pkg-name';
const outDir = path.join(__dirname, '../../target');
const modPath = `${outDir}/${libName}.min.js`;

const tmpModPath = `${__dirname}/__tmp.min.js`;

let browser = null;

let output;
let server = null;
beforeAll(async () => {
    browser = await getBrowser();
    server = await (new Server(__dirname, /* serveDir */)).listen();

    const tmpHogePath = path.join(__dirname, './__hoge.js');
    fs.copySync(path.join(__dirname, '../../src/hoge.js'), tmpHogePath);
    fs.copySync(modPath, tmpModPath);

    const page = await browser.newPage();
    await page.goto(`http://localhost:${server.port}/index.html`);

    expect(await page.title()).toBe('tests');

    await page.waitForFunction(`typeof window.output === "object"`);
    output = await page.evaluate(() => window.output);

    fs.removeSync(tmpHogePath);
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
test('constructor', () => {
    expect(output['constructor']).toBe('function');
});
test('`new`', () => {
    expect(output['new']).toEqual(['string', 42]);
});

