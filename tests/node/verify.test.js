const { units } = require('./units');
const {
    MOD_TYPE: modType,
    MOD_DIR: modDir,
    MOD_NAME: modName,
    NODE_PRELOAD_JS: preloadJs,
    NODE_UNITS: veriUnits,
} = process.env;

if (typeof modType !== 'string') throw new Error('Invalid `modType`');
if (typeof modDir !== 'string') throw new Error('Invalid `modDir`');
if (typeof modName !== 'string') throw new Error('Invalid `modName`');
const modPath = `${modDir}/${modName}`;

const _veriUnits = veriUnits ? veriUnits.split(',') : null;
const takeUnit = key => !_veriUnits || _veriUnits.includes(key);
const testSkipNoTake = unit => test(`unit: ${unit} [SKIP: due to \`units.node\`]`, () => expect(0).toBe(0));

const testSkipNoSupport = unit => test(`unit: ${unit} [SKIP: static import with \`preloadJs.node\`]`, () => expect(0).toBe(0));

switch (modType) {
    case 'umd':
        {
            const unit = 'umd-require';
            takeUnit(unit) ?
                test(`unit: ${unit}`, () => units[unit](modPath)) :
                testSkipNoTake(unit);
        }

        {
            const unit = 'umd-import-static';
            takeUnit(unit) ?
                test(`unit: ${unit}`, async () => await units[unit](modPath)) :
                testSkipNoTake(unit);
        }

        {
            const unit = 'umd-import-dynamic';
            takeUnit(unit) ?
                test(`unit: ${unit}`, async () => await units[unit](modPath)) :
                testSkipNoTake(unit);
        }

        break;
    case 'esm': {
        {
            const unit = 'esm-import-static';
            takeUnit(unit) ?
                (preloadJs ?
                    testSkipNoSupport(unit) :
                    test(`unit: ${unit}`, async () => await units[unit](modPath))) :
                testSkipNoTake(unit);
        }

        {
            const unit = 'esm-import-dynamic';
            takeUnit(unit) ?
                test(`unit: ${unit}`, async () => await units[unit](modPath, preloadJs)) :
                testSkipNoTake(unit);
        }

        break;
    }
    case 'esm-compat':
        {
            const unit = 'esm-compat-require';
            takeUnit(unit) ?
                test(`unit: ${unit}`, async () => await units[unit](modPath, preloadJs)) :
                testSkipNoTake(unit);
        }

        {
            const unit = 'esm-compat-import-static';
            takeUnit(unit) ?
                (preloadJs ?
                    testSkipNoSupport(unit) :
                    test(`unit: ${unit}`, async () => await units[unit](modPath))) :
                testSkipNoTake(unit);
        }

        {
            const unit = 'esm-compat-import-dynamic';
            takeUnit(unit) ?
                test(`unit: ${unit}`, async () => await units[unit](modPath, preloadJs)) :
                testSkipNoTake(unit);
        }

        break;
    default:
        console.log('unsupported modType:', modType);
}
