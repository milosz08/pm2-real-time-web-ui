'use strict';

const { monitIo, consoleIo } = require('../server');
const monit = require('./monit');
const console = require('./console');
const AccountModel = require('../db/accountSchema');
const sessionStore = require('../utils/session');

const authenticationHandler = async (socket, next) => {
  try {
    const cookies = socket.request.headers.cookie;
    const sessionID = cookies && cookies.split('connect.sid=')[1]
      ?.split('.')[0]
      ?.substring(4);
    if (!sessionID) {
      throw new Error('WS authentication error');
    }
    const session = await new Promise((resolve, reject) => {
      sessionStore.get(sessionID, (err, session) => {
        if (err || !session) {
          reject(new Error('WS authentication error'));
        }
        resolve(session);
      });
    });
    const account = await AccountModel.findById(session.loggedUser.id);
    const accountApps = account.getApps('view');
    const { id } = socket.handshake.query;
    if (id && !account.checkAppPermission(accountApps, Number(id))) {
      throw new Error('WS forbidden channel error');
    }
    socket.session = session;
    socket.broadcasting = socket.handshake.query;
    socket.accountApps = accountApps;
    next();
  } catch (e) {
    next(e);
  }
};

monitIo.use(authenticationHandler);
consoleIo.use(authenticationHandler);

monitIo.on('connection', async socket => {
  await monit.onStartConnection(socket);
  socket.on('disconnect', monit.onCloseConnection);
});

consoleIo.on('connection', async socket => {
  await console.onStartConnection(socket);
  socket.on('disconnect', console.onCloseConnection);
});
