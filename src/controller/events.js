'use strict';

const byteSize = require('byte-size');
const logger = require('../utils/logger');
const config = require('../utils/config');
const pm2Async = require('../utils/pm2AsyncApi');
const dateFormat = require('../utils/dateFormat');
const AccountModel = require('../db/accountSchema');

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
      if (user.role === config.adminRole || accountApps.includes(app.pm_id)) {
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

const checkIfUserHasAccess = async (user, pmId) => {
  const account = await AccountModel.findById(user.id);
  const accountApps = account.getApps('view');
  if (user.role !== config.adminRole && !accountApps.includes(Number(pmId))) {
    res.end();
    return;
  }
  await pm2Async.getProcessDetails(pmId);
};

const onCloseConnectionByClient = (req, res, intervalId, functionName) => {
  const user = req.session.loggedUser;
  res.on('close', () => {
    logger.info(`${functionName}: Connection closed with client ${user.login}.`);
    clearInterval(intervalId);
    res.end();
  });
};

const startListeningAppLogs = (res, pmId, bus) => {
  bus.on('log:out', log => {
    if (log.process.pm_id === Number(pmId)) {
      res.write(formatMessage({ line: log.data, type: 'out' }));
    }
  });
  bus.on('log:err', log => {
    if (log.process.pm_id === Number(pmId)) {
      res.write(formatMessage({ line: log.data, type: 'err' }));
    }
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
      await checkIfUserHasAccess(user, pmId);
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
  async sendConsoleAppData(req, res) {
    const { pmId } = req.params;
    try {
      const user = req.session.loggedUser;
      logger.info(`sendConsoleAppData: Client ${user.login} connected.`);
      await checkIfUserHasAccess(user, pmId);
      const bus = await pm2Async.launchBus();
      startListeningAppLogs(res, pmId, bus);
      bus.on('process:event', packet => {
        if (packet.process.pm_id === Number(pmId)) {
          startListeningAppLogs(res, pmId, bus);
        }
      });
      res.on('close', () => {
        logger.info(`sendConsoleAppData: Connection closed with client ${user.login}.`);
        res.end();
      });
    } catch (e) {
      logger.error(e.message);
      res.end();
    }
  },
};
