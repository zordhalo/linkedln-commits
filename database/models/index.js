/**
 * Database Models Index
 * Central export point for all database models
 */

const User = require('./user');
const Activity = require('./activity');
const OAuthToken = require('./oauthToken');

module.exports = {
  User,
  Activity,
  OAuthToken
};
