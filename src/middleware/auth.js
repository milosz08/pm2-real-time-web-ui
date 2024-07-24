'use strict';

module.exports = {
  userMustBeLogged(req, res, next) {
    const user = req.session.loggedUser;
    if (!user) {
      res.redirect('/login');
    } else {
      res.locals.loggedUser = req.session.loggedUser;
      next();
    }
  },
  userMustNotBeLogged(req, res, next) {
    const user = req.session.loggedUser;
    if (user) {
      res.redirect('/');
    } else {
      next();
    }
  },
}
