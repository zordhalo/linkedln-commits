#!/usr/bin/env node

/**
 * Database Seed Script
 * Populates database with sample data for testing
 */

const { connectDB, disconnectDB } = require('../config');
const { User, Activity } = require('../models');

/**
 * Sample users data
 */
const sampleUsers = [
  {
    name: 'John Doe',
    linkedin_url: 'https://www.linkedin.com/in/johndoe/',
    access_token: 'sample_token_1234567890abcdef'
  },
  {
    name: 'Jane Smith',
    linkedin_url: 'https://www.linkedin.com/in/janesmith/',
    access_token: 'sample_token_0987654321fedcba'
  }
];

/**
 * Generate sample activities for a user
 */
function generateSampleActivities(userId, days = 30) {
  const activities = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0); // Normalize to start of day
    
    activities.push({
      user_id: userId,
      date: date,
      posts: Math.floor(Math.random() * 3), // 0-2 posts per day
      likes: Math.floor(Math.random() * 20), // 0-19 likes per day
      comments: Math.floor(Math.random() * 10) // 0-9 comments per day
    });
  }
  
  return activities;
}

/**
 * Seed the database with sample data
 */
async function seedDatabase() {
  try {
    console.log('Starting database seeding...\n');

    // Connect to MongoDB
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await Activity.deleteMany({});
    console.log('✓ Cleared activities');
    await User.deleteMany({});
    console.log('✓ Cleared users');
    console.log();

    // Insert sample users
    console.log('Inserting sample users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`✓ Inserted ${users.length} users`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user._id})`);
    });
    console.log();

    // Generate and insert activities for each user
    console.log('Generating sample activities...');
    for (const user of users) {
      const activities = generateSampleActivities(user._id, 30);
      await Activity.insertMany(activities);
      console.log(`✓ Generated 30 days of activities for ${user.name}`);
    }
    console.log();

    // Display statistics
    console.log('Database Statistics:');
    const userCount = await User.countDocuments();
    const activityCount = await Activity.countDocuments();
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Activities: ${activityCount}`);
    console.log();

    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
