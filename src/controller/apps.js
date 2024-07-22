'use strict';

module.exports = {
  doGetApps(req, res) {
    res.render('apps');
  },
  doGetAppDetails(req, res) {
    res.render('appDetails');
  },
};
