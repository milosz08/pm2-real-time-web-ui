'use strict';

const memoryStore = require('memorystore');
const expressSession = require('express-session');
const config = require('../utils/config');

const MemoryStore = memoryStore(expressSession);
const sessionStore = new MemoryStore({
  checkPeriod: config.sessionMaxLife,
});

module.exports = sessionStore;
