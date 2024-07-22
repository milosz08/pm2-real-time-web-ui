'use strict';

const { Router } = require('express');
const { doGetApps, doGetAppDetails } = require('../controller/apps');
const { doGetLogin, doPostLogin, doGetLogout } = require('../controller/auth');
const {
  doGetUsers,
  doGetAddUser,
  doPostAddUser,
  doGetEditUser,
  doPostEditUser,
  doGetDeleteUser,
} = require('../controller/manageUsers');
const {
  userMustBeLogged,
  userMustNotBeLogged,
  userMustBeAdmin,
} = require('../middleware/auth');

const router = Router();

router.get('/', userMustBeLogged, doGetApps);
router.get('/app/:appName', userMustBeLogged, doGetAppDetails);

router.get('/login', userMustNotBeLogged, doGetLogin);
router.post('/login', userMustNotBeLogged, doPostLogin);
router.get('/logout', userMustBeLogged, doGetLogout);

router.get('/manage-users', userMustBeAdmin, doGetUsers);
router.get('/add-user', userMustBeAdmin, doGetAddUser);
router.post('/add-user', userMustBeAdmin, doPostAddUser);
router.get('/edit-user/:userId', userMustBeAdmin, doGetEditUser);
router.post('/edit-user/:userId', userMustBeAdmin, doPostEditUser);
router.get('/delete-user/:userId', userMustBeAdmin, doGetDeleteUser);

router.get('*', userMustBeLogged, doGetApps);

module.exports = router;
