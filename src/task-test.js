const path = require('path');
const { Ret, execCommand,
    setupLocalJest, formatErrorJest } = require('./utils');

class TestTask {
    constructor(config) {
        this.config = config;
    }

    async run() {
        const { config: tc } = this;
        const ret = new Ret();

        __log('@@ tc:', tc);

        for (let mode of ['node', 'browser']) {
            if (!tc[mode]) continue;

            const rootDir = path.resolve(tc.basedir);
            ret.err(`@@ preset: ${mode}`);
            ret.err(`@@ rootDir: ${rootDir}`);

            const rawRet = await TestTask.runJest(rootDir, mode);
            // console.log('rawRet:', rawRet, '<-- rawRet');

            ret.log(rawRet);
            if (rawRet.error) {
                ret.setErrorInfo(rawRet.error, formatErrorJest(rawRet));
                // console.log('ret:', ret, '<-- ret; and breaking!!');
                break;
            }
        }

        return ret;
    }

    static async runJest(rootDir, mode) {
        const { nodeModulesPath, jestBinPath, jestConfigPath } =
            setupLocalJest(mode, 'TestTask');

        // const cmd = `echo DEBUG -- rootDir: ${rootDir} mode: ${mode} 1>&2`;
        const cmd = `
            NODE_PATH=${nodeModulesPath} \
            ${jestBinPath} -c ${jestConfigPath} \
            --rootDir ${rootDir} \
            --passWithNoTests \
            --silent false`;

        return await execCommand(cmd, { muteStdout: true });
    }
}

module.exports = TestTask;
