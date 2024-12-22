'use strict';

const fs = require('fs').promises;
const vm = require('vm');
const config = require('../utils/config');
const logger = require('../utils/logger');

module.exports = {
  async doGetEcosystemFile(req, res) {
    const csrfToken = req.csrfToken();
    let error = '';
    let jsonAppsFileContent = '';
    try {
      const ecosystemFileData = await fs.readFile(config.ecosystemConfigFilePath, 'utf8');

      const script = new vm.Script(ecosystemFileData);
      const sandbox = { module: {}, require };
      vm.createContext(sandbox);
      script.runInContext(sandbox);

      const ecosystemConfig = sandbox.module.exports;
      const apps = ecosystemConfig.apps;
      jsonAppsFileContent = JSON.stringify(apps, null, 2);
    } catch (e) {
      error = e.message;
      logger.error(`doGetEcosystemFile: ${e.message}.`);
    }
    res.render('ecosystemFile', {
      csrfToken,
      error,
      jsonAppsFileContent,
    });
  }
}
