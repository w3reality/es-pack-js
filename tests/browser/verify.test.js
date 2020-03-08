const { units } = require('./units');

const { MOD_TYPE: modType, MOD_DIR: modDir, MOD_NAME: modName,
    MOD_LIBOBJ_NAME: libobjName } = process.env;
const modPath = `${modDir}/${modName}`;

const Server = require('./server');
let server = null;

beforeAll(async () => {
    const serverDir = modDir;
    server = await (new Server(serverDir)).listen();
    console.log('server.port:', server.port);

    metaArgs = [libobjName, serverDir, server.port];
});

afterAll(async () => {
    console.log('closing server!!');
    server.close();
    server = null;
});

switch (modType) {
    case 'umd':
        test('umd: tag', async () => units['umd-tag'](modPath, ...metaArgs));
        break;
    case 'esm':
        test('esm: static import', async () => units['esm-import-static'](modPath, ...metaArgs));
        test('esm: dynamic import', async () => units['esm-import-dynamic'](modPath, ...metaArgs));
        break;
    case 'esm-compat':
        test('esm-compat: tag', async () => units['esm-compat-tag'](modPath, ...metaArgs));
        break;
    default:
        console.log('unsupported modType:', modType);
}
