const __consoleLog = (...args) => {
    const _console = console;
    _console.log.apply(_console, args);
};

class Base {
    constructor(num=42) {
        this.num = num;
    }
    log(str) {
        __consoleLog(str);
    }
}

export default Base;
