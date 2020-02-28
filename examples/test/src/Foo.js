import Base from './Base.js';

class Foo extends Base {
    constructor() {
        super();
        this.log('Foo object created');
    }
    add(a, b) {
        return a + b;
    }
}

export default Foo;
