'use strict';

const { Router } = require('express');
const apps = require('../controller/apps');
const auth = require('../controller/auth');
const manageUsers = require('../controller/manageUsers');
const middleware= require('../middleware/auth');

const router = Router();

router.get('/', middleware.userMustBeLogged, apps.doGetApps);
router.get('/app/:pmId', middleware.userMustBeLogged, apps.doGetAppDetails);

router.get('/login', middleware.userMustNotBeLogged, auth.doGetLogin);
router.post('/login', middleware.userMustNotBeLogged, auth.doPostLogin);
router.get('/logout', middleware.userMustBeLogged, auth.doGetLogout);

router.get('/manage-users', middleware.userMustBeAdmin, manageUsers.doGetUsers);
router.get('/add-user', middleware.userMustBeAdmin, manageUsers.doGetAddUser);
router.post('/add-user', middleware.userMustBeAdmin, manageUsers.doPostAddUser);
router.get('/edit-user/:userId', middleware.userMustBeAdmin, manageUsers.doGetEditUser);
router.post('/edit-user/:userId', middleware.userMustBeAdmin, manageUsers.doPostEditUser);
router.get('/delete-user/:userId', middleware.userMustBeAdmin, manageUsers.doGetDeleteUser);

router.get('*', middleware.userMustBeLogged, (_, res) => res.redirect('/'));

module.exports = router;
