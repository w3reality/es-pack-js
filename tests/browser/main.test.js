
console.log('beforeAll:', beforeAll); // FIXME globals not defined when with `jest-puppeteer` and Node.js v10.13.0

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
