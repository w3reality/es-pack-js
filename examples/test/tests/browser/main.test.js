const path = require('path');
const esPackJs = path.join(__dirname, '../../../../src/index');
const EsPack = require(esPackJs); // emulating `require('es-pack-js')`

let server = null;
beforeAll(async () => {
    const serveDir = __dirname;
    server = await (new EsPack.Server(serveDir)).listen();
});
afterAll(async () => {
    server.close();
    server = null;
});

test('`EsPack.Server` instance', () => {
    expect(typeof server).toBe('object');
});
test('`server.port`', () => {
    expect(typeof server.port).toBe('number');
});
test('`browser`', () => {
    expect(typeof browser).toBe('object');
});
test('`page.title()`', async () => {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${server.port}/index.html`);
    expect(await page.title()).toBe('42');
});
