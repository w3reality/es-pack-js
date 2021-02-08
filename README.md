# es-pack-js

[![NPM][npm-badge]][npm-url]
[![MIT licensed][mit-badge]][mit-url]
[![CI][actions-badge]][actions-url]

[npm-badge]: https://img.shields.io/npm/v/es-pack-js.svg
[npm-url]: https://www.npmjs.com/package/es-pack-js
[mit-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[mit-url]: https://github.com/w3reality/es-pack-js/blob/master/LICENSE
[actions-badge]: https://github.com/w3reality/es-pack-js/workflows/CI/badge.svg
[actions-url]: https://github.com/w3reality/es-pack-js/actions

Build and test portable JavaScript/rustwasm modules

## Getting started

In this section, we demonstrate how to generate standalone umd/esm modules from a
minimal NPM project. For bundling rustwasm artifacts generated by
the [wasm-pack](https://github.com/rustwasm/wasm-pack)
command, see the following [`--rustwasm` mode section](#sec-rustwasm).

Setting up in an NPM project:

```
$ mkdir add
$ cd add
$ npm init
$ npm i -D es-pack-js  # ⬇️
```

Invoking the `es-pack` command:

```
$ npx es-pack  # invokes ./node_modules/es-pack-js/bin/es-pack
es-pack 0.3.5
usage: es-pack <Command> [Options]

Commands:
  es-pack build  Build modules
  es-pack test   Test modules
  es-pack help   Show help

Options:
  --help, -h  Show help                                                [boolean]
```

Building an UMD module:

```
$ mkdir src
$ echo 'export default function add(x, y) { return x + y; }' > src/index.js
$ npx es-pack build
es-pack 0.3.5

task-bundle: 🌀 spinning...
6/10/2020, 2:51:00 PM (1115ms) | output path: /Users/foo/add/target
✨ add.min.js (1276 bytes) [emitted]
task-bundle: ✅ done
```

Exercising the UMD module with NodeJS:

```
$ node
Welcome to Node.js v12.16.1.
Type ".help" for more information.
> f = require('./target/add.min')
[Function: r]
> f(1, 2)
3
```

Building modules with the `-m` option:

```
$ npx es-pack build -m umd esm esm-compat
es-pack 0.3.5

task-bundle: 🌀 spinning...
6/10/2020, 2:57:08 PM (1021ms) | output path: /Users/foo/add/target
✨ add.min.js (1276 bytes) [emitted]
task-bundle: ✅ done

task-bundle: 🌀 spinning...
6/10/2020, 2:57:08 PM (278ms) | output path: /Users/foo/add/target
✨ add.esm.js (1062 bytes) [emitted]
task-bundle: ✅ done

task-bundle: 🌀 spinning...
6/10/2020, 2:57:08 PM (252ms) | output path: /Users/foo/add/target
✨ add.esm.compat.js (1419 bytes) [emitted]
task-bundle: ✅ done
```

More options:

```
$ npx es-pack build -h
es-pack 0.5.0
usage: es-pack build [<path>=.] [Options]

Options:
  -h, -h, --help               Show help                               [boolean]
  -m, --module                 Set output module type (`umd`, `esm`,
                               `esm-compat`)            [array] [default: "umd"]
      --dev                    Toggle behavior as `webpack --mode development
                               --watch`               [boolean] [default: false]
      --dev-with-tts           `--dev` with audio feedback
                                                      [boolean] [default: false]
  -d, --out-dir                Set output directory (`<path>/target`, otherwise)
      --lib-name               Set output module file name (e.g. "foo-bar-js")
      --libobj-name            Set library object name (e.g. "FooBarJs")
      --bundle-analyzer, --ba  Enable `webpack-bundle-analyzer` plugin
                                                      [boolean] [default: false]
      --verify                 Verify basic assumptions against built modules
                                                      [boolean] [default: false]
      --rustwasm               Toggle `rustwasm` mode [boolean] [default: false]
      --debug                  Print debug log and keep intermediate output
                                                      [boolean] [default: false]
```

## The `--rustwasm` mode <a name="sec-rustwasm"></a>

We can transform wasm-pack generated artifacts into standalone umd/esm modules
usable in browsers/Node.js as follows:

```
$ wasm-pack build --target no-modules
$ es-pack build --rustwasm
```

To illustrate in detail, we use this minimal Rust crate: [examples/rustwasm-add](https://github.com/w3reality/es-pack-js/tree/master/examples/rustwasm-add)

<p><details>
<summary>wasm-pack build --target no-modules</summary>

```
$ wasm-pack build --target no-modules
[INFO]: 🎯  Checking for the Wasm target...
[INFO]: 🌀  Compiling to Wasm...
   Compiling proc-macro2 v1.0.24
   Compiling unicode-xid v0.2.1
   Compiling log v0.4.11
   Compiling syn v1.0.58
   Compiling wasm-bindgen-shared v0.2.69
   Compiling cfg-if v0.1.10
   Compiling bumpalo v3.4.0
   Compiling lazy_static v1.4.0
   Compiling wasm-bindgen v0.2.69
   Compiling cfg-if v1.0.0
   Compiling quote v1.0.8
   Compiling wasm-bindgen-backend v0.2.69
   Compiling wasm-bindgen-macro-support v0.2.69
   Compiling wasm-bindgen-macro v0.2.69
   Compiling add v0.1.0 (/Users/foo/es-pack-js/examples/rustwasm-add)
    Finished release [optimized] target(s) in 22.59s
⚠️   [WARN]: origin crate has no README
[INFO]: ⬇️  Installing wasm-bindgen...
[INFO]: Optimizing wasm binaries with `wasm-opt`...
[INFO]: Optional fields missing from Cargo.toml: 'description', 'repository', and 'license'. These are not necessary, but recommended
[INFO]: ✨   Done in 23.24s
[INFO]: 📦   Your wasm pkg is ready to publish at /Users/foo/es-pack-js/examples/rustwasm-add/pkg.
```

</details></p>

<p><details>
<summary>es-pack build --rustwasm</summary>

```
$ es-pack build --rustwasm
es-pack 0.5.1-dev.0

task-bundle: 🌀 spinning...
2/8/2021, 11:38:49 AM (2,948 ms) | output path: /Users/foo/es-pack-js/examples/rustwasm-add/pkg-es-pack
✨ add.min.js (13,282 bytes) [emitted]
task-bundle: ✅ done
```

</details></p>

Let's exercise the generated 'add.min.js' (an 'umd' module) in Node.js:

```
$ node
Welcome to Node.js v14.15.4.
Type ".help" for more information.
> Mod = require('./pkg-es-pack/add.min.js')
[Function: t] { ffi: {} }
> Mod.create({nodejs: true}).then(mod => console.log(mod.add(2, 2)))
Promise { <pending> }
> 4
```

Similarly, like in [this demo project](https://github.com/w3reality/threelet/tree/master/examples/rust-canvas-hello),
we can also generate an 'esm' module with:

```
$ es-pack build --rustwasm -m esm
```

💡 As a more advanced example using the rustwasm mode, we have [examples/rustwasm-ffi](https://github.com/w3reality/es-pack-js/tree/master/examples/rustwasm-ffi),
where we show how to call JavaScript FFI from within Rust code.

