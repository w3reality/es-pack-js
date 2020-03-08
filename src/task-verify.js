const path = require('path');
const fs = require('fs-extra');

const { Ret, execCommand } = require('./utils');

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
        const espBase = path.join(__dirname, '..');
        // console.log('espBase:', espBase);

        const cmd = `
            MOD_TYPE=${vc.modtype} \
            MOD_DIR=${vc.path} \
            MOD_NAME=${vc.filename} \
            MOD_LIBOBJ_NAME=${vc.libobjname} \
            ${espBase}/jest \
            -c ${espBase}/jest.config.${mode === 'node' ? 'js' : 'browser.js'} \
            ${espBase}/tests/${mode}/verify.test.js \
            --silent false`;
        // console.log('cmd:', cmd);

        return await execCommand(cmd, { muteStdout: true, throwOnError });
    }
}

module.exports = VerifyTask;
