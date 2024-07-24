'use strict';

const pm2 = require('pm2');

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
};
