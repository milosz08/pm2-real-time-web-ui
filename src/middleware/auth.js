'use strict';

const AccountModel = require('../db/accountSchema');
const utils = require('../db/utils');
const logger = require('../utils/logger');

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
    if (!user || user.role !== utils.adminRole) {
      res.redirect('/');
    } else {
      res.locals.loggedUser = req.session.loggedUser;
      next();
    }
  },
  async checkRightsToAppApi(req, res, next) {
    try {
      const { pmId } = req.query;
      const user = req.session.loggedUser;
      if (!user) {
        throw new Error(`Not logged user. Action: ${action}: ID ${pmId}.`);
      }
      const action = req.path.substring(1);
      const account = await AccountModel.findById(user.id);
      const accountApps = account.getApps(action);
      if (!account.checkAppPermission(accountApps, Number(pmId))) {
        throw new Error(`Attempt to invoke ${action}: ID ${pmId} with insufficient permissions.`);
      }
    } catch (e) {
      logger.error(e.message);
      res.json({
        message: 'No permission for this action',
        status: 'error',
      });
      return;
    }
    next();
  },
  async checkRightsToEventStream(req, res, next) {
    res.setHeader('Content-Type', 'text/event-stream');
    try {
      const user = req.session.loggedUser;
      if (!user) {
        throw new Error('Not logged user. Unable to start event stream.');
      }
    } catch (e) {
      logger.error(e.message);
      res.end();
      return;
    }
    next();
  },
};
