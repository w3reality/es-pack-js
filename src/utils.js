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
        const ret = await this._execCommand(command);
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


module.exports = { Ret, Logger, _execCommand, execCommand };
