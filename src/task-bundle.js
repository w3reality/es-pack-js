const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const Var2EsmPlugin = require('./var2esm');
const Rustwasm = require('./rustwasm');

const { Ret } = require('./utils');

class BundleTask {
    constructor(wpConfig, buildConfig) {
        this.wpConfig = wpConfig;
        this.buildConfig = buildConfig;
    }

    async run() {
        const { wpConfig, buildConfig } = this;
        const ret = new Ret();

        const { entry, output } = wpConfig;
        __log('@@ entry:', entry);
        __log('@@ output.path:', output.path);
        __log('@@ output.filename:', output.filename);

        const { rustwasm, basedir, outdir, pkgName } = buildConfig;

        let rustwasmInfo = null;
        let disableWatch = false;
        if (rustwasm) {
            try {
                Rustwasm.check(basedir, pkgName);
            } catch (err) {
                ret.setErrorInfo(err);
                return ret;
            }
            rustwasmInfo = Rustwasm.setup(basedir, outdir, pkgName);
            disableWatch = !rustwasmInfo.hasFfi;
        }

        try {
            await BundleTask._run(wpConfig, buildConfig, disableWatch, ret);
        } catch (_) { /* nop */ }

        if (rustwasmInfo) {
            Rustwasm.clean(rustwasmInfo);
        }

        return ret;
    }

    static devWithTtsFeedback(hasErrors) {
        const cmdSay = '/usr/bin/say'; // macOS
        const cmdFestival = '/usr/bin/festival'; // Ubuntu: $ sudo apt install festival
        const sth = hasErrors ? 'errors' : 'ok';
        if (fs.existsSync(cmdSay)) {
            exec(`${cmdSay} ${sth}`);
        } else if (fs.existsSync(cmdFestival)) {
            exec(`echo ${sth} | ${cmdFestival} --tts`);
        } else {
            console.log(`\n⚠️  TTS-feedback requested, but neither of the following available:\n${cmdSay}\n${cmdFestival}`);
        }
    }

    static async _run(wpConfig, buildConfig, disableWatch, ret) {
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

                    if (wpConfig.watch && !disableWatch) {
                        const errMsgs = this.processWpStats(stats, console.log);

                        if (buildConfig.devWithTts) {
                            this.devWithTtsFeedback(errMsgs !== null);
                        }

                        const dirName = buildConfig.rustwasm ? 'ffi' : 'src';
                        console.log(`\n👀 ${buildConfig.basedir}/${dirName}`);

                        // no res/rej; enter looping
                    } else {
                        const print = ret.err.bind(ret);
                        const printMute = str => print(str, true);
                        const errMsgs = this.processWpStats(stats, print, printMute);
                        if (errMsgs) {
                            rej(ret.setErrorInfo(errMsgs, `\n${errMsgs.join('\n')}`));
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

        let errMsgs = null;
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
            // Process `moduleTrace` if any
            let trace = '';
            if (obj.moduleTrace && obj.moduleTrace.length > 0) {
                const _trace = obj.moduleTrace.map(tr => {
                    const deps = tr.dependencies.map(dep => dep.loc).join(' ');
                    return `${tr.originName} ${deps}`;
                }).join('\n');
                trace = `\nTrace:\n${_trace}\n`;
            }

            const { moduleName, loc, message } = obj;
            const where = moduleName ? `[${moduleName}@${loc}] ` : '';
            return `${ty} ${where}${message}\n${trace}`;
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
        //     print(`[${mod.id}] ${mod.name} (${mod.size.toLocaleString()} bytes) ${_how(mod)}`);
        // }

        print(`${new Date().toLocaleString('default')} (${info.time.toLocaleString()} ms) | output path: ${info.outputPath}`);
        for (let asset of info.assets) {
            print(`✨ ${asset.name} (${asset.size.toLocaleString()} bytes) ${_how(asset)}`);
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
        const rustwasm = wpSeed.rustwasm;

        const plugins = [];

        if (wpSeed.ba) {
            plugins.push(new BundleAnalyzerPlugin());
        }

        __log('@@ modType:', modType);
        const isDev = modType.startsWith('dev-');
        const minimize = !isDev;
        let outputFile, target;

        if (modType.endsWith('umd')) {
            outputFile = `${libName}${isDev ? '.js' : '.min.js'}`;
            target = 'umd';
        } else if (modType.endsWith('esm') || modType.endsWith('esm-compat')) {
            const isCompat = modType.endsWith('-compat');
            const dotCompat = isCompat ? '.compat' : '';
            const dotDev = isDev ? '.dev' : '';
            outputFile = `${libName}.esm${dotCompat}${dotDev}.js`;
            target = 'var';
            plugins.push(new Var2EsmPlugin(libObjName, outputFile, isCompat));
        } else {
            console.error('invalid modtype:', modType);
            throw 'exiting...';
        }

        const modules = [];
        const performance = {};

        if (rustwasm) {
            modules.push(path.resolve(`${__dirname}/../rustwasm-polyfill/node_modules`));
            performance.hints = false;

            modules.push(path.resolve(outDir)); // for importing generated js files
            modules.push(path.resolve(`${baseDir}/node_modules`));
        } else {
            modules.push(path.resolve(`${baseDir}/src`));
            modules.push(path.resolve(`${baseDir}/node_modules`));
        }

        // Work around the "polyfill node bindings" breaking change from Webpack 4 to 5
        // https://github.com/webpack/webpack/pull/8460/files
        modules.push(path.resolve(`${__dirname}/../node-polyfill/node_modules`));
        const fallback = {
            assert: "assert",
            buffer: "buffer",
            console: "console-browserify",
            constants: "constants-browserify",
            crypto: "crypto-browserify",
            domain: "domain-browser",
            events: "events",
            http: "stream-http",
            https: "https-browserify",
            os: "os-browserify/browser",
            path: "path-browserify",
            punycode: "punycode",
            process: "process/browser",
            querystring: "querystring-es3",
            stream: "stream-browserify",
            _stream_duplex: "readable-stream/duplex",
            _stream_passthrough: "readable-stream/passthrough",
            _stream_readable: "readable-stream/readable",
            _stream_transform: "readable-stream/transform",
            _stream_writable: "readable-stream/writable",
            string_decoder: "string_decoder",
            sys: "util",
            timers: "timers-browserify",
            tty: "tty-browserify",
            url: "url",
            util: "util",
            vm: "vm-browserify",
            zlib: "browserify-zlib"
        };

        const localNodeModulesDir = `${__dirname}/../node_modules`;
        return {
            plugins,
            watch: isDev,
            mode: isDev ? 'development' : 'production',
            entry: rustwasm ? `${__dirname}/../rustwasm-polyfill/src/index.js` : path.resolve(`${baseDir}/src/index.js`),
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
                            // compress: { drop_console: true }
                            //==== https://github.com/webpack-contrib/terser-webpack-plugin/issues/57
                            compress: { pure_funcs: ['console.debug', 'console.log'] }
                        }
                    })
                ]
            },
            module: {
                rules: [
                    {
                        test: /(\.jsx|\.js)$/,
                        loader: `${localNodeModulesDir}/babel-loader`,
                        options: { // instead of .babelrc -- https://github.com/babel/babel-loader#usage
                            presets: [[`${localNodeModulesDir}/@babel/preset-env`, {modules: false}]]
                        },
                        exclude: /(node_modules|bower_components)/
                    },
                    {
                        test: /(\.jsx|\.js)$/,
                        loader: `${localNodeModulesDir}/eslint-loader`,
                        options: { // instead of .eslintrc -- https://eslint.org/docs/developer-guide/nodejs-api#cliengine
                            parser: `${localNodeModulesDir}/babel-eslint`
                        },
                        exclude: /node_modules/
                    }
                ]
            },
            performance,
            resolve: { modules, fallback,
                extensions: ['.json', '.js']
            }
        };
    }
}

module.exports = BundleTask;
