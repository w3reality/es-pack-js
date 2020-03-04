const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const EsPack = require('../../src/index');

const testImport = async (modPath) => {
    const code = `
import Mod from '${modPath}';
console.log('Mod:', Mod);
let ty = typeof Mod;
if (ty !== 'function' && ty !== 'object') throw 1;
process.exit(0);
    `;
    const indexPath = `${os.tmpdir()}/index.mjs`;
    fs.writeFileSync(indexPath, code);

    let hasErr = false;
    try {
        const ret = await EsPack._execCommand(
            `node --experimental-modules ${indexPath}`);
        console.log('ret:', ret);
    } catch (e) {
        console.log('e.error:', e.error);
        hasErr = true;
    }
    fs.removeSync(indexPath);

    expect(hasErr).toBe(false);
};

const units = {
    'umd-require': (modPath) => {
        const Mod = require(modPath);
        console.log('Mod:', Mod);
        const ty = typeof Mod;
        expect(ty === 'function' || ty === 'object').toBe(true);
    },
    'umd-import': async (modPath) => {
        await testImport(modPath);
    },
    'esm-import': async (modPath) => {
        const copy = `${os.tmpdir()}/copy.mjs`;
        fs.copySync(modPath, copy);
        await testImport(copy); // `.mjs` extension required
        fs.removeSync(copy);
    },
    'esm-compat-require': (modPath) => {
        const Mod = require(modPath); // Mod: { default: { Foo: [Function: e], Bar: [Function: e] } }
        console.log('Mod:', Mod);
        // - also usable as UMD: https://github.com/w3reality/es6-esm-boilerplate#how-it-works
        // - also usable in Observable
        expect(Mod.hasOwnProperty('default')).toBe(true);
    },
    'esm-compat-import': async (modPath) => {
        await testImport(modPath);
    },
};

module.exports = { units };
