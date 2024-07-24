'use strict';

const byteSize = require('byte-size');
const { io } = require('../server');
const pm2Async = require('../utils/pm2AsyncApi');
const dateFormat = require('../utils/dateFormat');
const { interval } = require('../utils/config');

const ROOM_ID = 'appsState';

let monitInterval = null;

const perTickSendMonit = async () => {
  try {
    const roomSockets = io.sockets.adapter.rooms.get(ROOM_ID);
    if (roomSockets && roomSockets.size > 0) {
      const apps = await pm2Async.getListOfProcesses();
      const monitAppAsMap = apps.reduce((acc, app) => {
        acc[app.pm_id] = {
          pId: app.pid,
          cpu: app.monit.cpu,
          memory: `${byteSize(app.monit.memory)}`,
          memoryRaw: parseFloat(byteSize(app.monit.memory).value),
          uptime: dateFormat.toMostSignificant(app.pm2_env.pm_uptime),
          status: app.pm2_env.status,
        };
        return acc;
      }, {});
      io.to(ROOM_ID).emit('monit:all', monitAppAsMap);
    } else {
      clearInterval(monitInterval);
      monitInterval = null;
    }
  } catch (e) {}
}

module.exports = {
  async onStartConnection(socket) {
    try {
      socket.join(ROOM_ID);
      if (!monitInterval) {
        await pm2Async.connect();
        monitInterval = setInterval(perTickSendMonit, interval);
      }
    } catch (e) {
      console.error(e.message);
    }
  },
  onCloseConnection() {
    if (io.sockets.adapter.rooms.get(ROOM_ID)?.size === 0) {
      pm2.disconnect();
      clearInterval(monitInterval);
      monitInterval = null;
    }
  },
};
