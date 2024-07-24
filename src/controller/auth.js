'use strict';

const determinateLogoutReason = (reason) => {
  switch (reason) {
    case 'sessionEnded':
      return 'Session has been ended. Log in again.';
    default:
      return null;
  }
}

module.exports = {
  doGetLogin(req, res) {
    const { reason } = req.query;
    res.render('login', {
      info: determinateLogoutReason(reason),
    });
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
    const { reason } = req.query;
    req.session.loggedUser = null;
    res.redirect(`/login?reason=${reason}`);
  },
};
