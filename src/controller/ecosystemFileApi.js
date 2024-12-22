'use strict';

const fs = require('fs').promises;
const config = require('../utils/config');
const logger = require('../utils/logger');

module.exports = {
  async updateEcosystemFile(req, res) {
    const csrfToken = req.csrfToken();
    const body = req.body;
    let message = 'Successfully updated ecosystem file.';
    let status = 'success';
    try {
      if (!body.content) {
        throw Error('Content file is empty.');
      }
      const parsed = JSON.parse(body.content);
      const withAppHeader = {
        apps: parsed,
      };
      const beautyStringified = JSON.stringify(withAppHeader, null, 2);
      const withExport = `module.exports = ${beautyStringified}`;

      await fs.writeFile(config.ecosystemConfigFilePath, withExport, 'utf8');
      logger.info(`updateEcosystemFile: ${message}`);
    } catch (e) {
      message = e.message;
      status = 'error';
      logger.error(`updateEcosystemFile: ${e.message}`);
    }
    res.json({ message, status, csrf: csrfToken });
  }
}