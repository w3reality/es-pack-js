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
        const cmd = `
            MOD_TYPE=${vc.modtype} \
            MOD_DIR=${vc.path} \
            MOD_NAME=${vc.filename} \
            MOD_LIBOBJ_NAME=${vc.libobjname} \
            NODE_PATH=${nodeModulesPath} \
            ${jestBinPath} -c ${jestConfigPath} ${verifyScriptPath} \
            --silent false`;
        // console.log('cmd:', cmd);

        return await execCommand(cmd, { muteStdout: true });
    }
}

module.exports = VerifyTask;
