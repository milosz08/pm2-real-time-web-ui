'use strict';

const { v4: uuidv4 } = require('uuid');
const AccountModel = require('../db/accountSchema');
const logger = require('../utils/logger');
const config = require('../utils/config');

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
    const csrfToken = req.csrfToken();
    const { reason } = req.query;
    res.render('login', {
      info: determinateLogoutReason(reason),
      csrfToken,
    });
  },
  async doPostLogin(req, res) {
    const csrfToken = req.csrfToken();
    const { login, password } = req.body;
    try {
      if (config.hCaptchaEnabled) {
        await new Promise((resolve, reject) => {
          fetch('https://hcaptcha.com/siteverify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: config.hCaptchaSecretKey,
                response: req.body['h-captcha-response'],
            }),
          })
          .then(res => res.json())
          .then(data => data.success
            ? resolve(data)
            : reject(new Error('Unable to validate captcha.'))
          )
          .catch(() =>  reject(new Error('Unable to validate captcha.')));
        });
      }
      const account = await AccountModel.findOne({ login });
      if (!account) {
        throw new Error('Invalid password and/or login.');
      }
      if (!(await account.compareHash(password))) {
        throw new Error('Invalid password and/or login.');
      }
      const { _id, role } = account;
      req.session.loggedUser = {
        id: _id,
        login: account.login,
        role,
        socketId: role !== config.adminRole ? uuidv4() : null,
      };
      res.redirect('/');
    } catch (e) {
      logger.error(`doPostLogin: ${e.message}: user: ${login}`);
      res.render('login', {
        form: req.body,
        error: e.message,
        csrfToken,
      });
    }
  },
  doGetLogout(req, res) {
    const { reason } = req.query;
    req.session.loggedUser = null;
    let redirectTo = '/login';
    if (reason) {
      redirectTo = `/login?reason=${reason}`
    }
    req.session.destroy(() => {
      res.redirect(redirectTo);
    });
  },
};
