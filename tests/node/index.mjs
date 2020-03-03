#!/usr/bin/env node --experimental-modules

let ty;

import Mod from './target/test-mod.mjs'; // OK
// import Mod from './target/test-mod.esm.js'; // NG!!
console.log('Mod:', Mod);
ty = typeof Mod;
if (ty !== 'function' && ty !== 'object') throw 1;

import ModEsmCompat from './target/test-mod.esm.compat.js'; // OK
console.log('ModEsmCompat:', ModEsmCompat);
ty = typeof ModEsmCompat;
if (ty !== 'function' && ty !== 'object') throw 2;

import ModUmd from './target/test-mod.min.js'; // OK
console.log('ModUmd:', ModUmd);
ty = typeof ModUmd;
if (ty !== 'function' && ty !== 'object') throw 3;

process.exit(0);
