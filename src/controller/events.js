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

const constructTotalDetails = (apps) => {
  const runningApps = apps.filter(({ pm2_env }) => pm2_env.status === 'online');
  return {
    cpu: `${apps.reduce((acc, { monit }) => acc + monit.cpu, 0)}%`,
    memory: byteSize(apps.reduce((acc, { monit }) => acc + monit.memory, 0)).toString(),
    running: runningApps.length,
    suspended: apps.length - runningApps.length,
  }
}

const onTickAll = async (res, accountApps, user) => {
  try {
    const apps = (await pm2Async.getListOfProcesses())
      .filter((({ pm_id }) => user.role === config.adminRole || accountApps.includes(pm_id)));
    const monitAppAsMap = apps.reduce((acc, app) => {
      acc[app.pm_id] = constructAppDetails(app);
      return acc;
    }, {});
    const appsWithTotal = {
      total: constructTotalDetails(apps),
      ...monitAppAsMap,
    }
    res.write(formatMessage(appsWithTotal));
  } catch (e) {
    console.log(e)
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
  if (user.role !== config.adminRole && !accountApps.includes(parseInt(pmId))) {
    res.end();
    return;
  }
  await pm2Async.getProcessDetails(pmId);
};

const onCloseConnectionByClient = (req, res, intervalId, functionName) => {
  const user = req.session.loggedUser;
  res.on('close', () => {
    logger.debug(`${functionName}: Connection closed with client ${user.login}.`);
    clearInterval(intervalId);
    res.end();
  });
};

const startListeningAppLogs = (res, pmId, bus) => {
  bus.on('log:out', log => {
    if (log.process.pm_id === parseInt(pmId)) {
      res.write(formatMessage({ line: log.data, type: 'out' }));
    }
  });
  bus.on('log:err', log => {
    if (log.process.pm_id === parseInt(pmId)) {
      res.write(formatMessage({ line: log.data, type: 'err' }));
    }
  });
};

module.exports = {
  async sendMonitAllAppsData(req, res) {
    let intervalId;
    try {
      const user = req.session.loggedUser;
      logger.debug(`sendMonitAllAppsData: client ${user.login} connected.`);
  
      const account = await AccountModel.findById(user.id);
      const accountApps = account.getApps('view');

      const apps = await pm2Async.getListOfProcesses();
      if (apps.length === 0) {
        intervalId = setInterval(
          () => res.write(': ping\n\n'),
          config.ssePingInterval,
        );
      } else {
        intervalId = setInterval(
          async () => await onTickAll(res, accountApps, user),
          config.interval,
        );
      }
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
      logger.debug(`sendMonitSingleAppData: Client ${user.login} connected.`);
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
    let intervalId;
    try {
      const user = req.session.loggedUser;
      logger.debug(`sendConsoleAppData: Client ${user.login} connected.`);
      await checkIfUserHasAccess(user, pmId);
      const bus = await pm2Async.launchBus();
      startListeningAppLogs(res, pmId, bus);
      bus.on('process:event', packet => {
        if (packet.process.pm_id === parseInt(pmId) && packet.event === 'start') {
          startListeningAppLogs(res, pmId, bus);
        }
      });
      intervalId = setInterval(
        () => res.write(': ping\n\n'),
        config.ssePingInterval,
      );
      res.on('close', () => {
        logger.debug(`sendConsoleAppData: Connection closed with client ${user.login}.`);
        res.end();
      });
    } catch (e) {
      logger.error(e.message);
      clearInterval(intervalId);
      res.end();
    }
  },
};
