'use strict';

const { io } = require('../server');

module.exports = {
  pong({ message }) {
    io.to(this.id).emit('test:pong', {
      message,
    });
  },
};
