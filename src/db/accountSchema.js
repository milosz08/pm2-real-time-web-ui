'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const uniqueValidator = require('mongoose-unique-validator');
const config = require('../utils/config');

const accountSchema = mongoose.Schema({
  login: {
    type: String,
    trim: true,
    required: [ true, 'Login is required.' ],
    unique: true,
    maxlength: [ 30, 'Login must have less or equals 30 characters.' ],
    validate: [
      login => /^[a-zA-Z\d]{3,30}$/.test(login),
      'Login must contains only letters and numbers.',
    ],
  },
  password: {
    type: String,
    required: [ true, 'Password is required.' ],
    minlength: [ 8, 'Password must have at least 8 characters.' ],
  },
  role: {
    type: String,
    required: true,
    default: config.userRole,
    validate: {
      validator: roleName => [config.adminRole, config.userRole].includes(roleName),
      msg: 'Role name must be user or admin.',
    },
  },
  description: {
    type: String,
    maxlength: [ 1000, 'Description must not exceed 1000 characters.' ],
    default: '',
  },
  permissions: [
    {
      instancePm2Id: {
        type: Number,
        required: true,
      },
      availableActions: {
        type: [String],
        required: true,
        default: [],
        validate: [
          {
            validator: actions => {
              return actions.every(action => config.validActions.includes(action));
            },
            msg: props => `${props.value} is invalid action.`,
          },
          {
            validator: actions => new Set(actions).size === actions.length,
            msg: 'Actions must be unique!',
          },
        ],
      },
    },
  ],
});

accountSchema.plugin(uniqueValidator, {
  type: 'mongoose-unique-validator',
  message: 'Followed {PATH} already exist.',
});

accountSchema.pre('save', async function (next) {
  const account = this;
  if (!account.isModified('password')) {
    next();
    return;
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(account.password)) {
    account.invalidate(
      'password',
    'Password must have at least 8 characters and contains big letter, small, digit and special character.',
    );
    next();
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(account.password, salt);
  account.password = hash;
  next();
});

accountSchema.methods = {
  async compareHash(plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
  },
  getApps(action) {
    return this.permissions
      .filter(({ availableActions }) => !action || availableActions.includes(action))
      .map(({ instancePm2Id }) => instancePm2Id);
  },
  checkAppPermission(apps, appId) {
    return this.role === config.adminRole || apps.includes(appId)
  },
  getActionsForApp(pmId) {
    let actionsList = [];
    if (this.role === config.adminRole) {
      actionsList =  config.validActions.filter(action => action !== 'view');
    }
    const permissions = this.permissions.find(({ instancePm2Id }) => pmId === instancePm2Id);
    if (permissions) {
      actionsList = permissions.availableActions;
    }
    return config.validActions.reduce((acc, action) => {
      acc[action] = actionsList.includes(action);
      return acc;
    }, {});
  },
};

module.exports = mongoose.model('account', accountSchema);
