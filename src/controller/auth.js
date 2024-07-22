'use strict';

module.exports = {
  doGetLogin(req, res) {
    res.render('login');
  },
  doPostLogin(req, res) {
    const { login, password } = req.body;
    try {
      req.session.loggedUser = {
        login: 'test',
        role: 'admin',
      };
      res.redirect('/');
    } catch (e) {
      res.render('login', {
        form: req.body,
        error: 'Invalid login and/or password.',
      });
    }
  },
  doGetLogout(req, res) {
    req.session.loggedUser = null;
    res.redirect('/login');
  },
};
