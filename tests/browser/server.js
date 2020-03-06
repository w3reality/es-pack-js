const express = require('express');

class Server {
    constructor(pathStatic) {
        const app = express();
        app.use('/', express.static(pathStatic));

        this._app = app;
        this._serv = null;
        this.port = -1;
    }
    listen(port=0) { // 0: will search for an available port
        return new Promise((res, rej) => {
            try {
                const serv = this._app.listen(port, 'localhost', () => {
                    this.port = serv.address().port;
                    res(this);
                });
                this._serv = serv;
            } catch (err) {
                rej(err);
            }
        });
    }
    close() {
        this._serv.close();
    }
}

module.exports = Server;
