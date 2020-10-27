
class Meta {
    static _consoleLog(...args) {
        // for eluding uglify
        const _console = console;
        _console.log.apply(_console, args);
    }
    static isNodeJS() {
        return typeof __non_webpack_require__ !== 'undefined';
    }
    static async nodeRequire(_global, mod) { // {classic,es}-context agnostic wrapper
        const req = typeof _global.require === 'function' ? _global.require : null;
        const imp = typeof _global.import === 'function' ? _global.import : null;
        if (!req && !imp) throw 'oops; maybe you should add `global.require = require;` in test script.';

        return req ? req(mod) : (await imp(mod)).default;
    }
}

class Delta {
    constructor() {
        this.perf = null;
        this.start = 0;
    }
    static async new() { return await (new this()).init(); }
    async init() {
        if (Meta.isNodeJS()) {
            const { performance: perf } = await Meta.nodeRequire(global, 'perf_hooks');
            this.perf = perf;
        } else {
            this.perf = window.performance;
        }

        this.start = this.perf.now();
        return this;
    }
    _checkInit() {
        if (!this.perf) throw 'call `async .init()` first.';
    }
    get() {
        this._checkInit();
        return (this.perf.now() - this.start) / 1000;
    }
    print(prefix='delta:') {
        this._checkInit();
        console.log(`${prefix} ${this.get().toFixed(3)} (s)`);
    }
}

Meta.Delta = Delta;

export default Meta;
