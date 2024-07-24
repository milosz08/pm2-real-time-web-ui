'use strict';

const maxTime = window.sessionTime;
const tickDuration = 1000;

let sessionInterval = null;

function onSessionTick() {
  if (Date.now() >= maxTime) {
    clearInterval(sessionInterval);
    sessionInterval = null;
    window.location.href = '/logout?reason=sessionEnded';
  }
}

sessionInterval = setInterval(onSessionTick, tickDuration);
