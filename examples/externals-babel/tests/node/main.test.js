const path = require('path');

const libName = 'no-pkg-name';
const outDir = path.join(__dirname, '../../target');
const __modPath = `${outDir}/${libName}.min.js`;

const Foo = require(__modPath);
test('constructor', () => {
    expect(typeof Foo).toBe('function');
});

const foo = new Foo();
test('`new`', () => {
    expect(typeof foo.ver).toBe('string');
});

