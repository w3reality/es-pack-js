import 'regenerator-runtime/runtime.js';
import { decode } from 'base64-arraybuffer';
import { pkgJs, pkgWasm } from '__pkg.esm.js';

export default class Inflater {
    static async new() {
        // TODO !!!! polyfill `TextDecoder` stuff for Node.js
        const initJs = new TextDecoder().decode(this.getPkgJs());

        // Create the 'pure' version of the wasm_bindgen's `init()`
        const init = (new Function(`return () => { ${initJs} return wasm_bindgen; };`))
            .call(null);

        const wbg = init();
        const wasm = await wbg(this.getPkgWasm());

        return { wbg, wasm };
    }

    // Return `ArrayBuffer` representation of bundled wasm-pack pkg files
    static getPkgJs() { return decode(pkgJs); }
    static getPkgWasm() { return decode(pkgWasm); }
};
