'use strict';

const pm2 = require('pm2');
const fs = require('fs');
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
  async readLogsReverse(pmId, type, nextByte) {
    if (!config.logTypes.includes(type)) {
      logger.error(`Unknown type of logs: ${type}. Valid: ${config.logTypes}`);
      return { logLines: [], nextByte: -1 };
    }
    const app = await this.getProcessDetails(pmId);
    let logPath = app.pm2_env.pm_out_log_path;
    if (type === 'err') {
      logPath = app.pm2_env.pm_err_log_path;
    }
    const fileSize = await new Promise(resolve => {
      fs.stat(logPath, (err, stats) => (
        resolve(err ? -1 : stats.size)
      ));
    });
    if (fileSize === -1) {
      return { logLines: [], nextByte: -1 };
    }
    return await new Promise(resolve => {
      const next = parseInt(nextByte);
      const end = next && next >= 0 ? next : fileSize;
      const dataSize = config.logsBufferLinesCount * 200;
      let data = '';
      const logFile = fs.createReadStream(logPath, {
        start: Math.max(0, end - dataSize),
        end,
      });
      logFile.on('data', chunk => {
        data += chunk.toString();
      });
      logFile.on('end', () => {
        data = data.split('\n');
        data = data.slice(-(config.logsBufferLinesCount + 1));
        const sentDateSize = Buffer.byteLength(data.join('\n'), 'utf-8');
        data.pop();
        resolve({
          logLines: data.reverse(),
          nextByte: (end - sentDateSize),
        });
      });
    });
  },
};
