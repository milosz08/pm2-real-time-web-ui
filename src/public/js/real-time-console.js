'use strict';

function onContentLoad() {
  const consoleContainer = document.querySelector('[console-pm-id]');
  const id = consoleContainer.dataset.pmId;

  const socket = io('/console', {
    transports: ['websocket'],
    query: {
      id,
    },
  });

  socket.on('logs:dump', tick => {
    console.log('console tick', tick);
  });

  socket.on('connect_error', function (error) {
    window.toast.error(error);
  });
}

document.addEventListener('DOMContentLoaded', onContentLoad);
