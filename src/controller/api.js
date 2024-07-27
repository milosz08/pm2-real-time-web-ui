'use strict';

const pm2 = require('pm2');
const pm2Async = require('../utils/pm2AsyncApi');
const logger = require('../utils/logger');
const AccountModel = require('../db/accountSchema');

const commonAppManagementProcess = async (
  req,
  res,
  actionText,
  checkStateCallback,
  actionCallback,
) => {
  const { pmId } = req.query;
  let message = `App was successfully ${actionText}.`;
  let status = 'success';
  try {
    const app = await pm2Async.getProcessDetails(pmId);
    if (checkStateCallback(app.pm2_env.status)) {
      throw new Error('Unable to perform action. Impropriety app state.')
    }
    await actionCallback(pmId);
    logger.info(`App ID: ${pmId}, ${message}.`);
  } catch (e) {
    message = e.message;
    status = 'error';
    logger.error(e.message);
  }
  res.json({ message, status });
};

module.exports = {
  async startApp(req, res) {
    await commonAppManagementProcess(
      req,
      res,
      'started',
      status => status === 'online',
      async appId => await pm2Async.startApp(appId),
    );
  },
  async reloadApp(req, res) {
    await commonAppManagementProcess(
      req,
      res,
      'reloaded',
      status => status !== 'online',
      async appId => await pm2Async.reloadApp(appId),
    );
  },
  async restartApp(req, res) {
    await commonAppManagementProcess(
      req,
      res,
      'restarted',
      status => status !== 'online',
      async appId => await pm2Async.restartApp(appId),
    );
  },
  async stopApp(req, res) {
    await commonAppManagementProcess(
      req,
      res,
      'stopped',
      status => status !== 'online',
      async appId => await pm2Async.stopApp(appId),
    );
  },
  async deleteApp(req, res) {
    const { pmId } = req.query;
    let message = `App was successfully deleted.`;
    let status = 'success';
    try {
      await pm2Async.deleteApp(pmId);
      await AccountModel.updateMany(
        {},
        {
          $pull: {
            permissions: {
              instancePm2Id: pmId
            },
          },
        },
      );
      logger.info(`App ID: ${pmId}, ${message}.`);
    } catch (e) {
      message = e.message;
      status = 'error';
      logger.error(e.message);
    }
    res.json({ message, status });
  },
};
