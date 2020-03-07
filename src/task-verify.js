const path = require('path');
const fs = require('fs-extra');

const { Ret } = require('./utils');

let __log = null;
class VerifyTask {
    constructor(config, throwOnError, logFn=function(){}) {
        __log = logFn;
        this.config = config;
        this.throwOnError = throwOnError; // for `execCommand()`
    }

    async run() {
        const veriConfig = this.config;

        const ret = new Ret();

        __log('@@ veriConfig:', veriConfig);
        ret.err(`veriConfig is ${veriConfig}`);

        return ret;
    }
}

module.exports = VerifyTask;
