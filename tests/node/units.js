const os = require('os');
const fs = require('fs-extra');
const { _execCommand } = require('../../src/utils');

const testImport = mode => async (mod, preloadJs) => {
    const indexPath = `${os.tmpdir()}/__index_${mode}.mjs`;

    // 'externals' can be supported in case of 'dynamic' mode
    const importPreloadJs = preloadJs ? `import '${preloadJs}';` : '';

    const snippets = {
        'static': `
            import Mod from '${mod}';
            console.log('static import - Mod:', Mod);
            const ty = typeof Mod;
            if (ty !== 'function' && ty !== 'object') throw 1;
            process.exit(0);
        `,
        'dynamic': `
            ${importPreloadJs}
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
        `,
    };

    fs.writeFileSync(indexPath, snippets[mode]);

    let hasErr = false;
    try {
        const ret = await _execCommand(
            `node --experimental-modules ${indexPath}`);
        console.log('ret:', ret);
    } catch (e) {
        console.log('e.error:', e.error);
        hasErr = true;
    }

    fs.removeSync(indexPath);

    expect(hasErr).toBe(false);
};

const testImportWithMjs = mode => async (mod, preloadJs) => {
    const copy = `${os.tmpdir()}/__copy_${mode}.mjs`;
    fs.copySync(mod, copy);
    await testImport(mode)(copy, preloadJs);
    fs.removeSync(copy);
};

const units = {
    'umd-require': (mod) => {
        const Mod = require(mod);
        console.log('require - Mod:', Mod);
        const ty = typeof Mod;
        expect(ty === 'function' || ty === 'object').toBe(true);
    },
    'umd-import-static': testImport('static'),
    'umd-import-dynamic': testImport('dynamic'),
    'esm-import-static': testImportWithMjs('static'),
    'esm-import-dynamic': testImportWithMjs('dynamic'),
    'esm-compat-require': (mod, preloadJs) => {
        if (preloadJs) require(preloadJs);

        const Mod = require(mod); // Mod: { default: { Foo: [Function: e], Bar: [Function: e] } }
        console.log('require - Mod:', Mod);
        // - also usable as UMD: https://github.com/w3reality/es6-esm-boilerplate#how-it-works
        // - also usable in Observable
        expect(Mod.hasOwnProperty('default')).toBe(true);
    },
    'esm-compat-import-static': testImport('static'),
    'esm-compat-import-dynamic': testImport('dynamic'),
};

module.exports = { units };
