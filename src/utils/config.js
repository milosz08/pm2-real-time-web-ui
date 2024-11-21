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
  ssePingInterval: 15_000,
  sessionMaxLife: options.sesTime,
  isProd: process.env.NODE_ENV === 'production',
  dbConnection: process.env.PM2_DB_CONNECTION,
  adminLogin: process.env.PM2_ADMIN_LOGIN,
  adminPassword: process.env.PM2_ADMIN_PASSWORD,
  adminPasswordHashed: process.env.PM2_ADMIN_PASSWORD_HASHED === 'true',
  validActions: ['view', 'start', 'reload', 'restart', 'stop'],
  adminRole: 'admin',
  userRole: 'user',
  hCaptchaEnabled: true,
  hCaptchaSiteKey: process.env.PM2_H_CAPTCHA_SITE_KEY,
  hCaptchaSecretKey: process.env.PM2_H_CAPTCHA_SECRET_KEY,
  logsBufferLinesCount: 100,
  realTimeLogsBufferLinesCount: 1000,
  logTypes: ['out', 'err'],
  cookieSecret: process.env.PM2_COOKIE_SECRET || uuidv4(),
  csrfSecret: process.env.PM2_CSRF_SECRET || uuidv4().replaceAll('-', ''),
};
