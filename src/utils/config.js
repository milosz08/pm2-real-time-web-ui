'use strict';

const commandLineArgs = require('command-line-args');
const { v4: uuidv4 } = require('uuid');

const options = commandLineArgs([
  { name: 'prod', type: Boolean, defaultValue: false },
  { name: 'port', type: Number, defaultValue: 3000 },
  { name: 'interval', type: Number, defaultValue: 1000 },
  { name: 'logsInterval', type: Number, defaultValue: 5000 },
]);

module.exports = {
  port: options.port,
  interval: options.interval,
  logsInterval: options.logsInterval,
  sessionMaxLife: 60 * 60,
  sessionSecret: process.env.PM2_WEBUI_SECRET_KEY || uuidv4(),
  isProd: options.prod,
}
