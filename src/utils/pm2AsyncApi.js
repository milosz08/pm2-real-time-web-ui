'use strict';

const pm2 = require('pm2');
const logger = require('./logger');
const config = require('./config');

const commonPm2PromiseCallback = (resolve, reject, err, app, text) => {
  if (err) {
    reject(new Error(`Unable to ${text} selected app.`));
  }
  resolve(app);
};

module.exports = {
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
  },
  async launchBus() {
    return await new Promise((resolve, reject) => {
      pm2.launchBus((err, bus) => err
        ? reject(new Error('Unable to launch bus'))
        : resolve(bus)
      );
    });
  },
  async flushAppLogs(pmId) {
    return await new Promise((resolve, reject) => {
      pm2.flush(pmId, err => err
        ? reject(new Error('Unable to flush logs.'))
        : resolve()
      );
    });
  },
  async readLogsReverse(pmId, type, offset) {
    if (!config.logTypes.includes(type)) {
      logger.error(`Unknown type of logs: ${type}. Valid: ${config.logTypes}`);
      return [];
    }

    console.log(pmId, type, offset);
    const logLines = []; // TODO: get logs from log file based page

    for (let i = 0; i < 50; i++) {
      const date = new Date().toString();
      logLines.push(`${i}: ${date} - example fetched logs ${type}`);
    }

    return logLines.reverse();
  },
};
