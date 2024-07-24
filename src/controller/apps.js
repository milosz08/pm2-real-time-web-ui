'use strict';

const pm2 = require('pm2');
const byteSize = require('byte-size');
const pm2Async = require('../utils/pm2AsyncApi');
const dateFormat = require('../utils/dateFormat');

module.exports = {
  async doGetApps(_, res) {
    let pm2Apps = [];
    let error = null;
    try {
      await pm2Async.connect();
      const apps = await pm2Async.getListOfProcesses();
      pm2.disconnect();
      pm2Apps = apps.map(app => ({
        pmId: app.pm_id, 
        pId: app.pid,
        name: app.name,
        status: app.pm2_env.status,
        cpu: `${app.monit.cpu}%`,
        memory: `${byteSize(app.monit.memory)}`,
        uptime: dateFormat.toMostSignificant(app.pm2_env.pm_uptime),
      }));
    } catch (e) {
      error = e.message;
    }
    res.render('apps', {
      pm2Apps,
      error,
    });
  },
  async doGetAppDetails(req, res) {
    const pmId = req.params.pmId;
    let error = null;
    let appDetails;
    try {
      await pm2Async.connect();
      const app = await pm2Async.getProcessDetails(pmId);
      appDetails = {
        pId: app.pid,
        name: app.name,
        status: app.pm2_env.status,
        cpu: `${app.monit.cpu}%`,
        memory:`${byteSize(app.monit.memory)}`,
        uptime: dateFormat.toMostSignificant(app.pm2_env.pm_uptime),
        execPath: app.pm2_env.pm_exec_path,
      }
    } catch (e) {
      error = e.message;
    }
    res.render('appDetails', {
      error,
      pmId,
      appDetails,
    });
  },
};
