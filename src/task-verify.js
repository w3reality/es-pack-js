const path = require('path');
const fs = require('fs-extra');

const { Ret, execCommand } = require('./utils');

class VerifyTask {
    constructor(config, throwOnError) {
        this.config = config;
        this.throwOnError = throwOnError; // for `execCommand()`
    }

    async run() {
        const { config: veriConfig, throwOnError } = this;

        const ret = new Ret();

        __log('@@ veriConfig:', veriConfig);
        __log('@@ throwOnError:', throwOnError);
        ret.err(`veriConfig is ${veriConfig}`);
        ret.log(await execCommand(`ls`, { throwOnError }));

        return ret;
    }
}

module.exports = VerifyTask;
