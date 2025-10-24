/**
 * OAuth Token Schema Definition
 * Stores OAuth 2.0 access and refresh tokens for LinkedIn authentication
 */

const mongoose = require('mongoose');

const oauthTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: String,
    default: 'linkedin',
    enum: ['linkedin'],
    required: true
  },
  access_token: {
    type: String,
    required: true,
    select: false // Don't include in queries by default for security
  },
  refresh_token: {
    type: String,
    select: false // Don't include in queries by default for security
  },
  token_type: {
    type: String,
    default: 'Bearer'
  },
  expires_at: {
    type: Date,
    required: true,
    index: true // Index for efficient expiration queries
  },
  refresh_expires_at: {
    type: Date
  },
  scope: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index for user + provider lookups
oauthTokenSchema.index({ user_id: 1, provider: 1 }, { unique: true });

// Index for finding tokens that need refresh
oauthTokenSchema.index({ expires_at: 1 });

// Method to check if access token is expired
oauthTokenSchema.methods.isAccessTokenExpired = function() {
  return new Date() >= this.expires_at;
};

// Method to check if access token expires soon (within 1 day)
oauthTokenSchema.methods.needsRefresh = function() {
  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  return this.expires_at <= oneDayFromNow;
};

// Method to check if refresh token is expired
oauthTokenSchema.methods.isRefreshTokenExpired = function() {
  if (!this.refresh_expires_at) {
    return false; // If no expiration, assume it doesn't expire
  }
  return new Date() >= this.refresh_expires_at;
};

// Static method to find token for user that needs refresh
oauthTokenSchema.statics.findTokensNeedingRefresh = function() {
  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  
  return this.find({
    expires_at: { $lte: oneDayFromNow },
    refresh_token: { $exists: true, $ne: null }
  }).select('+access_token +refresh_token');
};

const OAuthToken = mongoose.model('OAuthToken', oauthTokenSchema);

module.exports = OAuthToken;
