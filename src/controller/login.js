'use strict';

module.exports = {
  doGet(req, res) {
    res.render('login');
  },
  doPost(req, res) {
    res.redirect('/');
  },
};
