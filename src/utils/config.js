'use strict';

const commandLineArgs = require('command-line-args');
const { v4: uuidv4 } = require('uuid');

const options = commandLineArgs([
  { name: 'port', type: Number, defaultValue: 3000 },
  { name: 'interval', type: Number, defaultValue: 1000 },
  { name: 'logsInterval', type: Number, defaultValue: 4000 },
  { name: 'sesTime', type: Number, defaultValue: 60 * 60 * 2 },
]);

module.exports = {
  port: options.port,
  interval: options.interval,
  logsInterval: options.logsInterval,
  sessionMaxLife: options.sesTime,
  sessionSecret: process.env.PM2_SECRET_KEY || uuidv4(),
  isProd: process.env.NODE_ENV === 'production',
};
