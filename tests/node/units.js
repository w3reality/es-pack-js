const os = require('os');
const fs = require('fs-extra');
const EsPack = require('../../src/index');

const testImport = async (mod, snippet) => {
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
const testImportStatic = async (mod) => {
    await testImport(mod, `
        import Mod from '${mod}';
        console.log('static import -Mod:', Mod);
        const ty = typeof Mod;
        if (ty !== 'function' && ty !== 'object') throw 1;
        process.exit(0);
    `);
};
const testImportDynamic = async (mod) => {
    await testImport(mod, `
        (async () => {
            try {
                const Mod = (await import('${mod}')).default;
                console.log('dynamic import - Mod:', Mod);
                const ty = typeof Mod;
                if (ty !== 'function' && ty !== 'object') throw 1;
                process.exit(0);
            } catch (e) {
                process.exit(1);
            }
        })();
    `);
};

const units = {
    'umd-require': (mod) => {
        const Mod = require(mod);
        console.log('require - Mod:', Mod);
        const ty = typeof Mod;
        expect(ty === 'function' || ty === 'object').toBe(true);
    },
    'umd-import-static': async (mod) => {
        await testImportStatic(mod);
    },
    'umd-import-dynamic': async (mod) => {
        await testImportDynamic(mod);
    },
    'esm-import-static': async (mod) => {
        const copy = `${os.tmpdir()}/copy.mjs`;
        fs.copySync(mod, copy);
        await testImportStatic(copy); // `.mjs` extension required
        fs.removeSync(copy);
    },
    'esm-import-dynamic': async (mod) => {
        const copy = `${os.tmpdir()}/copy.mjs`;
        fs.copySync(mod, copy);
        await testImportDynamic(copy); // `.mjs` extension required
        fs.removeSync(copy);
    },
    'esm-compat-require': (mod) => {
        const Mod = require(mod); // Mod: { default: { Foo: [Function: e], Bar: [Function: e] } }
        console.log('require - Mod:', Mod);
        // - also usable as UMD: https://github.com/w3reality/es6-esm-boilerplate#how-it-works
        // - also usable in Observable
        expect(Mod.hasOwnProperty('default')).toBe(true);
    },
    'esm-compat-import-static': async (mod) => {
        await testImportStatic(mod);
    },
    'esm-compat-import-dynamic': async (mod) => {
        await testImportDynamic(mod);
    },
};

module.exports = { units };
