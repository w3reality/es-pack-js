const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const EsPack = require('../../src/index');

const testImport = async (mod) => {
    const snippet = `
import Mod from '${mod}';
console.log('Mod:', Mod);
let ty = typeof Mod;
if (ty !== 'function' && ty !== 'object') throw 1;
process.exit(0);
    `;
    const indexPath = `${os.tmpdir()}/index.mjs`;
    fs.writeFileSync(indexPath, snippet);

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
    'umd-require': (mod) => {
        const Mod = require(mod);
        console.log('Mod:', Mod);
        const ty = typeof Mod;
        expect(ty === 'function' || ty === 'object').toBe(true);
    },
    'umd-import': async (mod) => {
        await testImport(mod);
    },
    'esm-import': async (mod) => {
        const copy = `${os.tmpdir()}/copy.mjs`;
        fs.copySync(mod, copy);
        await testImport(copy); // `.mjs` extension required
        fs.removeSync(copy);
    },
    'esm-compat-require': (mod) => {
        const Mod = require(mod); // Mod: { default: { Foo: [Function: e], Bar: [Function: e] } }
        console.log('Mod:', Mod);
        // - also usable as UMD: https://github.com/w3reality/es6-esm-boilerplate#how-it-works
        // - also usable in Observable
        expect(Mod.hasOwnProperty('default')).toBe(true);
    },
    'esm-compat-import': async (mod) => {
        await testImport(mod);
    },
};

module.exports = { units };
