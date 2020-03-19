const { units } = require('./units');
const {
    MOD_TYPE: modType,
    MOD_DIR: modDir,
    MOD_NAME: modName,
} = process.env;

// $ MOD_TYPE=umd MOD_PATH=${PWD}/tests/node/target/test-mod.min.js ./jest tests/node/verify.test.js --silent false
// $ MOD_TYPE=esm MOD_PATH=${PWD}/tests/node/target/test-mod.esm.js  ./jest tests/node/verify.test.js --silent false
// $ MOD_TYPE=esm-compat MOD_PATH=${PWD}/tests/node/target/test-mod.esm.compat.js  ./jest tests/node/verify.test.js --silent false

test('env_vals', () => {
    expect(typeof modType).toBe('string');
    expect(typeof modDir).toBe('string');
    expect(typeof modName).toBe('string');
});

const modPath = `${modDir}/${modName}`;

switch (modType) {
    case 'umd':
        test('umd: require', () => units['umd-require'](modPath));
        test('umd: static import', async () => await units['umd-import-static'](modPath));
        test('umd: dynamic import', async () => await units['umd-import-dynamic'](modPath));
        break;
    case 'esm':
        test('esm: static import', async () => await units['esm-import-static'](modPath));
        test('esm: dynamic import', async () => await units['esm-import-dynamic'](modPath));
        break;
    case 'esm-compat':
        test('esm-compat: require', () => units['esm-compat-require'](modPath));
        test('esm-compat: static import', async () => await units['esm-compat-import-static'](modPath));
        test('esm-compat: dynamic import', async () => await units['esm-compat-import-dynamic'](modPath));
        break;
    default:
        console.log('unsupported modType:', modType);
}
