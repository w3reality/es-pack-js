global.require = require;
const path = require('path');

const libName = 'ffi';
const outDir = path.join(__dirname, '../../pkg-es-pack');

const __modPath = `${outDir}/${libName}.min.js`;
// const __modPath = `${outDir}/${libName}.js`; // dev !!

const Mod = require(__modPath);

if (process.version > 'v12.') { // !! FIXME - issues with Node.js 10.x - CompileError: AsyncCompile: Compiling wasm function #21:<?> failed: Invalid opcode (enable with --experimental-wasm-se) @+13578
test('MyClass', async () => {
    const wbg = await Mod.create({nodejs: true});
    expect(typeof Mod.ffi).toBe('object'); // e.g. {"MyClass": [Function A]}
    expect(wbg.run(Mod.ffi)).toBe(10);
});
} // !!
