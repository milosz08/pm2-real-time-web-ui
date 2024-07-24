'use strict';

const config = require("../utils/config");

module.exports = {
  commonVariables(_, res, next) {
    res.locals.nowYear = new Date().getFullYear();
    res.locals.form = {};
    res.locals.error = null;
    res.locals.loggedUser = null;
    res.locals.dataTick = config.interval;
    next();
  },
};
