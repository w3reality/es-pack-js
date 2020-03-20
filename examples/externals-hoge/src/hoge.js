const Hoge = function Hoge() { this.ver = '0.1.0'; };
//====
// NG -- https://stackoverflow.com/questions/51860043/javascript-es6-typeerror-class-constructor-client-cannot-be-invoked-without-ne/51860850
// class Hoge {
//    constructor() { this.ver = '0.1.0'; }
// }

const HOGE = { num: 42, Hoge };

if (typeof window !== 'undefined') {
    window.HOGE = HOGE; // browser
    window.module = {}; // shim
} else {
    global['HOGE'] = HOGE; // node: esm-import-dynamic, esm-compat-require, esm-compat-import-dynamic
}
module.exports = HOGE; // node: umd-require

