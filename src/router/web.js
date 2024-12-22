'use strict';

const { Router } = require('express');
const apps = require('../controller/apps');
const auth = require('../controller/auth');
const manageAccounts = require('../controller/manageAccounts');
const ecosystemFile = require('../controller/ecosystemFile');
const middleware= require('../middleware/auth');

const router = Router();

router.get('/', middleware.userMustBeLogged, apps.doGetApps);
router.get('/app/:pmId', middleware.userMustBeLogged, apps.doGetAppDetails);

router.get('/ecosystem-file', middleware.userMustBeAdmin, ecosystemFile.doGetEcosystemFile);

router.get('/login', middleware.userMustNotBeLogged, auth.doGetLogin);
router.post('/login', middleware.userMustNotBeLogged, auth.doPostLogin);
router.get('/logout', auth.doGetLogout);

router.get('/manage-accounts', middleware.userMustBeAdmin, manageAccounts.doGetAccounts);
router.get('/add-account', middleware.userMustBeAdmin, manageAccounts.doGetAddAccount);
router.post('/add-account', middleware.userMustBeAdmin, manageAccounts.doPostAddAccount);
router.get('/edit-account/:accountId', middleware.userMustBeAdmin, manageAccounts.doGetEditAccount);
router.post('/edit-account/:accountId', middleware.userMustBeAdmin, manageAccounts.doPostEditAccount);
router.get('/delete-account/:accountId', middleware.userMustBeAdmin, manageAccounts.doGetDeleteAccount);
router.get('/delete-orphans', middleware.userMustBeAdmin, manageAccounts.doGetDeleteOrphans);

module.exports = router;
