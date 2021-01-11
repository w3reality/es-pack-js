const path = require('path');
const fs = require('fs-extra');
const { encode } = require('base64-arraybuffer');
const { toUnderscores } = require('./utils');

class Rustwasm {
    static check(basedir, pkgName) {
        const { pkgJs } = this._resolvePkgFiles(
            path.resolve(basedir), pkgName);

        // Check whether the crate is built by `wasm-pack build --target no-modules`
        const tf = fs.readFileSync(pkgJs, 'utf8').trim()
            .startsWith('let wasm_bindgen;');

        if (tf) {
            __log('[rustwasm] `--target no-modules` check: looks good');
        } else {
            const msg = '`es-pack build --rustwasm` requires that the crate is already compiled by `wasm-pack build --target no-modules`.  Only the `no-modules` target is supported; others (e.g. `bundler`, `nodejs`, and `web`) are not.';
            throw new Error(msg);
        }
    }
    static setup(basedir, outdir, pkgName) {
        const baseDir = path.resolve(basedir);
        const outDir = path.resolve(outdir);
        __log('[rustwasm] baseDir:', baseDir);
        __log('[rustwasm] outDir:', outDir);

        fs.ensureDirSync(outDir); // https://github.com/jprichardson/node-fs-extra/blob/master/docs/ensureDir-sync.md

        const pkgEsmFileGen = this.generatePkgEsmJs(baseDir, outDir, pkgName);

        const ffiDir = path.resolve(`${basedir}/ffi`);
        const hasFfi = fs.existsSync(ffiDir);
        __log(`[rustwasm] ffiDir: ${hasFfi ? 'YES detected '+ffiDir : 'NOT detected'}`);
        const ffiDirGen = this.generateFfiDir(hasFfi, ffiDir, outDir);

        return { pkgEsmFileGen, hasFfi, ffiDirGen };
    }
    static clean(info) {
        const { pkgEsmFileGen, ffiDirGen } = info;
        __log('[rustwasm] cleaning:', pkgEsmFileGen);
        fs.removeSync(pkgEsmFileGen);

        __log('[rustwasm] cleaning:', ffiDirGen);
        fs.removeSync(ffiDirGen);
    }

    static _resolvePkgFiles(baseDir, pkgName) {
        const crateNameUnderscored = toUnderscores(pkgName);
        // __log('[rustwasm] crateNameUnderscored:', crateNameUnderscored);

        return {
            pkgJs: `${baseDir}/pkg/${crateNameUnderscored}.js`,
            pkgWasm: `${baseDir}/pkg/${crateNameUnderscored}_bg.wasm`,
        };
    }
    static generatePkgEsmJs(baseDir, outDir, pkgName) {

        const pkgEsmFile = `${outDir}/__pkg.esm.js`;

        fs.writeFileSync(pkgEsmFile, ''); // create a new file

        const { pkgJs, pkgWasm } = this._resolvePkgFiles(baseDir, pkgName);
        fs.appendFileSync(pkgEsmFile,
            `const pkgJs = '${this.encodeFileSync(pkgJs)}';\n`);
        fs.appendFileSync(pkgEsmFile,
            `const pkgWasm = '${this.encodeFileSync(pkgWasm)}';\n`);
        fs.appendFileSync(pkgEsmFile, 'export { pkgJs, pkgWasm };\n');

        return pkgEsmFile;
    }
    static generateFfiDir(hasFfi, ffiDir, outDir) {
        const ffiDirOut = `${outDir}/__ffi`;

        __log(`[rustwasm] ffiDirOut (via ${hasFfi ? 'SYMLINK' : 'DUMMY'}):`, ffiDirOut);
        fs.removeSync(ffiDirOut); // Remove the previous one if any
        if (hasFfi) {
            fs.symlinkSync(ffiDir, ffiDirOut);
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
