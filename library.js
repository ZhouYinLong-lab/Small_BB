'use strict';

const plugin = {};

plugin.init = async function (params) {
    const { router, middleware } = params;

    const setupRoutes = require('./routes');
    setupRoutes(router, middleware);

    console.log('[Small_BB] 加密通讯终端插件已初始化');
};

plugin.addAdminNavigation = function (header) {
    header.plugins.push({
        route: '/plugins/small_bb',
        icon: 'fa-lock',
        name: 'Small_BB加密终端'
    });
    return header;
};

module.exports = plugin;
