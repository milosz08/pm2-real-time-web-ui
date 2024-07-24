'use strict';

const byteSize = require('byte-size');
const pm2 = require('pm2');
const { io } = require('../server');
const pm2Async = require('../utils/pm2AsyncApi');
const dateFormat = require('../utils/dateFormat');
const { interval } = require('../utils/config');

let connectedWithPm2 = false;
const monitIntervals = new Map();

const checkIfRoomHasParticipants = (roomName) => {
  const roomSockets = io.sockets.adapter.rooms.get(roomName);
  if (!roomSockets || roomSockets.size === 0) {
    const interval = monitIntervals.get(roomName);
    if (interval) {
      clearInterval(interval);
    }
    monitIntervals.delete(roomName);
    console.log('Removed interval: ', roomName);
    return false;
  }
  return true;
};

const constructAppDetails = (app) => ({
  pId: app.pid,
  cpu: app.monit.cpu,
  memory: `${byteSize(app.monit.memory)}`,
  memoryRaw: parseFloat(byteSize(app.monit.memory).value),
  uptime: dateFormat.toMostSignificant(app.pm2_env.pm_uptime),
  status: app.pm2_env.status,
});

const perTickSendMonit = async () => {
  try {
    const roomName = 'all';
    if (checkIfRoomHasParticipants(roomName)) {
      const apps = await pm2Async.getListOfProcesses();
      const monitAppAsMap = apps.reduce((acc, app) => {
        acc[app.pm_id] = constructAppDetails(app);
        return acc;
      }, {});
      io.to(roomName).emit('monit:all', monitAppAsMap);  
    }
  } catch (e) {}
};

const perTickSingleSendMonit = async (roomName, pmId) => {
  try {
    if (checkIfRoomHasParticipants(roomName)) {
      const app = await pm2Async.getProcessDetails(pmId);
      io.to(roomName).emit('monit:single', constructAppDetails(app));
    }
  } catch (e) {}
};

const determinateRoomName = (socket) => {
  let roomName = socket.broadcasting.type;
  if (socket.broadcasting.id) {
    roomName += `-${socket.broadcasting.id}`;
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
      const isRoomNotEmpty = io.sockets.adapter.rooms.get(roomName)?.size !== 0;
      if (!isIntervalNotStarted && isRoomNotEmpty) {
        let intervalFunction;
        if (socket.broadcasting.type === 'all') {
          intervalFunction = setInterval(perTickSendMonit, interval);
        } else {
          intervalFunction = setInterval(() => {
            perTickSingleSendMonit(roomName, socket.broadcasting.id)
          }, interval);
        }
        monitIntervals.set(roomName, intervalFunction);
        console.log('Start interval: ', roomName);
      }
    } catch (e) {
      console.error(e.message);
    }
  },
  onCloseConnection() {
    // disconnect with PM2, when none rooms is active
    // or all monit intervals are terminated
    if (monitIntervals.size === 0 || io.sockets.adapter.rooms.size === 0) {
      pm2.disconnect();
      connectedWithPm2 = false;
    }
  },
};
