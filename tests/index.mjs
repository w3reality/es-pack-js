#!/usr/bin/env node --experimental-modules

import Mod from './target/test-mod.mjs'; // OK
// import Mod from './target/test-mod.esm.js'; // NG!!
console.log('Mod:', Mod);

import ModEsmCompat from './target/test-mod.esm.compat.js'; // OK
console.log('ModEsmCompat:', ModEsmCompat);

import ModUmd from './target/test-mod.min.js'; // OK
console.log('ModUmd:', ModUmd);

process.exit(0);
