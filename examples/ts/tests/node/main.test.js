global.require = require;
const path = require('path');

const libName = 'no-pkg-name';
const outDir = path.join(__dirname, '../../target');

const __modPath = `${outDir}/${libName}.min.js`;

const { Student, greeter } = require(__modPath);

test('misc', () => {
    let user = new Student("Jane", "M.", "User");
    expect(user.lastName).toBe('User');
    expect(greeter(user)).toBe('Hello, Jane User');
});
