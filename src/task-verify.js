const { Ret, execCommand,
    setupLocalJest, formatErrorJest } = require('./utils');

class VerifyTask {
    constructor(config) {
        this.config = config;
    }

    async run() {
        const { config: vc } = this;
        const ret = new Ret();

        __log('@@ vc:', vc);

        ret.err(`verifying module: ${vc.filename}`);
        for (let mode of ['node', 'browser']) {
            const rawRet = await VerifyTask.runJest(vc, mode);

            ret.log(rawRet);
            if (rawRet.error) {
                ret.setErrorInfo(rawRet.error, formatErrorJest(rawRet));
                break;
            }
        }

        return ret;
    }

    static async runJest(vc, mode) {
        const { nodeModulesPath, jestBinPath, jestConfigPath,
            verifyScriptPath } = setupLocalJest(mode, 'VerifyTask');
        __log('@@ verifyScriptPath:', verifyScriptPath);
        __log('@@ nodeModulesPath:', nodeModulesPath);

        // TODOs !!!!!!!!
//                  umd     esm     esm-compat
// babel-node       v       v       _
// babel-browser    v       _       _
// hoge-node        v       v       _
// hoge-browser     v       _       _

        // TODO -- externals (BABEL, HOGE) symlink node_modules/*  by `onBuild()`

        let preloadJsNode = '';
        if (vc.onVerifyNode) {
            const { preloadJs: pre } = vc.onVerifyNode();
            preloadJsNode = pre || '';
        }

        let preloadJsBrowser = '';
        if (vc.onVerifyBrowser) {
            const { preloadJs: pre } = vc.onVerifyBrowser();
            preloadJsBrowser = pre || '';
        }

        // mode specific envs (empty for 'node' mode thus far)
        const envsPerMode = mode === 'node' ? `
            NODE_PRELOAD_JS=${preloadJsNode}` : `
            BROWSER_LIBOBJ_NAME=${vc.libobjname} \
            BROWSER_PRELOAD_JS=${preloadJsBrowser}`;

        const cmd = `${envsPerMode} \
            MOD_TYPE=${vc.modtype} \
            MOD_DIR=${vc.path} \
            MOD_NAME=${vc.filename} \
            NODE_PATH=${nodeModulesPath} \
            ${jestBinPath} -c ${jestConfigPath} ${verifyScriptPath} \
            --silent false`;
        // console.log(`mode: ${mode} | cmd: ${cmd}`);

        return await execCommand(cmd, { muteStdout: true });
    }
}

module.exports = VerifyTask;
