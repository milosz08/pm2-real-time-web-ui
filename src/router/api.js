'use strict';

const { Router } = require('express');
const api = require('../controller/api');
const middleware = require('../middleware/auth');
const events = require('../controller/events');

const router = Router();

router.get('/start', middleware.checkRightsToAppApi, api.startApp);
router.get('/reload', middleware.checkRightsToAppApi, api.reloadApp);
router.get('/restart', middleware.checkRightsToAppApi, api.restartApp);
router.get('/stop', middleware.checkRightsToAppApi, api.stopApp);
router.get('/delete', middleware.checkRightsToAppApi, api.deleteApp);

router.get('/event/all', middleware.checkRightsToEventStream, events.sendMonitAllAppsData);
router.get('/event/single/:pmId', middleware.checkRightsToEventStream, events.sendMonitSingleAppData);
router.get('/event/console/:pmId', middleware.checkRightsToEventStream, events.sendConsoleAppData);

module.exports = router;
