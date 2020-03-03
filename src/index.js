// es-pack-js - https://github.com/w3reality/es-pack-js
// A webpack-based tool for building JavaScript module variants (MIT License)

const { version } = require('../package.json');
console.log(`es-pack ${version}`);

let __debugLevel = 0; // 0: production
const __log = (...args) => {
    if (__debugLevel > 0) console.log(...args);
};

const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const Var2EsmPlugin = require('webpack-var2esm-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const toml = require('toml');
const { exec } = require('child_process');


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

class EsPack {
    constructor(params={}) {
        const { yargs, argv } = params;
        if (!yargs && !argv) {
            console.error('error: neither `yargs` nor `argv` is provided');
            return;
        }

        const _argv = yargs ? EsPack.processYargs(yargs) : argv;
        if (_argv.debug) {
            __debugLevel = 1;
        }
        __log('@@ _argv:', _argv);

        const cmd = _argv._[0];
        if (cmd !== 'build') {
            console.error(`error: unsupported command: ${cmd}`);
            return;
        }
        __log('@@ cmd:', cmd);

        const basedir = _argv._[1] || '.';

        let pkgName = 'no-pkg-name';
        try {
            pkgName = _argv.rustwasm ?
                EsPack.resolveCrateName(basedir) :
                EsPack.resolveNpmName(basedir);
        } catch (err) {
            __log('@@ resolve `pkgName`: caught err.code:', err.code);
        }

        const { ba, verify, rustwasm } = _argv;
        this.config = {
            basedir,
            modarray: _argv.dev ? ['dev'] : (_argv.module || ['umd']),
            libname: _argv.libName || pkgName, // e.g. 'foo-bar-js'
            libobjname: _argv.libobjName || EsPack.resolveLibObjName(pkgName), // name for script tag loading; e.g. 'FooBarJs'
            outdir: _argv.outDir || `${basedir}/target`,
            ba, verify, rustwasm,
        };
        __log('@@ this.config:', this.config);
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

    static toUnderscores(str) { return str.split('-').join('_'); }
    static resolveLibObjName(crateName) {
        // foo -> Foo
        // foo-bar -> FooBar
        // foo_bar -> FooBar

        const _createName = this.toUnderscores(crateName);
        // https://stackoverflow.com/a/6661013
        const camel = _createName.replace(/_([a-z])/g, (m, w) => w.toUpperCase());
        return camel.replace(/^./, camel[0].toUpperCase());
    }

    static processYargs(yargs) {
        return yargs
            .usage('usage: $0 [Options] <Command>')
            .demandCommand(1, '') // https://github.com/yargs/yargs/issues/895
            .command('help', 'Show help')
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
                        describe: 'WIP: Verify basic assumptions against built modules',
                        boolean: true,
                        default: false,
                    },
                    'rustwasm': {
                        describe: 'WIP: Toggle `rustwasm` mode',
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
            .argv;
    }

    static _createWpConfig(wpSeed) {
        const modType = wpSeed.modtype || 'umd';
        const libName = wpSeed.libname || 'my-mod'; // or pkg.name
        const libObjName = wpSeed.libobjname || 'MyMod'; // name for script tag loading
        const outDir = wpSeed.outdir;
        const baseDir = wpSeed.basedir;

        const plugins = [];

        if (wpSeed.ba) {
            plugins.push(new BundleAnalyzerPlugin());
        }

        const isDev = modType === 'dev';
        let outputFile, minimize, target;
        if (modType === 'umd' || isDev) {
            minimize = !isDev;
            outputFile = `${libName}${isDev ? '.js' : '.min.js'}`;
            target = 'umd';
        } else if (modType === 'esm' || modType === 'esm-compat') {
            const isCompat = modType.endsWith('-compat');
            minimize = true;
            outputFile = libName + (isCompat ? '.esm.compat.js' : '.esm.js');
            target = 'var';
            plugins.push(new Var2EsmPlugin(libObjName, outputFile, isCompat));
        } else {
            console.error('invalid modtype:', modType);
            throw 'exiting...';
        }

        return {
            plugins,
            watch: isDev,
            mode: isDev ? 'development' : 'production',
            entry: path.resolve(`${baseDir}/src/index.js`),
            externals: { // https://webpack.js.org/configuration/externals/
            },
            output: {
                path: path.resolve(outDir),
                filename: outputFile,
                library: libObjName,
                libraryTarget: target,
                libraryExport: 'default', // https://github.com/webpack/webpack/commit/de8fc51a6fe2aff3ea3a1c24d34d429897c3b694
                umdNamedDefine: false, // must be 'false' for m to be resolved in require([''], (m) => {});
                globalObject: 'typeof self !== \'undefined\' ? self : this' // https://github.com/webpack/webpack/issues/6522 - Can't create UMD build which can be required by Node
            },
            optimization: {
                minimize: minimize,
                minimizer: [
                    new TerserPlugin({
                        terserOptions: {
                            compress: {
                                drop_console: true
                            }
                        }
                    })
                ]
            },
            module: {
                rules: [
                    {
                        test: /(\.jsx|\.js)$/,
                        loader: 'babel-loader',
                        options: { // instead of .babelrc -- https://github.com/babel/babel-loader#usage
                            presets: [['@babel/preset-env', {modules: false}]]
                        },
                        exclude: /(node_modules|bower_components)/
                    },
                    {
                        test: /(\.jsx|\.js)$/,
                        loader: 'eslint-loader',
                        options: { // instead of .eslintrc -- https://eslint.org/docs/developer-guide/nodejs-api#cliengine
                            parser: 'babel-eslint'
                        },
                        exclude: /node_modules/
                    }
                ]
            },
            resolve: {
                modules: [
                    path.resolve(`${baseDir}/node_modules`),
                    path.resolve(`${baseDir}/src`)
                ],
                extensions: ['.json', '.js']
            }
        };
    }
    static createWpConfig(wpSeed) {
        const wpConfig = this._createWpConfig(wpSeed);

        const ext = path.resolve(`${wpSeed.basedir}/es-pack.config.js`);
        if (fs.existsSync(ext)) {
            const cb = require(ext).onConfigCreated;
            if (cb) cb(wpConfig);
        }

        __log('@@ wpConfig:', wpConfig);
        return wpConfig;
    }

    async run() { return await this._run(false); }
    async runAsApi() { return await this._run(true); }
    async _run(asApi) {
        if (!this.config) {
            console.error('invalid config, bye');
            return;
        }

        if (this.config.rustwasm) {
            throw 'WIP: rustwasm';
        }

        const throwOnError = !asApi;

        // only the `build` command is supported for now
        const tasks = this.config.modarray.map(modtype => {
            const seed = Object.assign({}, this.config, { modtype });
            delete seed['modarray'];
            // console.log('seed:', seed);
            return seed;
        }).map(seed => [
            'run-webpack', async () => EsPack.runWebpack(EsPack.createWpConfig(seed), throwOnError)
        ]);

        if (this.config.verify) {
            const foo = 42;
            tasks.push(['run-verify', async () => EsPack.runVerify(foo, throwOnError)]);
        }

        __log('@@ tasks:', tasks);

        return await EsPack.runTasks(tasks);
        //====
        // return await EsPack.runTasks([
        //     ['task-foo', async () => EsPack.runFoo(..., !asApi /* throwOnError */)],
        //     ['task-bar', async () => EsPack.runBar(..., !asApi /* throwOnError */)],
        //     //...
        // ]);
    }

    static async runVerify(foo, throwOnError) {
        const ret = new Ret();

        __log('@@ foo:', foo);
        ret.err(`foo is ${foo}`);

        return ret;
    }

    static async runTasks(tasks) {
        const ret = new Ret();
        for (let task of tasks) {
            const [title, fn] = task;
            ret.err(`\n${title}: 🌀 spinning...`);
            ret.log(await fn());
            if (ret.error) break;
            ret.err(`${title}: ✅ done`);
        }
        return ret.apiResult();
    }

    static async _runWebpack(wpConfig) {
        return new Promise((res, rej) => {
            webpack(wpConfig, (err, stats) => {
                if (err) return rej(err);

                // for (let pi of wpConfig.plugins) {
                //     if (pi.constructor.name === 'BundleAnalyzerPlugin') {
                //         console.log('pi:', pi);
                //     }
                // }

                if (wpConfig.watch) {
                    this.processWpStats(stats, console.log);
                    console.log('👀');
                } else {
                    res(stats);
                }
            });
        });
    }
    static async runWebpack(wpConfig, throwOnError) {
        const ret = new Ret();

        const { output } = wpConfig;
        __log('@@ output.path:', output.path);
        __log('@@ output.filename:', output.filename);

        try {
            const stats = await this._runWebpack(wpConfig);
            this.processWpStats(stats, ret.err.bind(ret));
        } catch (err) {
            // console.error(err.stack || err);
            ret.err(err.stack || err);
            if (err.details) {
                // console.error(err.details);
                ret.err(err.details);
            }
        }

        return ret;
    }

    static processWpStats(stats, print) {
        // https://webpack.js.org/api/node/
        // https://webpack.js.org/api/node/#statstojsonoptions
        // https://webpack.js.org/configuration/stats/
        const info = stats.toJson();

        // console.log('hasErrors, hasWarnings:', stats.hasErrors(), stats.hasWarnings());

        if (stats.hasWarnings()) {
            this.processInfoMsgs(info.warnings, print);
        }

        if (stats.hasErrors()) {
            this.processInfoMsgs(info.errors, print);

            for (let asset of info.assets) {
                const residue = `${info.outputPath}/${asset.name}`;
                __log('@@ removing residue:', residue);

                // nop when the file/dir does not exist - https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove-sync.md
                fs.removeSync(residue);
            }
        } else {
            this.summarizeInfo(info, print);
        }
    }
    static processInfoMsgs(msgs, print) {
        for (let msg of msgs) {
            msg.split('\n').forEach(line => print(line));
        }
    }
    static summarizeInfo(info, print) {
        const _how = sth => sth.built ? '[built]' : (sth.emitted ? '[emitted]' : '');

        // https://webpack.js.org/api/stats/
        __log(`@@ Hash: ${info.hash}`);
        __log(`@@ Version: webpack ${info.version}`);
        __log(`@@ Time: ${info.time}ms`);

        // console.log('!! Object.keys(info):', Object.keys(info));
        // !! Object.keys(info): [
        //   'errors',            'warnings',
        //   'version',           'hash',
        //   'time',              'builtAt',
        //   'publicPath',        'outputPath',
        //   'assetsByChunkName', 'assets',
        //   'filteredAssets',    'entrypoints',
        //   'namedChunkGroups',  'chunks',
        //   'modules',           'filteredModules',
        //   'logging',           'children'
        // ]

        // TODO get filtered module list as the 'standard' webpack output
        // for (let mod of info.modules) {
        //     print(`[${mod.id}] ${mod.name} (${mod.size} bytes) ${_how(mod)}`);
        // }

        print(`Time: ${info.time} ms | Output path: ${info.outputPath}`);
        for (let asset of info.assets) {
            print(`✨ ${asset.name} (${asset.size} bytes) ${_how(asset)}`);
        }
    }

    static _execCommand(command) {
        return new Promise((res, rej) => {
            exec(command, (error, stdout, stderr) => {
                if (error !== null) {
                    rej({ error, stdout, stderr });
                } else {
                    res({ stdout, stderr });
                }
            });
        });
    }
}

module.exports = EsPack;
