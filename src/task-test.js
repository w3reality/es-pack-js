const path = require('path');
const { Ret, execCommand, setupLocalJest } = require('./utils');

class TestTask {
    constructor(config, throwOnError) {
        this.config = config;
        this.throwOnError = throwOnError;
    }

    async run() {
        const { config: tc, throwOnError } = this;
        const ret = new Ret();

        __log('@@ tc:', tc);

        for (let mode of ['node', 'browser']) {
            if (!tc[mode]) continue;

            const rootDir = path.resolve(tc.basedir);
            ret.err(`@@ preset: ${mode}`);
            ret.err(`@@ rootDir: ${rootDir}`);
            ret.log(await TestTask.runJest(rootDir, mode, throwOnError));
        }

        return ret;
    }

    static async runJest(rootDir, mode, throwOnError) {
        const { nodeModulesPath, jestBinPath, jestConfigPath } =
            setupLocalJest(mode, 'TestTask');

        // const cmd = `echo DEBUG -- rootDir: ${rootDir} mode: ${mode} 1>&2`;
        const cmd = `
            NODE_PATH=${nodeModulesPath} \
            ${jestBinPath} -c ${jestConfigPath} \
            --rootDir ${rootDir} \
            --silent false`;

        return await execCommand(cmd, { muteStdout: true, throwOnError });
    }
}

module.exports = TestTask;
