'use strict';

const { DateTime } = require('luxon');

module.exports = {
  toMostSignificant(unixTime) {
    const startTime = DateTime.fromMillis(unixTime);
    const { days, hours, minutes, seconds } = DateTime.now()
      .diff(startTime, ['days', 'hours', 'minutes', 'seconds'])
      .toObject();
    
    const parts = [];
    if (days) {
      parts.push(`${Math.floor(days)} d`);
    }
    if (hours) {
      parts.push(`${Math.floor(hours)} h`);
    }
    if (minutes) {
      parts.push(`${Math.floor(minutes)} min`);
    }
    if (seconds) {
      parts.push(`${Math.floor(seconds)} sec`);
    }
    return parts.join(', ');
  },
};
