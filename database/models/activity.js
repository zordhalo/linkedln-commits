/**
 * Activity Schema Definition
 * Stores daily LinkedIn activity metrics for users
 */

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  posts: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: {
    type: Number,
    default: 0,
    min: 0
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

// Compound index for efficient date range queries per user
activitySchema.index({ user_id: 1, date: -1 });

// Index for date-based queries across all users
activitySchema.index({ date: -1 });

// Unique constraint to prevent duplicate entries for same user and date
activitySchema.index({ user_id: 1, date: 1 }, { unique: true });

// Virtual property to calculate total activity
activitySchema.virtual('total_activity').get(function() {
  return this.posts + this.likes + this.comments;
});

// Ensure virtuals are included in JSON output
activitySchema.set('toJSON', { virtuals: true });
activitySchema.set('toObject', { virtuals: true });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
