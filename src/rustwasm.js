const path = require('path');
const fs = require('fs-extra');
const { encode } = require('base64-arraybuffer');
const { toUnderscores } = require('./utils');

class Rustwasm {
    static setup(basedir, outdir, pkgName) {
        const baseDir = path.resolve(basedir);
        const outDir = path.resolve(outdir);
        __log('[rustwasm] baseDir:', baseDir);
        __log('[rustwasm] outDir:', outDir);

        fs.ensureDirSync(outDir); // https://github.com/jprichardson/node-fs-extra/blob/master/docs/ensureDir-sync.md

        const pkgEsmFileGen = this.generatePkgEsmJs(baseDir, outDir, pkgName);

        const ffiDir = path.resolve(`${basedir}/ffi`);
        const isDetected = fs.existsSync(ffiDir);
        __log(`[rustwasm] ffiDir: ${isDetected ? 'YES detected '+ffiDir : 'NOT detected'}`);
        const ffiDirGen = this.generateFfiDir(isDetected, ffiDir, outDir);

        return { pkgEsmFileGen, ffiDirGen };
    }
    static clean(info) {
        const { pkgEsmFileGen, ffiDirGen } = info;
        __log('[rustwasm] cleaning:', pkgEsmFileGen);
        fs.removeSync(pkgEsmFileGen);

        __log('[rustwasm] cleaning:', ffiDirGen);
        fs.removeSync(ffiDirGen);
    }

    static generatePkgEsmJs(baseDir, outDir, pkgName) {
        const crateNameUnderscored = toUnderscores(pkgName);
        __log('[rustwasm] crateNameUnderscored:', crateNameUnderscored);

        const pkgEsmFile = `${outDir}/__pkg.esm.js`;

        fs.writeFileSync(pkgEsmFile, ''); // create a new file

        let pkgFile = `${baseDir}/pkg/${crateNameUnderscored}.js`;
        fs.appendFileSync(pkgEsmFile,
            `const pkgJs = '${this.encodeFileSync(pkgFile)}';\n`);

        pkgFile = `${baseDir}/pkg/${crateNameUnderscored}_bg.wasm`;
        fs.appendFileSync(pkgEsmFile,
            `const pkgWasm = '${this.encodeFileSync(pkgFile)}';\n`);

        fs.appendFileSync(pkgEsmFile,
            'export { pkgJs, pkgWasm };\n');

        return pkgEsmFile;
    }
    static generateFfiDir(isDetected, ffiDir, outDir) {
        const ffiDirOut = `${outDir}/__ffi`;

        __log(`[rustwasm] ffiDirOut (via ${isDetected ? 'REFLECTION' : 'DUMMY'}):`, ffiDirOut);
        if (isDetected) {
            fs.copySync(ffiDir, ffiDirOut);
        } else {
            fs.ensureDirSync(ffiDirOut);
            fs.writeFileSync(`${ffiDirOut}/index.js`, '');
        }

        return ffiDirOut;
    }

    static logInflation(tag, input, output, filePath) {
        const inflation = (output.length - input.length) / input.length * 100.0;
        __log(`${tag}: ${input.length} -> ${output.length} bytes (${inflation.toFixed(1)}% inflation) for\n  ${filePath}`);
    }
    static encodeFileSync(filePath) {
        const abIn = fs.readFileSync(filePath);
        const abOut = encode(abIn);
        this.logInflation('[rustwasm] base64-encode', abIn, abOut, filePath);
        return abOut;
    }
    static catFile(src, dest) {
        return new Promise((res, rej) => {
            try {
                const rs = fs.createReadStream(src);
                const ws = fs.createWriteStream(dest, {flags: 'a'});
                ws.on('close', () => {
                    __log('catFile(): done:', src, dest);
                    res();
                });
                rs.pipe(ws);
            } catch (err) {
                rej(err);
            }
        });
    }
}

module.exports = Rustwasm;
