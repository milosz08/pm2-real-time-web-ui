'use strict';

const { io, sessionStore } = require('../server');
const monit = require('./monit');

const authenticationHandler = async (socket, next) => {
  try {
    const cookies = socket.request.headers.cookie;
    const sessionID = cookies && cookies.split('connect.sid=')[1]
      ?.split('.')[0]
      ?.substring(4);
    if (!sessionID) {
      new Error('WS authentication error');
    }
    const session = await new Promise((resolve, reject) => {
      sessionStore.get(sessionID, (err, session) => {
        if (err || !session) {
          reject(new Error('WS authentication error'));
        }
        resolve(session);
      });
    });
    socket.broadcasting = socket.handshake.query;
    next();
  } catch (e) {
    next(e);
  }
};

io.use(authenticationHandler);

io.on('connection', async socket => {
  await monit.onStartConnection(socket);
  socket.on('disconnect', monit.onCloseConnection);
});
