'use strict';

const renderController = {};

renderController.renderSmallBB = function (req, res) {
    res.render('small-bb', {
        title: '小声BB加密通讯终端',
        description: '基于私钥的加密即时通讯系统',
        csrf: req.csrfToken ? req.csrfToken() : ''
    });
};

module.exports = renderController;
