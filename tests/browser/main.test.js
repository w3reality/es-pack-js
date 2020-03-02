const path = require('path');
const fs = require('fs-extra');
const EsPack = require('../../src/index');
const buildTestModule = require('../build');

const outDir = path.join(__dirname, './target');
let libName, libobjName;

beforeAll(async () => {
    fs.removeSync(outDir);

    const ret = await buildTestModule(outDir);
    libName = ret.libName;
    libobjName = ret.libobjName;
});

test('foo', () => {
    expect(1).toBe(1);
});

// describe('Google', () => {
//     beforeAll(async () => {
//         await page.goto('https://google.com');
//     });
//
//     it('should be titled "Google"', async () => {
//         await expect(page.title()).resolves.toMatch('Google');
//     });
// });
