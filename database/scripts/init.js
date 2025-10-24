#!/usr/bin/env node

/**
 * Database Initialization Script
 * Sets up MongoDB collections, indexes, and initial data
 */

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config');
const { User, Activity } = require('../models');

/**
 * Initialize database collections and indexes
 */
async function initializeDatabase() {
  try {
    console.log('Starting database initialization...\n');

    // Connect to MongoDB
    await connectDB();

    // Drop existing collections if they exist (for fresh setup)
    const dropCollections = process.argv.includes('--drop');
    if (dropCollections) {
      console.log('Dropping existing collections...');
      try {
        await User.collection.drop();
        console.log('✓ Dropped Users collection');
      } catch (err) {
        if (err.code !== 26) console.log('  Users collection does not exist');
      }
      
      try {
        await Activity.collection.drop();
        console.log('✓ Dropped Activities collection');
      } catch (err) {
        if (err.code !== 26) console.log('  Activities collection does not exist');
      }
      console.log();
    }

    // Create collections
    console.log('Creating collections...');
    await User.createCollection();
    console.log('✓ Created Users collection');
    
    await Activity.createCollection();
    console.log('✓ Created Activities collection');
    console.log();

    // Create indexes
    console.log('Creating indexes...');
    
    // User indexes
    await User.createIndexes();
    const userIndexes = await User.collection.indexes();
    console.log('✓ User indexes created:');
    userIndexes.forEach(idx => {
      console.log(`  - ${JSON.stringify(idx.key)}`);
    });
    
    // Activity indexes
    await Activity.createIndexes();
    const activityIndexes = await Activity.collection.indexes();
    console.log('✓ Activity indexes created:');
    activityIndexes.forEach(idx => {
      console.log(`  - ${JSON.stringify(idx.key)}`);
    });
    console.log();

    // Verify collections
    console.log('Verifying collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✓ Collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    console.log();

    console.log('✅ Database initialization completed successfully!');
    console.log('\nDatabase is ready to use.');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
