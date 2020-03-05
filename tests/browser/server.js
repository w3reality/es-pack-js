const express = require('express');

class Server {
    constructor(pathStatic) {
        const app = express();
        app.use('/', express.static(pathStatic));

        this._app = app;
        this._serv = null;
    }
    listen(port=0) { // 0: will search for an available port
        return new Promise((res, rej) => {
            try {
                const serv = _app.listen(port, 'localhost', () => {
                    res(serv.address().port);
                });
                this._serv = serv;
            } catch (err) {
                rej(err);
            }
        });
    }
}
const createServer00 = (pathStatic, port=0) => {
    const _app = express();
    _app.use('/', express.static(pathStatic));

    return new Promise((res, rej) => {
        try {
            const _server = _app.listen(port, 'localhost', () => {
                const port = _server.address().port;
                // console.log(`listening on port ${port}`);
                res({ _app, _server, port });
            });
        } catch (err) {
            rej(err);
        }
    });
};

module.exports = { createServer00 };
