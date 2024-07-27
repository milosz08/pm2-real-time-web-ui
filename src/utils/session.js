'use strict';

const memoryStore = require('memorystore');
const expressSession = require('express-session');
const config = require('../utils/config');

const MemoryStore = memoryStore(expressSession);
const sessionStore = new MemoryStore({
  checkPeriod: config.sessionMaxLife,
});

module.exports = {
  sessionStore,
  async getSessionBySid(sId, error = 'Authentication Error') {
    return await new Promise((resolve, reject) => {
      sessionStore.get(sId, (err, session) => {
        if (err || !session) {
          reject(new Error(error));
        }
        resolve(session);
      });
    });
  },
  async getSessionUser(userId) {
    return await new Promise((resolve, reject) => {
      sessionStore.all((err, session) => {
        if (err || !session) {
          reject(new Error('Unable to get current session.'));
        }
        const revokingUser = Object
          .entries(session)
          .find(([_, value]) => value.loggedUser.id === userId.toString());
        resolve(revokingUser ? {
          sid: revokingUser[0],
          socketId: revokingUser[1]?.loggedUser?.socketId,
        } : null);
      });
    });
  },
  async removeUserFromSession(sid) {
    if (sid) {
      await new Promise((resolve, reject) => {
        sessionStore.destroy(sid, (err) => {
          if (err) {
            reject(new Error('Unable to get current session.'));
          }
          logger.info(`Destroyed session for user SID: ${sid}`)
          resolve();
        });
      });
    }
  },
};
