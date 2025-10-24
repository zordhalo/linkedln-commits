#!/usr/bin/env node

/**
 * Example Usage Script
 * Demonstrates how to use the database models in your application
 */

const { connectDB, disconnectDB } = require('./config');
const { User, Activity } = require('./models');

/**
 * Example 1: Create a new user
 */
async function createUser() {
  console.log('\n📝 Example 1: Creating a new user...');
  
  try {
    const user = await User.create({
      name: 'Alice Johnson',
      linkedin_url: 'https://www.linkedin.com/in/alicejohnson/',
      access_token: 'demo_token_abc123xyz'
    });
    
    console.log('✓ User created successfully:');
    console.log(`  ID: ${user._id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  LinkedIn: ${user.linkedin_url}`);
    
    return user;
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠ User already exists, fetching existing user...');
      return await User.findOne({ linkedin_url: 'https://www.linkedin.com/in/alicejohnson/' });
    }
    throw error;
  }
}

/**
 * Example 2: Record daily activity
 */
async function recordActivity(userId) {
  console.log('\n📊 Example 2: Recording daily activity...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const activity = await Activity.findOneAndUpdate(
    {
      user_id: userId,
      date: today
    },
    {
      $set: {
        posts: 3,
        likes: 25,
        comments: 12
      }
    },
    {
      upsert: true,
      new: true
    }
  );
  
  console.log('✓ Activity recorded for today:');
  console.log(`  Posts: ${activity.posts}`);
  console.log(`  Likes: ${activity.likes}`);
  console.log(`  Comments: ${activity.comments}`);
  console.log(`  Total Activity: ${activity.total_activity}`);
  
  return activity;
}

/**
 * Example 3: Get user's activity history
 */
async function getActivityHistory(userId, days = 7) {
  console.log(`\n📈 Example 3: Getting last ${days} days of activity...`);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const activities = await Activity.find({
    user_id: userId,
    date: { $gte: startDate }
  })
  .sort({ date: -1 })
  .limit(days);
  
  console.log(`✓ Found ${activities.length} days of activity:`);
  activities.forEach((activity, index) => {
    const dateStr = activity.date.toISOString().split('T')[0];
    console.log(`  ${index + 1}. ${dateStr}: ${activity.posts} posts, ${activity.likes} likes, ${activity.comments} comments (Total: ${activity.total_activity})`);
  });
  
  return activities;
}

/**
 * Example 4: Calculate activity statistics
 */
async function calculateStatistics(userId) {
  console.log('\n📊 Example 4: Calculating activity statistics...');
  
  const stats = await Activity.aggregate([
    {
      $match: { user_id: userId }
    },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: '$posts' },
        totalLikes: { $sum: '$likes' },
        totalComments: { $sum: '$comments' },
        avgPosts: { $avg: '$posts' },
        avgLikes: { $avg: '$likes' },
        avgComments: { $avg: '$comments' },
        daysTracked: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const stat = stats[0];
    console.log('✓ Activity Statistics:');
    console.log(`  Days Tracked: ${stat.daysTracked}`);
    console.log(`  Total Posts: ${stat.totalPosts}`);
    console.log(`  Total Likes: ${stat.totalLikes}`);
    console.log(`  Total Comments: ${stat.totalComments}`);
    console.log(`  Avg Posts/Day: ${stat.avgPosts.toFixed(2)}`);
    console.log(`  Avg Likes/Day: ${stat.avgLikes.toFixed(2)}`);
    console.log(`  Avg Comments/Day: ${stat.avgComments.toFixed(2)}`);
  } else {
    console.log('⚠ No activity data found');
  }
  
  return stats;
}

/**
 * Example 5: Find most active days
 */
async function findMostActiveDays(userId, limit = 5) {
  console.log(`\n🔥 Example 5: Finding top ${limit} most active days...`);
  
  const activities = await Activity.find({ user_id: userId })
    .sort({ posts: -1, likes: -1, comments: -1 })
    .limit(limit);
  
  console.log(`✓ Top ${limit} most active days:`);
  activities.forEach((activity, index) => {
    const dateStr = activity.date.toISOString().split('T')[0];
    const total = activity.total_activity;
    console.log(`  ${index + 1}. ${dateStr}: ${total} total activities`);
  });
  
  return activities;
}

/**
 * Example 6: Get all users with activity counts
 */
async function getUsersWithActivityCounts() {
  console.log('\n👥 Example 6: Getting all users with activity counts...');
  
  const usersWithCounts = await User.aggregate([
    {
      $lookup: {
        from: 'activities',
        localField: '_id',
        foreignField: 'user_id',
        as: 'activities'
      }
    },
    {
      $project: {
        name: 1,
        linkedin_url: 1,
        activityCount: { $size: '$activities' },
        totalPosts: { $sum: '$activities.posts' },
        totalLikes: { $sum: '$activities.likes' },
        totalComments: { $sum: '$activities.comments' }
      }
    },
    {
      $sort: { totalPosts: -1 }
    }
  ]);
  
  console.log(`✓ Found ${usersWithCounts.length} users:`);
  usersWithCounts.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.name}:`);
    console.log(`     Days Tracked: ${user.activityCount}`);
    console.log(`     Posts: ${user.totalPosts}, Likes: ${user.totalLikes}, Comments: ${user.totalComments}`);
  });
  
  return usersWithCounts;
}

/**
 * Example 7: Update user information
 */
async function updateUser(userId) {
  console.log('\n✏️  Example 7: Updating user information...');
  
  const user = await User.findByIdAndUpdate(
    userId,
    {
      last_sync: new Date()
    },
    { new: true }
  );
  
  console.log('✓ User updated:');
  console.log(`  Last Sync: ${user.last_sync}`);
  
  return user;
}

/**
 * Example 8: Delete old activities (cleanup)
 */
async function cleanupOldActivities(daysToKeep = 90) {
  console.log(`\n🗑️  Example 8: Cleaning up activities older than ${daysToKeep} days...`);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await Activity.deleteMany({
    date: { $lt: cutoffDate }
  });
  
  console.log(`✓ Deleted ${result.deletedCount} old activity records`);
  
  return result;
}

/**
 * Main function to run all examples
 */
async function runExamples() {
  try {
    console.log('🚀 LinkedIn Activity Tracker - Database Usage Examples');
    console.log('=' .repeat(60));
    
    // Connect to database
    await connectDB();
    
    // Run examples
    const user = await createUser();
    await recordActivity(user._id);
    await getActivityHistory(user._id, 7);
    await calculateStatistics(user._id);
    await findMostActiveDays(user._id, 3);
    await getUsersWithActivityCounts();
    await updateUser(user._id);
    // Note: Uncomment to test cleanup (will delete old data)
    // await cleanupOldActivities(90);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All examples completed successfully!');
    console.log('\nThese examples demonstrate common database operations.');
    console.log('Modify them to fit your application\'s needs.');
    
  } catch (error) {
    console.error('\n❌ Error running examples:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

module.exports = {
  createUser,
  recordActivity,
  getActivityHistory,
  calculateStatistics,
  findMostActiveDays,
  getUsersWithActivityCounts,
  updateUser,
  cleanupOldActivities
};
