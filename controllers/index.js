'use strict';

const cryptoController = require('./cryptoController');
const renderController = require('./renderController');

module.exports = {
    crypto: cryptoController,
    render: renderController
};
