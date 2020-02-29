console.log('beforeAll:', beforeAll); // FIXME not defined on x11
console.log('test:', test); // FIXME not defined on x11

test('foo', () => {
    expect(1).toBe(1);
});
