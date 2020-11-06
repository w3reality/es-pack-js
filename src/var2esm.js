// assume the module is being compiled with libraryTarget: 'var'
class Var2EsmPlugin {
    constructor(libraryObjName, outputFile, isCompat=true) {
        this.pluginName = 'Var2EsmPlugin';
        this.libraryObjName = libraryObjName;
        this.outputFile = outputFile;
        this.isCompat = isCompat;
    }
    apply(compiler) {
        // https://github.com/webpack/webpack/issues/11425#issuecomment-686606318
        // webpacks export `webpack-sources` to avoid cache problems
        const { sources, Compilation } = require('webpack');

        compiler.hooks.thisCompilation.tap(this.pluginName, (compilation) => {
            compilation.hooks.processAssets.tap({
                name: this.pluginName,
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, (assets) => {
                const src = assets[this.outputFile].source();
                const srcEsm = this.isCompat ? `
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.${this.libraryObjName} = {})));
}(this, (function (exports) { 'use strict';
    ${src}
    exports.default = ${this.libraryObjName};
    Object.defineProperty(exports, '__esModule', { value: true });
})));` : `
${src}
export default ${this.libraryObjName};
`;

                assets[this.outputFile] = new sources.RawSource(srcEsm);
            });
        });
    }
}
module.exports = Var2EsmPlugin;
