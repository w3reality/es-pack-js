// es-pack-js - https://github.com/w3reality/es-pack-js
// A webpack-based tool for building JavaScript module variants (MIT License)

let __debugLevel = 1; // 0: production
const __log = (...args) => {
    if (__debugLevel > 0) console.log(...args);
};

const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const Var2EsmPlugin = require('webpack-var2esm-plugin');

const createWpConfig = (params) => {
    const dirname = '.';

    const modType = params.modtype || 'umd';
    const libName = params.libname || 'my-mod'; // or pkg.name
    const libObjName = params.libobjname || 'MyMod'; // name for script tag loading
    const outDir = path.resolve(params.outdir || dirname);

    const plugins = [];
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
        mode: isDev ? 'development' : 'production',
        watch: isDev,
        entry: path.resolve(dirname + '/src/index.js'),
        externals: { // https://webpack.js.org/configuration/externals/
        },
        output: {
            path: outDir,
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
                path.resolve(dirname + '/node_modules'),
                path.resolve(dirname + '/src')
            ],
            extensions: ['.json', '.js']
        },
        plugins,
    };
};

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
            console.error('error: neither yargs nor argv is provided');
            return;
        }

        const _argv = yargs ? EsPack.processYargs(yargs) : argv;
        __log('@@ _argv:', _argv);

        const pkgName = require(path.resolve('./package.json')).name;
        this.config = {
            modtype: _argv.dev ? 'dev' : _argv.modType,
            libname: pkgName, // e.g. 'foo-bar-js'
            libobjname: EsPack.resolveLibObjName(pkgName), // name for script tag loading; e.g. 'FooBarJs'
            outdir: './target',
        };
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
            .usage('usage: $0 [options]')
            //
            .describe('mod-type', 'Set output module type (umd, esm, esm-compat)')
            .nargs('mod-type', 1)
            .default('mod-type', 'umd')
            .alias('m', 'mod-type')
            //
            .describe('dev', 'Toggle the behavior as `webpack --mode development --watch`')
            .boolean('dev')
            .default('dev', false)
            //
            .argv;
    }

    async run() { return await this._run(false); }
    async runAsApi() { return await this._run(true); }
    async _run(asApi) {
        const config = this.config;
        __log('@@ config:', this.config);
        if (! config) {
            console.error('_run(): config is invalid, bye.');
            return;
        }

        const throwOnError = ! asApi;
        return await EsPack.runTasks([
            ['runWebpack', async () => EsPack.runWebpack(config, throwOnError)],
            //...
        ]);
    }

    static async runTasks(tasks) {
        const ret = new Ret();
        for (let task of tasks) {
            const [title, fn] = task;
            ret.err(`${title}: 🌀 spinning...`);
            ret.log(await fn());
            if (ret.error) break;
            ret.err(`${title}: ✨ done`);
        }
        return ret.apiResult();
    }

    static async _runWebpack(wpConfig) {
        return new Promise((res, rej) => {
            webpack(wpConfig, (err, stats) => {
                if (err) return rej(err);

                if (wpConfig.watch) {
                    this.processWpStats(stats, console.log);
                } else {
                    res(stats);
                }
            });
        });
    }
    static async runWebpack(config, throwOnError) {
        const ret = new Ret();

        const wpConfig = createWpConfig(config);
        const extConfigPath = path.resolve('./es-pack.config.js');
        try {
            // TODO existence check !!!!
            const cb = require(extConfigPath).onConfigCreated;
            if (cb) cb(wpConfig);
        } catch (err) {
            __log('@@ err:', err);
        }
        __log('@@ wpConfig:', wpConfig);

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
        // https://webpack.js.org/api/stats/
        __log(`@@ Hash: ${info.hash}`);
        __log(`@@ Version: webpack ${info.version}`);
        print(`Time: ${info.time}ms`);
        print(`Output path: ${info.outputPath}`);

        const _how = sth => sth.built ? '[built]' : (sth.emitted ? '[emitted]' : '');
        for (let asset of info.assets) {
            print(`📦 ${asset.name} (${asset.size} bytes) ${_how(asset)}`);
        }
        for (let mod of info.modules) {
            print(`[${mod.id}] ${mod.name} (${mod.size} bytes) ${_how(mod)}`);
        }
    }
}

module.exports = EsPack;
