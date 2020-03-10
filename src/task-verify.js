const path = require('path');
const fs = require('fs-extra');
const os = require('os');

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

        let nodeModulesPath = `${espBase}/node_modules`; // global/repo install case
        if (!fs.existsSync(nodeModulesPath)) {
            nodeModulesPath = `${espBase}/..`; // local install case
        }
        const jestBinPath = `${nodeModulesPath}/.bin/jest`;

        // Use the tmp dir to work around Jest's ignoring config/test paths
        // with `/node_modules/`
        const espBaseTmp = `${os.tmpdir()}/es-pack-sparse-verify`;
        // console.log('espBaseTmp:', espBaseTmp);
        fs.removeSync(espBaseTmp);
        fs.emptyDirSync(espBaseTmp);
        const _cpToDir = (srcDir, srcEntry, dstDir) => fs.copySync(`${srcDir}/${srcEntry}`, `${dstDir}/${srcEntry}`);
        ['jest.config.js', 'jest.config.browser.js', 'package.json', 'src', 'tests'].forEach(ent => _cpToDir(espBase, ent, espBaseTmp));

        const cmd = `
            NODE_PATH=${nodeModulesPath} \
            MOD_TYPE=${vc.modtype} \
            MOD_DIR=${vc.path} \
            MOD_NAME=${vc.filename} \
            MOD_LIBOBJ_NAME=${vc.libobjname} \
            ${jestBinPath} \
            -c ${espBaseTmp}/jest.config.${mode === 'node' ? 'js' : 'browser.js'} \
            ${espBaseTmp}/tests/${mode}/verify.test.js \
            --silent false`;
        // console.log('cmd:', cmd);

        return await execCommand(cmd, { muteStdout: true, throwOnError });
    }
}

module.exports = VerifyTask;
