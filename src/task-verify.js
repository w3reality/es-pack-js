const { Ret, execCommand, setupLocalJest } = require('./utils');

class VerifyTask {
    constructor(config, throwOnError) {
        this.config = config;
        this.throwOnError = throwOnError;
    }

    async run() {
        const { config: vc, throwOnError } = this;
        const ret = new Ret();

        __log('@@ vc:', vc);

        ret.err(`testing module: ${vc.filename}`);
        for (let mode of ['node', 'browser']) {
            ret.log(await VerifyTask.runJest(vc, mode, throwOnError));
        }

        return ret;
    }

    static async runJest(vc, mode, throwOnError) {
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

        return await execCommand(cmd, { muteStdout: true, throwOnError });
    }
}

module.exports = VerifyTask;
