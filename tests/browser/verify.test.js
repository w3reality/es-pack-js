const { units } = require('./units');
const {
    MOD_TYPE: modType,
    MOD_DIR: modDir,
    MOD_NAME: modName,
    BROWSER_LIBOBJ_NAME: libobjName,
    BROWSER_PRELOAD_JS: preloadJs,
    BROWSER_UNITS: veriUnits,
    NODE_PATH: nodePath,
} = process.env;

if (typeof modType !== 'string') throw new Error('Invalid `modType`');
if (typeof modDir !== 'string') throw new Error('Invalid `modDir`');
if (typeof modName !== 'string') throw new Error('Invalid `modName`');
const modPath = `${modDir}/${modName}`;

const _veriUnits = veriUnits ? veriUnits.split(',') : null;
const takeUnit = key => !_veriUnits || _veriUnits.includes(key);
const testSkipNoTake = unit => test(`unit: ${unit} [SKIP: due to \`units.browser\`]`, () => expect(0).toBe(0));

//

const os = require('os');
const isMacOS = os.platform() === 'darwin';
const fs = require('fs');
const { getBrowser } = require('./browser');
let browser = null;

const Server = require('./server');
let server = null;

beforeAll(async () => {
    // 'es-pack-sparse-VerifyTask' context
    const customPuppeteerMacUseSelf = `${nodePath}/../macos/node_modules/puppeteer`;
    const customPuppeteerMacUseDep = `${nodePath}/es-pack-js/macos/node_modules/puppeteer`;
    const customPuppeteerMac = fs.existsSync(customPuppeteerMacUseSelf) ?
        customPuppeteerMacUseSelf : customPuppeteerMacUseDep;

    const customPuppeteer = isMacOS ? require(customPuppeteerMac) : undefined;
    browser = await getBrowser(customPuppeteer);

    const serverDir = modDir;
    server = await (new Server(serverDir)).listen();
    console.log('server.port:', server.port);

    metaArgs = [libobjName, browser, serverDir, server.port, preloadJs];
});

afterAll(async () => {
    await browser.close();

    console.log('closing server!!');
    server.close();
    server = null;
});

//

const testUnit = unit => {
    takeUnit(unit) ?
        test(`unit: ${unit}`, () => units[unit](modPath, ...metaArgs)) :
        testSkipNoTake(unit);
};

switch (modType) {
    case 'umd':
        testUnit('umd-tag');
        break;
    case 'esm':
        testUnit('esm-import-static');
        testUnit('esm-import-dynamic');
        break;
    case 'esm-compat':
        testUnit('esm-compat-tag');
        break;
    default:
        console.log('unsupported modType:', modType);
}
