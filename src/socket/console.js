'use strict';

const pm2 = require('pm2');
const { consoleIo } = require('../server');
const pm2Async = require('../utils/pm2AsyncApi');
const { logsInterval } = require('../utils/config');
const logger = require('../utils/logger');

let connectedWithPm2 = false;
const consoleIntervals = new Map();

const checkIfRoomHasParticipants = (roomName) => {
  const roomSockets = consoleIo.adapter.rooms.get(roomName);
  if (!roomSockets || roomSockets.size === 0) {
    const interval = consoleIntervals.get(roomName);
    if (interval) {
      clearInterval(interval);
    }
    consoleIntervals.delete(roomName);
    logger.info('Removed interval - console: ', roomName);
    return false;
  }
  return true;
};

const onConsoleTick = (roomName, id) => {
  try {
    if (checkIfRoomHasParticipants(roomName)) {
      // TODO: sending console dump
      consoleIo.to(roomName).emit('logs:dump', `This is logs dump: ${id}`);
    }
  } catch (e) {}
};

module.exports = {
  async onStartConnection(socket) {
    try {
      const roomName = `console-${socket.broadcasting.id}`;
      socket.join(roomName);
      if (!connectedWithPm2) {
        await pm2Async.connect();
        connectedWithPm2 = true;
      }
      const isIntervalNotStarted = consoleIntervals.get(roomName);
      const isRoomNotEmpty = consoleIo.adapter.rooms.get(roomName)?.size !== 0;
      if (!isIntervalNotStarted && isRoomNotEmpty) {
        consoleIntervals.set(roomName, setInterval(() => {
          onConsoleTick(roomName, socket.broadcasting.id)
        }, logsInterval));
        logger.info('Start interval - console: ', roomName);
      }
    } catch (e) {
      console.error(e.message);
    }
  },
  onCloseConnection() {
    if (consoleIntervals.size === 0 || consoleIo.adapter.rooms.size === 0) {
      pm2.disconnect();
      connectedWithPm2 = false;
      logger.info('Disconnect with PM2 - console. Not active recipients.');
    }
  },
};
