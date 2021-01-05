import 'regenerator-runtime/runtime.js';
import { decode } from 'base64-arraybuffer';
import { pkgJs, pkgWasm } from '__pkg.esm.js';

export default class Inflater {
    constructor() {
        this._isInitialized = false;
        this._wbg = null;
        this._wasm = null;

        // TODO !!!! polyfill `TextDecoder` stuff for Node.js
        const initJs = new TextDecoder().decode(Inflater.getPkgJs());

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

        this._wasm = await this._wbg(Inflater.getPkgWasm());
        return this._wbg;
    }
    static async new() { // suger
        return await (new Inflater()).init();
    }
    getWasm() {
        return this._wasm;
    }

    // Return `ArrayBuffer` representation of bundled wasm-pack pkg files
    static getPkgJs() { return decode(pkgJs); }
    static getPkgWasm() { return decode(pkgWasm); }
};
