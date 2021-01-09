import 'regenerator-runtime/runtime.js';
import { decode } from 'base64-arraybuffer';

import { pkgJs, pkgWasm } from '__pkg.esm.js';
import * as ffi from '__ffi/index.js';

class Mod {
    constructor(opts={nodejs: false}) {
        this._isInitialized = false;
        this._wbg = null;
        this._wasm = null;

        if (opts.nodejs) {
            const util = global.require('util');
            global.TextEncoder = util.TextEncoder;
            global.TextDecoder = util.TextDecoder;
        }
        const initJs = new TextDecoder().decode(Mod.getPkgJs());

        // Create the 'pure' version of the wasm_bindgen's `init()`
        const _init = (new Function(`return () => { ${initJs} return wasm_bindgen; };`))
            .call(null);

        this._wbg = _init();
    }
    async init() {
        if (this._isInitialized) {
            throw new Error("Already initialized");
        } else {
            this._isInitialized = true;
        }

        this._wasm = await this._wbg(Mod.getPkgWasm());
        return this._wbg;
    }
    static async create(opts={nodejs: false}) { // sugar
        return await (new Mod(opts)).init();
    }

    // Return the underlying `wasm` object
    getWasm() { return this._wasm; }

    // Return `ArrayBuffer` representation of bundled wasm-pack pkg files
    static getPkgJs() { return decode(pkgJs); }
    static getPkgWasm() { return decode(pkgWasm); }
}

Mod.ffi = ffi;

export default Mod;
