'use strict';

const pm2 = require('pm2');
const byteSize = require('byte-size');
const pm2Async = require('../utils/pm2AsyncApi');
const dateFormat = require('../utils/dateFormat');

const determinateStatusColor = (status) => {
  switch (status) {
    case 'online':
      return 'text-success';
    case 'stopped':
    case 'errored':
      return 'text-danger';
    case 'paused':
      return 'text-warning';
    default:
      return '';
  }
};

const createAppDetailsObject = (app) => ({
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
});

module.exports = {
  async doGetApps(_, res) {
    let pm2Apps = [];
    let error = null;
    try {
      const userApps = [0,3]; // TODO: get user apps from DB
      await pm2Async.connect();
      const apps = await pm2Async.getListOfProcesses();
      pm2.disconnect();
      pm2Apps = apps
        .filter(({ pm_id }) => userApps.includes(pm_id) || userApps.length === 0)
        .map(app => (createAppDetailsObject(app)));
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
      const userApps = [0,3]; // TODO: get user apps from DB
      if (userApps.length !== 0 && !userApps.includes(Number(pmId))) {
        res.redirect('/');
        return;
      }
      await pm2Async.connect();
      const app = await pm2Async.getProcessDetails(pmId);
      appDetails = {
        ...createAppDetailsObject(app),
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
