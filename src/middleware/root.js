'use strict';

const config = require('../utils/config');

module.exports = {
  commonVariables(req, res, next) {
    res.locals.nowYear = new Date().getFullYear();
    res.locals.form = {};
    res.locals.error = null;
    res.locals.loggedUser = req.session.loggedUser;
    res.locals.isAdmin = req.session.loggedUser?.role === config.adminRole;
    res.locals.dataTick = config.interval;
    res.locals.sessionTime = Date.now() + req.session.cookie.originalMaxAge;
    res.locals.hCaptchaSiteKey = config.hCaptchaSiteKey;
    res.locals.hCaptchaEnabled = config.hCaptchaEnabled;
    res.locals.initLogsRemoveBufferCount = config.initLogsRemoveBufferCount;
    next();
  },
};
