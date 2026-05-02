'use strict';

const controllers = require('./controllers');

function setupRoutes(app, middleware) {
    const middlewares = [middleware.authenticateRequest];

    app.get('/small-bb', middlewares, controllers.render.renderSmallBB);

    app.post('/small-bb/api/encrypt', middlewares, controllers.crypto.encrypt);
    app.post('/small-bb/api/decrypt', middlewares, controllers.crypto.decrypt);
    app.get('/small-bb/api/room-key/generate', middlewares, controllers.crypto.generateRoomKey);
    app.post('/small-bb/api/room-key/hash', middlewares, controllers.crypto.hashRoomKey);
    app.post('/small-bb/api/room-key/verify', middlewares, controllers.crypto.verifyRoomKey);
    app.post('/small-bb/api/hajimi', middlewares, controllers.crypto.generateHajimi);
}

module.exports = setupRoutes;
