'use strict';

const revokeKey = window.socketId;

function onContentLoad() {
  const socket = io('/session', {
    transports: ['websocket'],
    forceNew: true,
  });

  socket.on(`revoke:${revokeKey}`, function () {
    window.location.href = '/logout?reason=remoteHost';
  });

  socket.on('connect_error', function (error) {
    window.toast.error(error);
  });
}

document.addEventListener('DOMContentLoaded', onContentLoad);
