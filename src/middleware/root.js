'use strict';

module.exports = {
  commonVariables(req, res, next) {
    res.locals.nowYear = new Date().getFullYear();
    next();
  },
};
