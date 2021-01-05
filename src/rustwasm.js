const path = require('path');
const fs = require('fs-extra');
const { encode } = require('base64-arraybuffer');
const { toUnderscores } = require('./utils');

class Rustwasm {
    static generatePkgEsmJs(basedir, outdir, pkgName) {
        const crateDir = path.resolve(basedir);
        const crateNameUnderscored = toUnderscores(pkgName);
        const outDir = path.resolve(outdir);
        __log('[rustwasm] crateDir:', crateDir);
        __log('[rustwasm] crateNameUnderscored:', crateNameUnderscored);
        __log('[rustwasm] outDir:', outDir);

        const pkgEsmFile = `${outDir}/__pkg.esm.js`;

        fs.writeFileSync(pkgEsmFile, ''); // create a new file

        let pkgFile = `${crateDir}/pkg/${crateNameUnderscored}.js`;
        fs.appendFileSync(pkgEsmFile,
            `const pkgJs = '${this.encodeFileSync(pkgFile)}';\n`);

        pkgFile = `${crateDir}/pkg/${crateNameUnderscored}_bg.wasm`;
        fs.appendFileSync(pkgEsmFile,
            `const pkgWasm = '${this.encodeFileSync(pkgFile)}';\n`);

        fs.appendFileSync(pkgEsmFile,
            'export { pkgJs, pkgWasm };\n');
    }
    static encodeFileSync(filePath) {
        const buffer = fs.readFileSync(filePath);
        const bufferNew = encode(buffer);

        const inflation = (bufferNew.length - buffer.length) / buffer.length * 100.0;
        __log(`[rustwasm] base64-encode: ${buffer.length} -> ${bufferNew.length} bytes (${inflation.toFixed(1)}% inflation) for\n  ${filePath}`);

        return bufferNew;
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
