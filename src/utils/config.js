'use strict';

const commandLineArgs = require('command-line-args');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();

const options = commandLineArgs([
  { name: 'port', type: Number, defaultValue: 3000 },
  { name: 'interval', type: Number, defaultValue: 1000 },
  { name: 'sesTime', type: Number, defaultValue: 60 * 60 * 2 },
]);

module.exports = {
  port: options.port,
  interval: options.interval,
  sessionMaxLife: options.sesTime,
  sessionSecret: process.env.PM2_SECRET_KEY || uuidv4(),
  isProd: process.env.NODE_ENV === 'production',
  dbConnection: process.env.PM2_DB_CONNECTION,
  adminLogin: process.env.PM2_ADMIN_LOGIN,
  adminPassword: process.env.PM2_ADMIN_PASSWORD,
  validActions: ['view', 'start', 'reload', 'restart', 'stop'],
  adminRole: 'admin',
  userRole: 'user',
  hCaptchaEnabled: true,
  hCaptchaSiteKey: process.env.PM2_H_CAPTCHA_SITE_KEY,
  hCaptchaSecretKey: process.env.PM2_H_CAPTCHA_SECRET_KEY,
  logsBufferLinesCount: 100, // size of the buffer for reading consecutive log lines through the stream
  realTimeLogsBufferLinesCount: 1000, // start removing real-time logs one-by-one from the oldest
  logTypes: ['out', 'err'],
};
