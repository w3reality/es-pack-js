const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const Var2EsmPlugin = require('./var2esm');

const { Ret } = require('./utils');

class BundleTask {
    constructor(wpConfig, buildConfig) {
        this.wpConfig = wpConfig;
        this.buildConfig = buildConfig;
    }

    async run() {
        const { wpConfig, buildConfig } = this;
        const ret = new Ret();

        const { output } = wpConfig;
        __log('@@ output.path:', output.path);
        __log('@@ output.filename:', output.filename);

        try {
            await BundleTask._run(wpConfig, buildConfig, ret);
        } catch (_) { /* nop */ }

        return ret;
    }

    static devWithTtsFeedback(errors) {
        const cmdSay = '/usr/bin/say'; // macOS
        const cmdFestival = '/usr/bin/festival'; // Ubuntu: $ sudo apt install festival
        const sth = errors ? 'errors': 'ok'
        if (fs.existsSync(cmdSay)) {
            exec(`${cmdSay} ${sth}`);
        } else if (fs.existsSync(cmdFestival)) {
            exec(`echo ${sth} | ${cmdFestival} --tts`);
        } else {
            console.log(`\n⚠️  TTS-feedback requested, but neither of the following available:\n${cmdSay}\n${cmdFestival}`);
        }
    }

    static async _run(wpConfig, buildConfig, ret) {
        return new Promise((res, rej) => {
            try {
                webpack(wpConfig, (err, stats) => {
                    // return rej(ret.setErrorInfo(new Error('debug error...')));
                    //----
                    if (err) return rej(ret.setErrorInfo(err));

                    // for (let pi of wpConfig.plugins) {
                    //     if (pi.constructor.name === 'BundleAnalyzerPlugin') {
                    //         console.log('pi:', pi);
                    //     }
                    // }

                    if (wpConfig.watch) {
                        const errors = this.processWpStats(stats, console.log);

                        if (buildConfig.devWithTts) {
                            this.devWithTtsFeedback(errors);
                        }
                        console.log('\n👀');

                        // no res/rej; enter looping
                    } else {
                        const print = ret.err.bind(ret);
                        const printMute = str => print(str, true);
                        const errors = this.processWpStats(stats, print, printMute);
                        if (errors) {
                            rej(ret.setErrorInfo(errors, `\n${errors.join('\n')}`));
                        } else {
                            res();
                        }
                    }
                });
            } catch (ex) {
                rej(ret.setErrorInfo(ex));
            }
        });
    }

    static processWpStats(stats, print, printMute=undefined) {
        // https://webpack.js.org/api/node/
        // https://webpack.js.org/api/node/#statstojsonoptions
        // https://webpack.js.org/configuration/stats/
        const info = stats.toJson();

        // console.log('hasErrors, hasWarnings:', stats.hasErrors(), stats.hasWarnings());

        if (stats.hasWarnings()) {
            // this.processInfoMsgs(info.warnings, print);
            this.processInfoObjects('⚠️ ', info.warnings, print);
        }

        let errMsgs = undefined;
        if (stats.hasErrors()) {
            errMsgs = this.processInfoObjects('❌ ', info.errors, printMute || print);

            for (let asset of info.assets) {
                const residue = `${info.outputPath}/${asset.name}`;
                __log('@@ removing residue:', residue);

                // nop when the file/dir does not exist - https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove-sync.md
                fs.removeSync(residue);
            }
        } else {
            this.summarizeInfo(info, print);
        }

        return errMsgs;
    }

    static processInfoObjects(ty, objs, print) {
        // console.log('processInfoObjects(): objs:', objs);
        const msgs = objs.map(obj => {
            const { moduleName, loc, message } = obj;
            return `${ty} [${moduleName}@${loc}] ${message}\n`;
        });
        msgs.forEach(msg => print(msg));
        return msgs;
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

        print(`${new Date().toLocaleString('default')} (${info.time}ms) | output path: ${info.outputPath}`);
        for (let asset of info.assets) {
            print(`✨ ${asset.name} (${asset.size} bytes) ${_how(asset)}`);
        }
    }

    static applyCustom(onBundle, wpConfig) {
        const { filename: filenameOrig, library: libraryOrig } = wpConfig.output;
        onBundle(wpConfig);
        const { filename, library } = wpConfig.output;

        // Update the `Var2EsmPlugin` instance if necessary
        if (filename !== filenameOrig || library !== libraryOrig) {
            // console.log(`output.filename: ${filenameOrig} -> ${filename}`);
            // console.log(`output.library: ${libraryOrig} -> ${library}`);
            const { plugins } = wpConfig;
            plugins.forEach((pi, idx) => {
                if (pi.constructor.name === 'Var2EsmPlugin') {
                    // console.log('pi, idx:', pi, idx);

                    plugins.splice(idx, 1); // remove the item at `idx`

                    const piNew = new Var2EsmPlugin(library, filename,
                        filename.endsWith('.esm.compat.js'));
                    plugins.splice(idx, 0, piNew); // insert an item at `idx`

                    // console.log('plugins:', plugins);
                }
            });
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

        const localNodeModules = `${__dirname}/../node_modules`;
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
                        loader: `${localNodeModules}/babel-loader`,
                        options: { // instead of .babelrc -- https://github.com/babel/babel-loader#usage
                            presets: [[`${localNodeModules}/@babel/preset-env`, {modules: false}]]
                        },
                        exclude: /(node_modules|bower_components)/
                    },
                    {
                        test: /(\.jsx|\.js)$/,
                        loader: `${localNodeModules}/eslint-loader`,
                        options: { // instead of .eslintrc -- https://eslint.org/docs/developer-guide/nodejs-api#cliengine
                            parser: `${localNodeModules}/babel-eslint`
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
