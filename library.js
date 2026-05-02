'use strict';

const plugin = {};

plugin.init = async function (params) {
    const { router, middleware } = params;

    const setupRoutes = require('./routes');
    setupRoutes(router, middleware);

    console.log('[小声BB] 加密通讯终端插件已初始化');
};

plugin.addAdminNavigation = function (header) {
    header.plugins.push({
        route: '/plugins/small-bb',
        icon: 'fa-lock',
        name: '小声BB加密终端'
    });
    return header;
};

module.exports = plugin;
