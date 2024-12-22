'use strict';

const { Router } = require('express');
const api = require('../controller/api');
const ecosystemFileApi = require('../controller/ecosystemFileApi');
const middleware = require('../middleware/auth');
const events = require('../controller/events');

const router = Router();

router.patch('/start', middleware.checkRightsToAppApi, api.startApp);
router.patch('/reload', middleware.checkRightsToAppApi, api.reloadApp);
router.patch('/restart', middleware.checkRightsToAppApi, api.restartApp);
router.patch('/stop', middleware.checkRightsToAppApi, api.stopApp);
router.patch('/delete', middleware.checkRightsToAppApi, api.deleteApp);
router.patch('/flush', middleware.checkRightsToAppApi, api.flushAppLogs);
router.get('/logs', middleware.checkRightsToAppApi, api.fetchPartOfLogs);

router.patch('/ecosystem-file', middleware.userMustBeAdmin, ecosystemFileApi.updateEcosystemFile);

router.get('/event/all', middleware.checkRightsToEventStream, events.sendMonitAllAppsData);
router.get('/event/single/:pmId', middleware.checkRightsToEventStream, events.sendMonitSingleAppData);
router.get('/event/console/:pmId', middleware.checkRightsToEventStream, events.sendConsoleAppData);

module.exports = router;
