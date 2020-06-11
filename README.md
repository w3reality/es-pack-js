## Getting started

Setting up in an NPM project:

```
$ mkdir add
$ cd add
$ npm init
$ npm i -D es-pack-js  # ⬇️
```

Invoking the `es-pack` command:

```
$ ./node_modules/es-pack-js/bin/es-pack
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
$ ./node_modules/es-pack-js/bin/es-pack build
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
$ ./node_modules/es-pack-js/bin/es-pack build -m umd esm esm-compat
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
$ ./node_modules/es-pack-js/bin/es-pack build -h
es-pack 0.3.5
usage: es-pack build [<path>=.] [Options]

Options:
  --help, -h, -h           Show help                                   [boolean]
  --module, -m             Set output module type (`umd`, `esm`, `esm-compat`)
                                                        [array] [default: "umd"]
  --dev                    Toggle behavior as `webpack --mode development
                           --watch`                   [boolean] [default: false]
  --out-dir, -d            Set output directory (`<path>/target`, otherwise)
  --lib-name               Set output module file name (e.g. "foo-bar-js")
  --libobj-name            Set library object name (e.g. "FooBarJs")
  --bundle-analyzer, --ba  Enable `webpack-bundle-analyzer` plugin
                                                      [boolean] [default: false]
  --verify                 Verify basic assumptions against built modules
                                                      [boolean] [default: false]
  --rustwasm               WIP: Toggle `rustwasm` mode[boolean] [default: false]
  --debug                  Print debug log and keep intermediate output
                                                      [boolean] [default: false]
```
