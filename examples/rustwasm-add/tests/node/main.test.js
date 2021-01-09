global.require = require;
const path = require('path');

const libName = 'add';
const outDir = path.join(__dirname, '../../pkg-es-pack');

const __modPath = `${outDir}/${libName}.min.js`;
// const __modPath = `${outDir}/${libName}.js`; // dev !!

const Add = require(__modPath);

test('plain', async () => {
    const wbg = await (new Add({nodejs: true})).init();
    expect(wbg.add(2, 2)).toBe(4);
});
test('sugar', async () => {
    const wbg = await Add.create({nodejs: true});
    expect(wbg.add(2, 2)).toBe(4);
});
test('raw', async () => {
    const mod = new Add({nodejs: true});
    const wbg = await mod.init();
    const wasm = mod.getWasm();
    expect(wbg.add(2, 2)).toBe(4);
    expect(typeof wasm['memory']).toBe('object');
});
