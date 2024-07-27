'use strict';

const pm2 = require('pm2');
const logger = require('../utils/logger');
const pm2Async = require('../utils/pm2AsyncApi');
const AccountModel = require('../db/accountSchema');
const config = require('../utils/config');
const session = require('../utils/session');
const { sessionIo } = require('../server');

const ROOT_ALERT = 'accountsRootAlert';

const parseCheckedLabels = (actions, pmId) => {
  const labels = Object.entries(actions)
    .filter(([key]) => key.includes(pmId))
    .reduce((acc, [key, value]) => {
      acc[key.split('-')[0]] = value === 'on' ? 'checked' : '';
      return acc;
    }, {});
  return {
    labels,
    size: Object
      .keys(labels)
      .filter(label => label === 'checked')
      .length,
  };
};

const parseAppAndActions = async (actions) => {
  const apps = await pm2Async.getListOfProcesses();
  const appIdsAndNames = apps.map(({ pm_id, name }) => {
    const { labels, size } = parseCheckedLabels(actions, pm_id);
    return {
      id: pm_id,
      name,
      checkedLabels: labels,
      allCheckLabel: size === config.validActions.length ? 'checked' : '',
    };
  });
  pm2.disconnect();
  return appIdsAndNames;
};

const getPageSessionAlert = (req) => {
  let pageAlert = null;
  if (req.session[ROOT_ALERT]) {
    pageAlert = JSON.parse(JSON.stringify(req.session[ROOT_ALERT]));
  }
  req.session[ROOT_ALERT] = null;
  return pageAlert;
}

const invalidateSession = async (userId) => {
  const revokedUser = session.getSessionUser(userId);
  if (!revokedUser) {
    return;
  }
  session.removeUserFromSession(revokedUser.sid);
  sessionIo.emit(`revoke:${revokedUser.socketId}`);
};

module.exports = {
  async doGetAccounts(req, res) {
    let error = '';
    let accounts = [];
    try {
      accounts = (await AccountModel
        .find({
          role: {
            $ne: config.adminRole,
          },
        }))
        .map(({ _id, login, description }) => ({
          id: _id,
          login,
          description,
        }));
    } catch (e) {
      error = e.message;
      logger.error(`doGetAccounts: ${e.message}.`);
    }
    res.render('manageAccounts', {
      accounts,
      isAccountsEmpty: accounts.length === 0,
      error,
      pageAlert: getPageSessionAlert(req),
    });
  },
  async doGetAddAccount(req, res) {
    try {
      const apps = await pm2Async.getListOfProcesses();
      pm2.disconnect();
      const appIdsAndNames = apps.map(({ pm_id, name }) => ({
        id: pm_id,
        name,
        checkedLabels: config.validActions.reduce((acc, key) => {
          acc[key] = '';
          return acc;
        }, {}),
      }));
      res.render('addEditAccount', {
        pageType: 'Create',
        apps: appIdsAndNames,
        appsIsEmpty: appIdsAndNames.length === 0,
        omitPasswordCheckbox: false,
      });
    } catch (e) {
      pm2.disconnect();
      logger.error(`doGetAddAccount: ${e.message}.`);
      req.session[ROOT_ALERT] = {
        type: 'danger',
        message: e.message,
      };
      res.redirect('/manage-accounts');
    }
  },
  async doPostAddAccount(req, res) {
    const { login, password, description, ...actions } = req.body;
    let appIdsAndNames = [];
    try {
      appIdsAndNames = await parseAppAndActions(actions);
      const userAccount = new AccountModel({
        login,
        password,
        role: config.userRole,
        description,
        permissions: appIdsAndNames.map(({ id, checkedLabels }) => ({
          instancePm2Id: id,
          availableActions: Object.keys(checkedLabels),
        })),
      });
      await userAccount.save();
      const message = 'Successfully add new account.';
      logger.info(message);
      req.session[ROOT_ALERT] = {
        type: 'success',
        message,
      };
      res.redirect('/manage-accounts');
    } catch (e) {
      pm2.disconnect();
      logger.error(`doPostAddAccount: ${e.message}`);
      res.render('addEditAccount', {
        pageType: 'Create',
        account: { ...req.body },
        error: e.name !== 'ValidationError' ? e.message : '',
        errors: e.errors,
        apps: appIdsAndNames,
        omitPasswordCheckbox: false,
      });
    }
  },
  async doGetEditAccount(req, res) {
    const { accountId } = req.params;
    try {
      const account = await AccountModel.findById(accountId);
      if (!account) {
        throw new Error(`Account with ID: ${accountId} not exist.`);
      }
      const apps = await pm2Async.getListOfProcesses();
      pm2.disconnect();
      const { login, description, permissions } = account;
      const permissionsObject = apps
        .reduce((acc, { pm_id }) => {
          acc[pm_id] = config.validActions.reduce((accI, action) => {
            accI[action] = permissions
              .find(({ instancePm2Id }) => instancePm2Id === Number(pm_id))
              ?.availableActions
              .includes(action) ? 'checked' : '';
            return accI;
          }, {});
          return acc;
        }, {});
      const appIdsAndNames = apps.map(({ pm_id, name }) => {
        const labels = permissionsObject[pm_id];
        const size = Object
          .keys(labels)
          .filter(label => label === 'checked')
          .length;
        return {
          id: pm_id,
          name,
          checkedLabels: labels,
          allCheckLabel: size === config.validActions.length ? 'checked' : '',
        };
      });
      res.render('addEditAccount', {
        pageType: 'Edit',
        account: {
          login,
          description,
        },
        apps: appIdsAndNames,
        omitPasswordCheckbox: true,
        omitPasswordLabel: 'checked',
        disablePasswordField: true,
      });
    } catch (e) {
      pm2.disconnect();
      logger.error(`doGetEditAccount: ${e.message}.`);
      req.session[ROOT_ALERT] = {
        type: 'danger',
        message: e.message,
      };
      res.redirect('/manage-accounts');
    }
  },
  async doPostEditAccount(req, res) {
    const { accountId } = req.params;
    const { login, password, description, omitPassword, ...actions } = req.body;
    let appIdsAndNames = [];
    try {
      const account = await AccountModel.findById(accountId);
      if (!account) {
        throw new Error(`Account with ID: ${accountId} not exist.`);
      }
      appIdsAndNames = await parseAppAndActions(actions);
      account.login = login;
      if (!omitPassword) {
        account.password = password;
      }
      account.description = description;
      account.permissions = appIdsAndNames.map(({ id, checkedLabels }) => ({
        instancePm2Id: id,
        availableActions: Object.keys(checkedLabels),
      }));
      await account.save();
      await invalidateSession(account._id);
      const message = `Successfully edit account with ID: ${accountId}.`;
      logger.info(message);
      req.session[ROOT_ALERT] = {
        type: 'success',
        message,
      };
      res.redirect('/manage-accounts');
    } catch (e) {
      pm2.disconnect();
      logger.error(`doPostEditAccount: ${e.message}.`);
      res.render('addEditAccount', {
        pageType: 'Edit',
        account: { ...req.body },
        error: e.name !== 'ValidationError' ? e.message : '',
        errors: e.errors,
        apps: appIdsAndNames,
        omitPasswordCheckbox: true,
        omitPasswordLabel: omitPassword === 'on' ? 'checked' : '',
        disablePasswordField: omitPassword === 'on' ? 'disabled' : '',
      });
    }
  },
  async doGetDeleteAccount(req, res) {
    const { accountId } = req.params;
    let type = 'success';
    let message = `Successfully deleted account with ID: ${accountId}.`;
    try {
      const account = await AccountModel.findById(accountId);
      if (!account) {
        throw new Error(`Account with ID: ${accountId} not exist.`);
      }
      await AccountModel.findByIdAndDelete(account._id);
      await invalidateSession(account._id);
      logger.info(message);
    } catch (e) {
      type = 'danger';
      message = e.message;
      logger.error(`doGetDeleteAccount: ${e.message}.`);
    }
    req.session[ROOT_ALERT] = {
      type,
      message,
    };
    res.redirect('/manage-accounts');
  },
};
