const path = require('path');

const libName = 'no-pkg-name';
const outDir = path.join(__dirname, '../../target');
const __modPath = `${outDir}/${libName}.min.js`;

const Foo = require(__modPath);

describe('Test Suite', () => {

test('constructor', () => {
    expect(typeof Foo).toBe('function');
});

const foo = new Foo();
test('`new`', () => {
    expect(typeof foo.ver).toBe('string');
    expect(foo.sth).toBe(42);
});

}); // end of `describe()`
