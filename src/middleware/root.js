'use strict';

module.exports = {
  commonVariables(req, res, next) {
    res.locals.nowYear = new Date().getFullYear();
    res.locals.form = {};
    res.locals.error = null;
    res.locals.loggedUser = null;
    next();
  },
};
