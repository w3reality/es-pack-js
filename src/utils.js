const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { exec } = require('child_process');

// output handling for both commandline and api use cases
class Ret {
    constructor(stdout, stderr) {
        this.stdout = stdout || '';
        this.stderr = stderr || '';
        this.error = undefined;
    }
    apiResult() {
        const { stdout, stderr } = this;
        const success = this.error ? false : true;
        return { stdout, stderr, success };
    }
    out(str, mute=false) {
        if (!mute) console.log(str);
        this.stdout += `${str}\n`;
    }
    err(str, mute=false) {
        if (!mute) console.log(str);
        this.stderr += `${str}\n`;
    }
    log(ret) {
        const { stdout, stderr, error } = ret;
        if (stdout) { this.stdout += stdout; }
        if (stderr) { this.stderr += stderr; }
        if (error) { this.error = error; }
    }
}

class Logger {
    constructor() {
        this._debugLevel = 0;
    }
    setLevel(n) {
        this._debugLevel = n;
    }
    createFn() {
        return (...args) => {
            if (this._debugLevel > 0) console.log(...args);
        };
    }
}

const _colors = { // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    fgBlack: "\x1b[30m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m",
    fgWhite: "\x1b[37m",

    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
};

const _execCommand = (command) => {
    return new Promise((res, rej) => {
        exec(command, (error, stdout, stderr) => {
            if (error !== null) {
                rej({ error, stdout, stderr });
            } else {
                res({ stdout, stderr });
            }
        });
    });
};

const execCommand = async (command, opts={}) => {
    const defaults = {
        muteStdout: false,
        muteStderr: false,
        throwOnError: true,
    };
    const actual = Object.assign({}, defaults, opts);

    try {
        const ret = await _execCommand(command);
        const { stdout, stderr } = ret;
        if (! actual.muteStdout && stdout) {
            __log(_colors.fgYellow, `begin stdout: --------`, _colors.reset);
            console.log(stdout);
            __log(_colors.fgYellow, `end stdout: --------`, _colors.reset);
        }
        if (! actual.muteStderr && stderr) {
            __log(_colors.fgCyan, `begin stderr: --------`, _colors.reset);
            console.log(stderr);
            __log(_colors.fgCyan, `end stderr: --------`, _colors.reset);
        }
        return ret;
    } catch (ret) {
        // console.log(_colors.fgRed, 'exec error: --------\n', ret.error, _colors.reset);
        if (actual.throwOnError) {
            throw ret.error;
        } else {
            return ret;
        }
    }
};

const setupLocalJest = (mode, postfix) => {
    const espBase = path.join(__dirname, '..');
    // console.log('espBase:', espBase);

    let nodeModulesPath = `${espBase}/node_modules`; // global/repo install case
    if (!fs.existsSync(nodeModulesPath)) {
        nodeModulesPath = `${espBase}/..`; // local install case
    }
    const jestBinPath = `${nodeModulesPath}/.bin/jest`;

    // Use the tmp dir to work around Jest's ignoring config/test paths
    // with `/node_modules/`
    const espBaseTmp = `${os.tmpdir()}/es-pack-sparse-${postfix}`;
    // console.log('espBaseTmp:', espBaseTmp);
    fs.removeSync(espBaseTmp);
    fs.emptyDirSync(espBaseTmp);
    const _cpToDir = (srcDir, srcEntry, dstDir) =>
        fs.copySync(`${srcDir}/${srcEntry}`, `${dstDir}/${srcEntry}`);
    ['jest.config.js', 'jest.config.browser.js', 'package.json', 'src', 'tests']
        .forEach(ent => _cpToDir(espBase, ent, espBaseTmp));

    const jestConfigPath =
        `${espBaseTmp}/jest.config.${mode === 'node' ? 'js' : 'browser.js'}`;
    const verifyScriptPath = `${espBaseTmp}/tests/${mode}/verify.test.js`;

    return { nodeModulesPath, jestBinPath, jestConfigPath,
        verifyScriptPath };
};

module.exports = {
    Ret, Logger, _colors,
    _execCommand, execCommand,
    setupLocalJest,
};
