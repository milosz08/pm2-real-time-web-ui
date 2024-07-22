(() => {
  const socket = io({ transports: ["websocket"] });

  socket.on('test:pong', ({ message }) => console.log(message));
  socket.emit('test:ping', { message: 'hello from ws' });
})();
