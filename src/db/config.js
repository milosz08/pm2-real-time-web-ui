'use strict';

const mongoose = require('mongoose');
const config = require('../utils/config');
const logger = require('../utils/logger');
const AccountModel = require('./accountSchema');
const utils = require('../db/utils');

module.exports = {
  connect() {
    mongoose.connect(config.dbConnection)
      .then(() => logger.info('Successfully connected with DB.'))
      .catch(e => logger.error(`Unable to connect with DB. Cause: ${e.message}.`));
  },
  async createDefaultAdminAccount() {
    try {
      const account = await AccountModel.findOne({ role: utils.adminRole });
      if (account) {
        logger.info('Admin account was already created. 0 row affected.');
        return;
      }
      const adminAccount = new AccountModel({
        login: config.adminLogin,
        password: config.adminPassword,
        role: utils.adminRole,
        permissions: [],
      });
      await adminAccount.save();
      logger.info('Saved admin account in DB. 1 row affected.');
    } catch (e) {
      logger.error(e.message);
      process.exit(-1);
    }
  },
  disconnect(signal) {
    logger.info(`Received ${signal}. Shutting down DB gracefully...`);
    mongoose.disconnect()
      .then(() => logger.info('Successfully disconnected with DB.'))
      .catch(e => logger.error(`Unable to disconnect from DB. Cause: ${e.message}.`));
  },
};
