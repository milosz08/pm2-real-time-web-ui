'use strict';

const { sessionIo } = require('../server');
const session = require('./session');

const authenticationHandler = async (socket, next) => {
  try {
    const cookies = socket.request.headers.cookie;
    const sessionID = cookies && cookies.split('connect.sid=')[1]
      ?.split('.')[0]
      ?.substring(4);
    socket.session = session.getSessionBySid(sessionID);
    next();
  } catch (e) {
    next(e);
  }
};

sessionIo.use(authenticationHandler);
