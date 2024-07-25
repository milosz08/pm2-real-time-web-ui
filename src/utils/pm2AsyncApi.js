'use strict';

const pm2 = require('pm2');

const commonPm2PromiseCallback = (resolve, reject, err, app, text) => {
  if (err) {
    reject(new Error(`Unable to ${text} selected app.`));
  }
  resolve(app);
};

module.exports = {
  async connect() {
    return await new Promise((resolve, reject) => {
      pm2.connect(err => err
        ? reject(new Error('Unable to connect with PM2.'))
        : resolve()
      );
    });
  },
  async getListOfProcesses() {
    return await new Promise((resolve, reject) => {
      pm2.list((err, apps) => err
        ? reject(new Error('Unable to get list of processes.'))
        : resolve(apps)
      );
    });
  },
  async getProcessDetails(pmId) {
    return await new Promise((resolve, reject) => {
      pm2.describe(pmId, (err, apps) => {
        if (!Array.isArray(apps) || apps.length === 0 || err) {
          reject(new Error('Unable to get process details.'));
        } else {
          resolve(apps[0]);
        }
      });
    });
  },
  async startApp(pmId) {
    return await new Promise((resolve, reject) => {
      pm2.start(pmId,(err, app) => 
        commonPm2PromiseCallback(resolve, reject, err, app, 'start'));
    });
  },
  async reloadApp(pmId) {
    return await new Promise((resolve, reject) => {
      pm2.reload(pmId, (err, app) => 
        commonPm2PromiseCallback(resolve, reject, err, app, 'reload'));
    });
  },
  async restartApp(pmId) {
    return await new Promise((resolve, reject) => {
      pm2.restart(pmId, (err, app) => 
        commonPm2PromiseCallback(resolve, reject, err, app, 'restart'));
    });
  },
  async stopApp(pmId) {
    return await new Promise((resolve, reject) => {
      pm2.stop(pmId, (err, app) => 
        commonPm2PromiseCallback(resolve, reject, err, app, 'stop'));
    });
  },
  async deleteApp(pmId) {
    return await new Promise((resolve, reject) => {
      pm2.delete(pmId, (err, app) =>
        commonPm2PromiseCallback(resolve, reject, err, app, 'delete'));
    });
  }
};
