'use strict';

const commandLineArgs = require('command-line-args');
const { v4: uuidv4 } = require('uuid');

const options = commandLineArgs([
  { name: 'prod', type: Boolean, defaultValue: false },
  { name: 'port', alias: 'p', type: Number, defaultValue: 3000 },
  { name: 'interval', alias: 'i', type: Number, defaultValue: 1000 },
]);

module.exports = {
  port: options.port,
  interval: options.interval,
  sessionMaxLife: 60 * 60,
  sessionSecret: process.env.PM2_WEBUI_SECRET_KEY || uuidv4(),
  isProd: options.prod,
}
