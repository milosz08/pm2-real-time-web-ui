'use strict';

module.exports = {
  doGetUsers(req, res) {
    res.render('manageUsers');
  },
  doGetAddUser(req, res) {
    res.render('addEditUser');
  },
  doPostAddUser(req, res) {
    res.redirect('/manageUsers');
  },
  doGetEditUser(req, res) {
    res.render('addEditUser');
  },
  doPostEditUser(req, res) {
    res.redirect('/manageUsers');
  },
  doGetDeleteUser(req, res) {
    res.redirect('/manageUsers');
  },
};
