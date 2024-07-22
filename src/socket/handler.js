'use strict';

const { io } = require('../server');
const { pong } = require('./test');

io.on('connection', socket => {
  socket.on('test:ping', pong);
});
