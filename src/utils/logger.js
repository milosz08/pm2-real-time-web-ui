'use strict';

const path = require('path');
const winston = require('winston');

const { format, transports } = winston;
const LOGS_PATH = '.logs';

module.exports = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    format.colorize({ all: true }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(LOGS_PATH, 'error.log'),
      level: 'error',
    }),
    new transports.File({
      filename: path.join(LOGS_PATH, 'all.log'),
    }),
  ],
});
