// es-pack-js - https://github.com/w3reality/es-pack-js
// Build portable modules from JavaScript codebase (MIT License)

const path = require('path');
const fs = require('fs-extra');
const toml = require('toml');

const { version } = require('../package.json');
console.log(`es-pack ${version}`);

const { Ret, Logger, _colors, toUnderscores } = require('./utils');

const logger = new Logger();
global.__log = logger.createFn();

const BundleTask = require('./task-bundle');
const VerifyTask = require('./task-verify');
const TestTask = require('./task-test');

class EsPack {
    constructor(params={}) {
        const { yargs, argv } = params;
        if (!yargs && !argv) {
            console.error('error: neither `yargs` nor `argv` is provided');
            return;
        }

        const _argv = yargs ? EsPack.processYargs(yargs) : argv;
        if (_argv.debug) {
            logger.setLevel(1);
        }
        __log(`${_colors.reverse}%s${_colors.reset}`, 'running in debug mode');
        __log('@@ _argv:', _argv);

        //

        const tasksAcc = [];
        const cmd = _argv._[0];
        switch (cmd) {
            case 'build': {
                EsPack.pushBuildTasks(tasksAcc,
                    EsPack.toBuildConfig(_argv));
                break;
            }
            case 'test': {
                EsPack.pushTestTasks(tasksAcc,
                    EsPack.toTestConfig(_argv));
                break;
            }
            default: console.error(`error: unsupported subcommand: ${cmd}`);
        }

        __log('@@ tasksAcc:', tasksAcc);
        this.tasks = tasksAcc;
    }

    static checkExtConfig(extName, extConfig) {
        const props = {
            'onBundle': 'function',
            'onVerify': 'function',
        };

        const pairs = [];
        for (const [key, value] of Object.entries(props)) {
            pairs.push(`${key} (${value})`);
        }
        let propsStr = pairs.join(', ') + '.';
        const usage = `In ${extName} these properties are valid: ${propsStr}`;

        for (const [key, value] of Object.entries(extConfig)) {
            let err;
            if (!(key in props)) {
                err = new Error(`Configuration has an unknown property: '${key}'.\n${usage}\n`);
            } else if (props[key] !== typeof value) {
                err = new Error(`Wrong type '${typeof value}' for configuration property '${key}' (expected '${props[key]}').\n${usage}\n`);
            } else {
                return; // ok
            }
            throw err;
        }
    }
    static getExtConfig(basedir) {
        const extName = 'es-pack.config.js';
        const extPath = path.resolve(`${basedir}/${extName}`);
        const extConfig = fs.existsSync(extPath) ? require(extPath) : null;
        __log(`@@ ${extConfig ? '' : 'NOT '}detected - ext: ${extPath}`);

        if (extConfig) {
            this.checkExtConfig(extName, extConfig);
        }

        return extConfig;
    }

    static toBuildConfig(_argv) {
        const basedir = _argv._[1] || '.';
        const extConfig = this.getExtConfig(basedir);

        let pkgName = 'no-pkg-name';
        try {
            const _pkgName = _argv.rustwasm ?
                this.resolveCrateName(basedir) :
                this.resolveNpmName(basedir);
            pkgName = _pkgName || pkgName;
        } catch (err) {
            __log('@@ resolve `pkgName`: caught err.code:', err.code);
        }

        const { ba, verify, rustwasm, dev, devWithTts } = _argv;
        const mods = _argv.module; // fallback is ['umd'] per `processYargs()`
        return {
            basedir, extConfig,
            modarray: (dev || devWithTts) ? [`dev-${mods[0]}`] : mods,
            libname: _argv.libName || pkgName, // e.g. 'foo-bar-js'
            libobjname: _argv.libobjName || this.resolveLibObjName(pkgName), // name for script tag loading; e.g. 'FooBarJs'
            outdir: _argv.outDir || (rustwasm ? `${basedir}/pkg-es-pack` : `${basedir}/target`),
            ba, verify, devWithTts,
            rustwasm, pkgName,
        };
    }

    static pushBuildTasks(tasksAcc, buildConfig) {
        __log('@@ buildConfig:', buildConfig);

        const cache = {};
        const { extConfig } = buildConfig;

        for (let modtype of buildConfig.modarray) {
            const seed = Object.assign({}, buildConfig, { modtype });
            delete seed['modarray'];
            // console.log('seed:', seed);

            const wpConfig = BundleTask.createWpConfig(seed);

            const { onBundle } = extConfig || {};
            if (onBundle) {
                // TODO: might provide something that facilites the `globals` option in 'eslint-loader'
                // e.g. https://github.com/w3reality/three-geo/blob/21ae2bc18531b8bbb577692d1253fb40d63f02d9/examples/geo-viewer/webpack.config.js#L58

                BundleTask.applyCustom(onBundle, wpConfig);
            }

            __log('@@ wpConfig:', wpConfig);
            cache[modtype] = wpConfig;
            tasksAcc.push(['task-bundle', async () => (new BundleTask(wpConfig, buildConfig)).run()]);
        }

        if (buildConfig.verify) {
            for (let [modtype, wpConfig] of Object.entries(cache)) {
                if (modtype.startsWith('dev-')) continue;

                const { path, filename, library: libobjname } = wpConfig.output;
                const { onVerify } = extConfig || {};
                const veriConfig = { modtype, path, filename, libobjname,
                    onVerify };

                tasksAcc.push(['task-verify', async () => (new VerifyTask(veriConfig)).run()]);
            }
        }
    }

    static toTestConfig(_argv) {
        const basedir = _argv._[1] || '.';
        const extConfig = this.getExtConfig(basedir);

        const { node, browser } = _argv;
        if (!node && !browser) {
            console.error('Sorry, either `--node` or `--browser` is required for the `test` subcommand.');
            process.exit(1);
        }

        return {
            basedir, extConfig,
            node, browser,
        };
    }

    static pushTestTasks(tasksAcc, testConfig) {
        __log('@@ testConfig:', testConfig);

        tasksAcc.push(['task-test', async () => (new TestTask(testConfig)).run()]);
    }

    static resolveNpmName(basedir) {
        return require(path.resolve(`${basedir}/package.json`)).name;
    }
    static resolveCrateName(basedir) {
        const parsed = toml.parse(
            fs.readFileSync(path.resolve(`${basedir}/Cargo.toml`), 'utf8'));
        // __log('parsed:', parsed);
        return parsed.package.name;
    }

    static resolveLibObjName(crateName) {
        // foo -> Foo
        // foo-bar -> FooBar
        // foo_bar -> FooBar

        const _crateName = toUnderscores(crateName);
        // https://stackoverflow.com/a/6661013
        const camel = _crateName.replace(/_([a-z])/g, (m, w) => w.toUpperCase());
        return camel.replace(/^./, camel[0].toUpperCase());
    }

    static processYargs(yargs) {
        return yargs
            .usage('usage: $0 <Command> [Options]')
            .demandCommand(1, '') // https://github.com/yargs/yargs/issues/895
            .alias('help', 'h')
            .version(false)
            .command('build', 'Build modules', yargs => yargs
                .usage('usage: $0 build [<path>=.] [Options]')
                .demandCommand(0, 1) // .demandCommand([min=1], [minMsg]) https://github.com/yargs/yargs/blob/master/docs/api.md#demandcommandmin1-minmsg
                .alias('help', 'h')
                .version(false)
                .options({ // https://github.com/yargs/yargs/blob/master/docs/api.md#optionskey-opt
                    'module': {
                        describe: 'Set output module type (`umd`, `esm`, `esm-compat`)',
                        array: true, // https://github.com/yargs/yargs/blob/master/docs/api.md#arraykey
                        default: 'umd',
                        alias: 'm',
                    },
                    'dev': {
                        describe: 'Toggle behavior as `webpack --mode development --watch`',
                        boolean: true,
                        default: false,
                    },
                    'dev-with-tts': {
                        describe: '`--dev` with audio feedback',
                        boolean: true,
                        default: false,
                    },
                    'out-dir': {
                        describe: 'Set output directory (`<path>/target`, otherwise)',
                        nargs: 1,
                        alias: 'd',
                    },
                    'lib-name': {
                        describe: 'Set output module file name (e.g. "foo-bar-js")',
                        nargs: 1,
                    },
                    'libobj-name': {
                        describe: 'Set library object name (e.g. "FooBarJs")',
                        nargs: 1,
                    },
                    'bundle-analyzer': {
                        describe: 'Enable `webpack-bundle-analyzer` plugin',
                        boolean: true,
                        default: false,
                        alias: 'ba',
                    },
                    'verify': {
                        describe: 'Verify basic assumptions against built modules',
                        boolean: true,
                        default: false,
                    },
                    // 'gowasm', 'aswasm', ...
                    'rustwasm': {
                        describe: 'Toggle `rustwasm` mode',
                        boolean: true,
                        default: false,
                    },
                    'debug': {
                        describe: 'Print debug log and keep intermediate output',
                        boolean: true,
                        default: false,
                    },
                })
            )
            .command('test', 'Test modules', yargs => yargs
                .usage('usage: $0 test [<path>=.] [Options]')
                .demandCommand(0, 1) // .demandCommand([min=1], [minMsg]) https://github.com/yargs/yargs/blob/master/docs/api.md#demandcommandmin1-minmsg
                .alias('help', 'h')
                .version(false)
                .options({
                    'node': {
                        describe: 'Enable tests under the `node` preset',
                        boolean: true,
                        default: false,
                    },
                    'browser': {
                        describe: 'Enable tests under the `browser` preset',
                        boolean: true,
                        default: false,
                    },
                })
            )
            .command('help', 'Show help')
            .argv;
    }

    async runAsApi() {
        return await this._run();
    }
    async run() {
        const apiResult = await this._run();
        // console.log('!!!! apiResult:', apiResult, '<-- apiResult !!!!');

        if (apiResult.isSuccess) {
            process.exit(0);
        } else {
            const { error, errorInfo } = apiResult;
            if (errorInfo) {
                const { error, formatted } = errorInfo;
                console.log(formatted || error.toString());
            } else {
                console.log(error.toString());
            }
            process.exit(1);
        }
    }
    async _run() {
        return await EsPack.runTasks(this.tasks);
    }

    static async runTasks(tasks) {
        const ret = new Ret();
        for (let task of tasks) {
            const [title, fn] = task;
            ret.err(`\n${title}: 🌀 spinning...`);
            ret.log(await fn());
            if (ret.error) {
                ret.err(`${title}: ❌ error`);
                break;
            }
            ret.err(`${title}: ✅ done`);
        }
        return ret.apiResult();
    }
}

const Server = require('../tests/browser/server');
Object.assign(EsPack, { version, Server })

module.exports = EsPack;
