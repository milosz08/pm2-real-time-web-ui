'use strict';

const { v4: uuidv4 } = require('uuid');
const AccountModel = require('../db/accountSchema');
const logger = require('../utils/logger');
const utils = require('../db/utils');

const determinateLogoutReason = (reason) => {
  switch (reason) {
    case 'sessionEnded':
      return 'Session has been ended. Log in again.';
    case 'remoteHost':
      return 'Session ended by remote host.';
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
  async doPostLogin(req, res) {
    const { login, password } = req.body;
    try {
      const account = await AccountModel.findOne({ login });
      if (!account) {
        throw new Error(`Unable to find user based login: ${login}.`);
      }
      if (!(await account.compareHash(password))) {
        throw new Error(`Invalid password for login: ${login}.`);
      }
      const { _id, role } = account;
      req.session.loggedUser = {
        id: _id,
        login: account.login,
        role,
        socketId: role !== utils.adminRole ? uuidv4() : null,
      };
      res.redirect('/');
    } catch (e) {
      logger.error(`doPostLogin: ${e.message}`);
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
