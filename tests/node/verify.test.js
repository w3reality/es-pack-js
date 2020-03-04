const { units } = require('./units');

// $ MOD_TYPE=umd MOD_PATH=${PWD}/tests/node/target/test-mod.min.js ./jest tests/node/verify.test.js --silent false
// $ MOD_TYPE=esm MOD_PATH=${PWD}/tests/node/target/test-mod.esm.js  ./jest tests/node/verify.test.js --silent false
// $ MOD_TYPE=esm-compat MOD_PATH=${PWD}/tests/node/target/test-mod.esm.compat.js  ./jest tests/node/verify.test.js --silent false

const modType = process.env.MOD_TYPE;
const modPath = process.env.MOD_PATH;
console.log('modType:', modType);
console.log('modPath:', modPath);
if (!modType) throw new Error('MOD_TYPE is required');
if (!modPath) throw new Error('MOD_PATH is required');

switch (modType) {
    case 'umd':
        test('umd: require', () => units['umd-require'](modPath));
        test('umd: import', async () => await units['umd-import'](modPath));
        break;
    case 'esm':
        test('esm: import', async () => await units['esm-import'](modPath));
        break;
    case 'esm-compat':
        test('esm-compat: require', () => units['esm-compat-require'](modPath));
        test('esm-compat: import', async () => await units['esm-compat-import'](modPath));
        break;
    default:
        console.log('unsupported modType:', modType);
}
