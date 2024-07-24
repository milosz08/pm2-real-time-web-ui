'use strict';

const config = require("../utils/config");

module.exports = {
  commonVariables(req, res, next) {
    const { loggedUser } = req.session;
    res.locals.nowYear = new Date().getFullYear();
    res.locals.form = {};
    res.locals.error = null;
    res.locals.loggedUser = loggedUser ? {
      isAdmin: loggedUser.role === 'admin',
      ...loggedUser,
    } : null;
    res.locals.dataTick = config.interval;
    next();
  },
};
