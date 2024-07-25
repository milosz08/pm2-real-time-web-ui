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
  userMustBeAdmin(req, res, next) {
    const user = req.session.loggedUser;
    if (!user || user.role !== 'admin') {
      res.redirect('/');
    } else {
      res.locals.loggedUser = req.session.loggedUser;
      next();
    }
  },
  checkRightsToAppApi(req, res, next) {
    try {
      const { pmId } = req.query;
      const user = req.session.loggedUser;
      if (!user) {
        throw new Error();
      }
      const userApps = [0,3]; // TODO: get user apps from DB
      if (userApps.length !== 0 && !userApps.includes(Number(pmId))) {
        throw new Error();
      }
    } catch (e) {
      res.json({
        message: 'No permission for this resource',
        status: 'error',
      });
      return;
    }
    next();
  }
};
