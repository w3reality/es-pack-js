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

        const preloadJs = { node: '', browser: '' }; // defaults
        const veriUnits = { node: [], browser: [] }; // defaults
        if (vc.onVerify) {
            vc.onVerify(preloadJs, veriUnits);
        }

        let envsPerMode; // mode specific envs
        switch (mode) {
            case 'node': {
                envsPerMode = `
                    NODE_PRELOAD_JS=${preloadJs[mode]} \
                    NODE_UNITS=${veriUnits[mode]}`;
                break;
            }
            case 'browser': {
                envsPerMode = `
                    BROWSER_LIBOBJ_NAME=${vc.libobjname} \
                    BROWSER_PRELOAD_JS=${preloadJs[mode]} \
                    BROWSER_UNITS=${veriUnits[mode]}`
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
