#!/usr/bin/env node --experimental-modules

import Mod from './target/test-mod.mjs';
console.log('Mod:', Mod);

process.exit(Mod.hasOwnProperty('Foo') ? 0 : 1);
