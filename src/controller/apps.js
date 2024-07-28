'use strict';

const byteSize = require('byte-size');
const pm2Async = require('../utils/pm2AsyncApi');
const dateFormat = require('../utils/dateFormat');
const AccountModel = require('../db/accountSchema');
const config = require('../utils/config');

const determinateStatusColor = (status) => {
  switch (status) {
    case 'online':
      return 'text-success';
    case 'stopped':
    case 'errored':
      return 'text-danger';
    case 'paused':
    case 'stopping':
      return 'text-warning';
    default:
      return '';
  }
};

const createAppDetailsObject = (account, app) => ({
  pmId: app.pm_id,
  pId: app.pid,
  name: app.name,
  status: app.pm2_env.status,
  statusColor: determinateStatusColor(app.pm2_env.status),
  cpu: `${app.monit.cpu}%`,
  memory: `${byteSize(app.monit.memory)}`,
  uptime: app.pm2_env.status === 'online'
    ? dateFormat.toMostSignificant(app.pm2_env.pm_uptime)
    : '-',
  borderColor: determinateStatusColor(app.pm2_env.status)
    .replace('text', 'border'),
  isStopped: app.pm2_env.status === 'stopped',
  enabledActions: account.getActionsForApp(app.pm_id),
  isAdmin: account.role === config.adminRole,
});

module.exports = {
  async doGetApps(req, res) {
    let pm2Apps = [];
    let error = null;
    try {
      const user = req.session.loggedUser;
      const account = await AccountModel.findById(user.id);
      const accountApps = account.getApps('view');
      const apps = await pm2Async.getListOfProcesses();
      pm2Apps = apps
        .filter(({ pm_id }) => account.checkAppPermission(accountApps, pm_id))
        .map(app => (createAppDetailsObject(account, app)));
    } catch (e) {
      error = e.message;
    }
    res.render('apps', {
      pm2Apps,
      isNoApps: pm2Apps.length === 0,
      error,
    });
  },
  async doGetAppDetails(req, res) {
    const { pmId } = req.params;
    let error = null;
    let appDetails;
    try {
      const user = req.session.loggedUser;
      const account = await AccountModel.findById(user.id);
      const accountApps = account.getApps('view');
      if (!account.checkAppPermission(accountApps, Number(pmId))) {
        res.redirect('/');
        return;
      }
      const app = await pm2Async.getProcessDetails(pmId);
      appDetails = {
        ...createAppDetailsObject(account, app),
        execPath: app.pm2_env.pm_exec_path,
      }
    } catch (e) {
      error = e.message;
    }
    res.render('appDetails', {
      error,
      appDetails,
    });
  },
};
