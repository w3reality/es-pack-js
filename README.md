```
usage: es-pack [<path>=.] [Options]

Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  --dev          Toggle behavior as `webpack --mode development --watch`
                                                      [boolean] [default: false]
  --lib-name     Set output module file name (e.g. "foo-bar-js")
  --libobj-name  Set library object name (e.g. "FooBarJs")
  --rustwasm     Toggle `rustwasm` mode (WIP)         [boolean] [default: false]
  --debug        Print debug log and keep intermediate output
                                                      [boolean] [default: false]
  -m, --module   Set output module type (`umd`, `esm`, `esm-compat`)
                                                        [array] [default: "umd"]
  -d, --out-dir  Set output directory (`<path>/target`, otherwise)
```
