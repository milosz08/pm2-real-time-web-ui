'use strict';

const pm2 = require('pm2');
const byteSize = require('byte-size');
const logger = require('../utils/logger');
const config = require('../utils/config');
const pm2Async = require('../utils/pm2AsyncApi');
const dateFormat = require('../utils/dateFormat');
const AccountModel = require('../db/accountSchema');
const utils = require('../db/utils');

const formatMessage = (message) => {
  return `data: ${JSON.stringify(message)}\n\n`;
};

const constructAppDetails = (app) => ({
  pId: app.pid,
  cpu: app.monit.cpu,
  memory: `${byteSize(app.monit.memory)}`,
  uptime: app.pm2_env.status === 'online'
    ? dateFormat.toMostSignificant(app.pm2_env.pm_uptime)
    : '-',
  status: app.pm2_env.status,
});

const onTickAll = async (res, accountApps, user) => {
  try {
    const apps = await pm2Async.getListOfProcesses();
    const monitAppAsMap = apps.reduce((acc, app) => {
      if (user.role === utils.adminRole || accountApps.includes(app.pm_id)) {
        acc[app.pm_id] = constructAppDetails(app);
      }
      return acc;
    }, {});
    res.write(formatMessage(monitAppAsMap));
  } catch (e) {
  }
};

const onTickSelected = async (res, pmId) => {
  try {
    const app = await pm2Async.getProcessDetails(pmId);
    res.write(formatMessage(constructAppDetails(app)));
  } catch (e) {}
};

const onCloseConnectionByClient = (req, res, intervalId, functionName) => {
  const user = req.session.loggedUser;
  res.on('close', () => {
    logger.info(`${functionName}: Connection closed with client ${user.login}.`);
    clearInterval(intervalId);
    res.end();
  });
};

module.exports = {
  async sendMonitAllAppsData(req, res) {
    let intervalId;
    try {
      const user = req.session.loggedUser;
      logger.info(`sendMonitAllAppsData: client ${user.login} connected.`);
  
      const account = await AccountModel.findById(user.id);
      const accountApps = account.getApps('view');

      const apps = await pm2Async.getListOfProcesses();
      if (apps.length === 0) {
        res.end();
        return;
      }
      intervalId = setInterval(
        async () => await onTickAll(res, accountApps, user),
        config.interval,
      );
      onCloseConnectionByClient(req, res, intervalId, 'sendMonitAllAppsData');
    } catch (e) {
      logger.error(e.message);
      clearInterval(intervalId);
      res.end();
    }
  },
  async sendMonitSingleAppData(req, res) {
    const { pmId } = req.params;
    let intervalId;
    try {
      const user = req.session.loggedUser;
      logger.info(`sendMonitSingleAppData: Client ${user.login} connected.`);

      const account = await AccountModel.findById(user.id);
      const accountApps = account.getApps('view');

      if (user.role !== utils.adminRole && !accountApps.includes(Number(pmId))) {
        pm2.disconnect();
        res.end();
        return;
      }
      await pm2Async.connect();
      await pm2Async.getProcessDetails(pmId);

      intervalId = setInterval(
        async () => await onTickSelected(res, pmId),
        config.interval,
      );
      onCloseConnectionByClient(req, res, intervalId, 'sendMonitSingleAppData');
    } catch (e) {
      logger.error(e.message);
      clearInterval(intervalId);
      res.end();
    }
  },
  sendConsoleAppData(req, res) {

  },
};
