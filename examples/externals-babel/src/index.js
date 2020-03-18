import * as BABEL from '@babel/standalone';
class Foo {
    constructor() {
        this.ver = BABEL.version;
    }
}
export default Foo;

