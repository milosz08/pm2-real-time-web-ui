'use strict';

const { Router } = require('express');
const apps = require('../controller/apps');
const auth = require('../controller/auth');
const manageAccounts = require('../controller/manageAccounts');
const events = require('../controller/events');
const middleware= require('../middleware/auth');

const router = Router();

router.get('/', middleware.userMustBeLogged, apps.doGetApps);
router.get('/app/:pmId', middleware.userMustBeLogged, apps.doGetAppDetails);

router.get('/login', middleware.userMustNotBeLogged, auth.doGetLogin);
router.post('/login', middleware.userMustNotBeLogged, auth.doPostLogin);
router.get('/logout', auth.doGetLogout);

router.get('/manage-accounts', middleware.userMustBeAdmin, manageAccounts.doGetAccounts);
router.get('/add-account', middleware.userMustBeAdmin, manageAccounts.doGetAddAccount);
router.post('/add-account', middleware.userMustBeAdmin, manageAccounts.doPostAddAccount);
router.get('/edit-account/:accountId', middleware.userMustBeAdmin, manageAccounts.doGetEditAccount);
router.post('/edit-account/:accountId', middleware.userMustBeAdmin, manageAccounts.doPostEditAccount);
router.get('/delete-account/:accountId', middleware.userMustBeAdmin, manageAccounts.doGetDeleteAccount);

router.get('/event/all', middleware.checkRightsToEventStream, events.sendMonitAllAppsData);
router.get('/event/single/:pmId', middleware.checkRightsToEventStream, events.sendMonitSingleAppData);
router.get('/event/console/:pmId', middleware.checkRightsToEventStream, events.sendConsoleAppData);

module.exports = router;
