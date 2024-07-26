'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const uniqueValidator = require('mongoose-unique-validator');

const accountSchema = mongoose.Schema({
  login: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    maxlength: [ 30, 'Login must have less or equals 30 characters.' ],
    validate: [
      login => /^[a-zA-Z\d]{3,30}$/.test(login),
      'Login must contains only letters and numbers.',
    ],
  },
  password: {
    type: String,
    required: [ true, "Password is required." ],
    minlength: [ 8, "Password must have at least 8 characters." ],
    validate: [
      password => !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(password),
      'Password must have at least 8 characters and contains big letter, small, digit and special character.',
    ],
  },
  role: {
    type: String,
    required: true,
    default: 'user',
    validate: {
      validator: roleName => /^(user|admin)$/.test(roleName),
      msg: 'Role name must be user or admin.',
    },
  },
  description: {
    type: String,
    maxlength: [ 1000, "Description must not exceed 1000 characters." ],
    default: '',
  },
  permissions: [
    {
      instancePm2Id: {
        type: Number,
        required: [ true, "PM2 instance ID field is required." ],
      },
      availableActions: {
        type: [String],
        required: true,
        default: [],
        validate: [
          {
            validator: actions => {
              const validActions = ['start', 'reload', 'restart', 'stop'];
              return actions.every(action => validActions.includes(action));
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

accountSchema.path("password").set(rawPassword => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(rawPassword, salt);
});

accountSchema.methods = {
  async compareHash(plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
  },
};

module.exports = mongoose.model('account', accountSchema);
