global.require = require;
const path = require('path');

const libName = 'ffi';
const outDir = path.join(__dirname, '../../pkg-es-pack');

const __modPath = `${outDir}/${libName}.min.js`;
// const __modPath = `${outDir}/${libName}.js`; // dev !!

const Mod = require(__modPath);

test('MyClass', async () => {
    const wbg = await Mod.create({nodejs: true});
    expect(typeof Mod.ffi).toBe('object'); // e.g. {"MyClass": [Function A]}
    expect(wbg.run(Mod.ffi)).toBe(10);
});
