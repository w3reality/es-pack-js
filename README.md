```
es-pack 0.2.0-dev.0
usage: esp build [<path>=.] [Options]

Options:
  --help, -h               Show help                                   [boolean]
  --module, -m             Set output module type (`umd`, `esm`, `esm-compat`)
                                                        [array] [default: "umd"]
  --dev                    Toggle behavior as `webpack --mode development
                           --watch`                   [boolean] [default: false]
  --out-dir, -d            Set output directory (`<path>/target`, otherwise)
  --lib-name               Set output module file name (e.g. "foo-bar-js")
  --libobj-name            Set library object name (e.g. "FooBarJs")
  --bundle-analyzer, --ba  Enable `webpack-bundle-analyzer` plugin
                                                      [boolean] [default: false]
  --rustwasm               Toggle `rustwasm` mode (WIP)
                                                      [boolean] [default: false]
  --debug                  Print debug log and keep intermediate output
                                                      [boolean] [default: false]
```
