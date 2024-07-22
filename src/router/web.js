'use strict';

const { Router } = require('express');
const apps = require('../controller/apps');
const appDetails = require('../controller/appDetails');
const login = require('../controller/login');
const logout = require('../controller/logout');
const { userMustBeLogged, userMustNotBeLogged } = require('../middleware/auth');

const router = Router();

router.get('/', userMustBeLogged, apps.doGet);
router.get('/app/:appName', userMustBeLogged, appDetails.doGet);
router.get('/login', userMustNotBeLogged, login.doGet);
router.get('/logout', userMustBeLogged, logout.doGet);

module.exports = router;
