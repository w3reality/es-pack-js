class MyClass {
    constructor() {
        this._number = 42;
    }
    static ctor() { return new MyClass(); } // kludge

    get number() {
        return this._number;
    }

    set number(n) {
        return this._number = n;
    }

    render() {
        return `My number is: ${this.number}`;
    }
}

export { MyClass };
