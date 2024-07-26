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
      const action = req.path.substring(1);
      const accountApps = [0,3]; // TODO: get account apps from DB
      if (accountApps.length !== 0 && !accountApps.includes(Number(pmId))) {
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
