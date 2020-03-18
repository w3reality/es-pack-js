import * as HOGE from 'hoge';

class Foo extends HOGE.Hoge { // `window.HOGE` should be set in case 'browser' test
    constructor() {
        super();
        this.sth = HOGE.num;
    }
}

export default Foo;

