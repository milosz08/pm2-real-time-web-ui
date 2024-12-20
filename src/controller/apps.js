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
  cpu: `${app.monit.cpu.toFixed(2)}%`,
  memory: byteSize(app.monit.memory).toString(),
  uptime: app.pm2_env.status === 'online'
    ? dateFormat.toMostSignificant(app.pm2_env.pm_uptime)
    : '-',
  borderColor: determinateStatusColor(app.pm2_env.status)
    .replace('text', 'border'),
  isStopped: app.pm2_env.status === 'stopped',
  enabledActions: account.getActionsForApp(app.pm_id),
  isAdmin: account.role === config.adminRole,
});

const constructTotalDetails = (apps) => {
  const runningApps = apps.filter(({ pm2_env }) => pm2_env.status === 'online');
  return {
    cpu: `${apps.reduce((acc, { monit }) => acc + monit.cpu, 0).toFixed(2)}%`,
    memory: byteSize(apps.reduce((acc, { monit }) => acc + monit.memory, 0)).toString(),
    running: runningApps.length,
    suspended: apps.length - runningApps.length,
  }
}

module.exports = {
  async doGetApps(req, res) {
    let pm2Apps = [];
    let total = {};
    let error = null;
    try {
      const user = req.session.loggedUser;
      const account = await AccountModel.findById(user.id);
      const accountApps = account.getApps('view');
      const apps = await pm2Async.getListOfProcesses();

      const filteredApps = apps.filter(({ pm_id }) => account.checkAppPermission(accountApps, pm_id))
      pm2Apps = filteredApps.map(app => createAppDetailsObject(account, app));
      total = constructTotalDetails(filteredApps)
    } catch (e) {
      error = e.message;
    }
    res.render('apps', {
      pm2Apps,
      total,
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
      if (!account.checkAppPermission(accountApps, parseInt(pmId))) {
        res.redirect('/');
        return;
      }
      const app = await pm2Async.getProcessDetails(pmId);
      appDetails = {
        ...createAppDetailsObject(account, app),
        execPath: app.pm2_env.pm_exec_path,
        logsData: await config.logTypes.reduce(async (accPromise, type) => {
          const acc = await accPromise;
          return {
            ...acc,
            [type]: await pm2Async.readLogsReverse(pmId, type, 0),
          };
        }, Promise.resolve({})),
      };
    } catch (e) {
      error = e.message;
    }
    res.render('appDetails', {
      error,
      appDetails,
    });
  },
};
