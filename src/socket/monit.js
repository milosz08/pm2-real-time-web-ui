'use strict';

const byteSize = require('byte-size');
const pm2 = require('pm2');
const { monitIo } = require('../server');
const pm2Async = require('../utils/pm2AsyncApi');
const dateFormat = require('../utils/dateFormat');
const { interval } = require('../utils/config');
const logger = require('../utils/logger');

let connectedWithPm2 = false;
const monitIntervals = new Map();

const checkIfRoomHasParticipants = (roomName) => {
  const roomSockets = monitIo.adapter.rooms.get(roomName);
  if (!roomSockets || roomSockets.size === 0) {
    const interval = monitIntervals.get(roomName);
    if (interval) {
      clearInterval(interval);
    }
    monitIntervals.delete(roomName);
    logger.info(`Removed interval - monit: ${roomName}.`);
    return false;
  }
  return true;
};

const constructAppDetails = (app) => ({
  pId: app.pid,
  cpu: app.monit.cpu,
  memory: `${byteSize(app.monit.memory)}`,
  memoryRaw: parseFloat(byteSize(app.monit.memory).value),
  uptime: app.pm2_env.status === 'online'
    ? dateFormat.toMostSignificant(app.pm2_env.pm_uptime)
    : '-',
  status: app.pm2_env.status,
});

const perTickSendMonit = async (roomName, accountApps) => {
  try {
    if (checkIfRoomHasParticipants(roomName)) {
      const apps = await pm2Async.getListOfProcesses();
      const monitAppAsMap = apps.reduce((acc, app) => {
        if (accountApps.length === 0 || accountApps.some(pmId => app.pm_id === pmId)) {
          acc[app.pm_id] = constructAppDetails(app);
        }
        return acc;
      }, {});
      monitIo.to(roomName).emit('monit:all', monitAppAsMap);
    }
  } catch (e) {}
};

const perTickSingleSendMonit = async (roomName, pmId) => {
  try {
    if (checkIfRoomHasParticipants(roomName)) {
      const app = await pm2Async.getProcessDetails(pmId);
      monitIo.to(roomName).emit('monit:single', constructAppDetails(app));
    }
  } catch (e) {}
};

const determinateRoomName = (socket) => {
  const accountApps = socket.accountApps;
  let roomName = 'all';
  if (accountApps.length !== 0 && !socket.broadcasting.id) {
    roomName += `-${accountApps.join('-')}`;
  } else if (socket.broadcasting.id) {
    roomName = `single-${socket.broadcasting.id}`;
  }
  return roomName;
};

module.exports = {
  async onStartConnection(socket) {
    try {
      const roomName = determinateRoomName(socket);
      socket.join(roomName);
      if (!connectedWithPm2) {
        await pm2Async.connect();
        connectedWithPm2 = true;
      }
      const isIntervalNotStarted = monitIntervals.get(roomName);
      const isRoomNotEmpty = monitIo.adapter.rooms.get(roomName)?.size !== 0;
      if (!isIntervalNotStarted && isRoomNotEmpty) {
        let intervalFunction;
        if (!socket.broadcasting.id) {
          intervalFunction = setInterval(() => {
            perTickSendMonit(roomName, socket.accountApps);
          }, interval);
        } else {
          intervalFunction = setInterval(() => {
            perTickSingleSendMonit(roomName, socket.broadcasting.id)
          }, interval);
        }
        monitIntervals.set(roomName, intervalFunction);
        logger.info(`Start interval - monit: ${roomName}.`);
      }
    } catch (e) {
      console.error(e.message);
    }
  },
  onCloseConnection() {
    if (monitIntervals.size === 0 || monitIo.adapter.rooms.size === 0) {
      pm2.disconnect();
      connectedWithPm2 = false;
      logger.info('Disconnect with PM2 - monit. Not active recipients.');
    }
  },
};
