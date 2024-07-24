'use strict';

const { Router } = require('express');
const apps = require('../controller/apps');
const auth = require('../controller/auth');
const middleware= require('../middleware/auth');

const router = Router();

router.get('/', middleware.userMustBeLogged, apps.doGetApps);
router.get('/app/:pmId', middleware.userMustBeLogged, apps.doGetAppDetails);
router.get('/login', middleware.userMustNotBeLogged, auth.doGetLogin);
router.post('/login', middleware.userMustNotBeLogged, auth.doPostLogin);
router.get('/logout', middleware.userMustBeLogged, auth.doGetLogout);
router.get('*', middleware.userMustBeLogged, apps.doGetApps);

module.exports = router;
