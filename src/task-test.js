const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { Ret, execCommand } = require('./utils');

class TestTask {
    constructor(config, throwOnError) {
        this.config = config;
        this.throwOnError = throwOnError;
    }

    async run() {
        const { config: tc, throwOnError } = this;
        const ret = new Ret();

        for (let mode of ['node', 'browser']) {
            if (!tc[mode]) continue;

            ret.err(`@@ running tests with preset: ${mode}`);
            ret.log(await TestTask.runJest(tc, mode, throwOnError));
        }

        return ret;
    }

    static async runJest(tc, mode, throwOnError) {
        const cmd = `echo ${tc.basedir}/${mode} 1>&2`;
        return await execCommand(cmd, { muteStdout: true, throwOnError });
    }
}

module.exports = TestTask;
