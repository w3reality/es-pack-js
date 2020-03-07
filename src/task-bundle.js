const path = require('path');
const fs = require('fs-extra');

const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const Var2EsmPlugin = require('webpack-var2esm-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const { Ret } = require('./utils');

let __log = null;
class BundleTask {
    constructor(wpConfig, throwOnError, logFn=function(){}) {
        __log = logFn;
        this.wpConfig = wpConfig;
        this.throwOnError = throwOnError; // for `execCommand()`
    }

    async run() {
        const { wpConfig } = this;

        const ret = new Ret();

        const { output } = wpConfig;
        __log('@@ output.path:', output.path);
        __log('@@ output.filename:', output.filename);

        try {
            const stats = await BundleTask._run(wpConfig);
            BundleTask.processWpStats(stats, ret.err.bind(ret));
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
    static async _run(wpConfig) {
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

    static createWpConfig(wpSeed) {
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
}

module.exports = BundleTask;
