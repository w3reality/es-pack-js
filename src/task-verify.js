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

        // TODO --
        //                 umd  esm    compat | main.test.js
        // babel-node      v    v      v        _
        // babel-browser   v    shim   shim     _
        // hoge-node       v    v      v        _
        // hoge-browser    v    v      v        _
        //
        // TODO -- externals (BABEL, HOGE) symlink node_modules/*  by `onVerify()`
        // TODO -- register examples/externals-{hoge,babel} in test:verify and test:examples

        const _resolvePreloadJs = mode => {
            if (vc.onVerify) {
                const { preloadJs } = vc.onVerify();
                return preloadJs ? (preloadJs[mode] || '') : '';
            }
            return '';
        };

        let envsPerMode; // mode specific envs
        switch (mode) {
            case 'node': {
                envsPerMode = `
                    NODE_PRELOAD_JS=${_resolvePreloadJs(mode)}`;
                break;
            }
            case 'browser': {
                envsPerMode = `
                    BROWSER_LIBOBJ_NAME=${vc.libobjname} \
                    BROWSER_PRELOAD_JS=${_resolvePreloadJs(mode)}`
                break;
            }
            default: {
                const error = new Error(`unsupported mode: ${mode}`);
                return { error, stdout: '', stderr: '' }; // `rawRet`
            }
        }

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
