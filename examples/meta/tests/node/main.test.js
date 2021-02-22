global.require = require;
const path = require('path');

const libName = 'no-pkg-name';
const outDir = path.join(__dirname, '../../target');

const __modPath = `${outDir}/${libName}.min.js`;
// const __modPath = `${outDir}/${libName}.js`; // dev !!

const Foo = require(__modPath);

const { Meta } = Foo;

test('`foo.sth`', () => {
    const foo = new Foo();
    expect(foo.sth).toBe(42);
});
test('`Meta.Delta`', async () => {
    const delta = await Meta.Delta.new({nodejs: true});
    expect(typeof delta.get()).toBe('number');
});
