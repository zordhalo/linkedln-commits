/**
 * User Schema Definition
 * Stores LinkedIn user information and authentication data
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  linkedin_url: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid LinkedIn URL!`
    }
  },
  access_token: {
    type: String,
    required: true,
    select: false // Don't include in queries by default for security
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  last_sync: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for faster lookups by LinkedIn URL
userSchema.index({ linkedin_url: 1 });

// Update the updated_at timestamp before saving
userSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
