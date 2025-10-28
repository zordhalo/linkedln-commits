/**
 * LinkedIn Extractor Usage Example
 * Demonstrates how to use the LinkedIn data extractor
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../../database/config');
const LinkedInExtractor = require('../extractor/LinkedInExtractor');
const { User } = require('../../database/models');

async function main() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await connectDB();
    console.log('✓ Connected to database\n');

    // Get a test user
    const users = await User.find().limit(1);
    if (users.length === 0) {
      console.log('No users found in database.');
      console.log('Run the OAuth flow (npm start) to create a user first.\n');
      return;
    }

    const user = users[0];
    console.log(`Using user: ${user.name} (${user._id})\n`);

    // Create extractor instance
    console.log('=== Example 1: Create LinkedIn Extractor ===');
    const extractor = new LinkedInExtractor(user._id, {
      maxRequests: 100,
      windowMs: 60000,
      retryOptions: {
        maxRetries: 3,
        retryDelay: 1000
      }
    });
    console.log('✓ Extractor created with rate limiting and retry logic\n');

    // Validate extractor configuration
    console.log('=== Example 2: Validate Extractor ===');
    const validation = await extractor.validate();
    console.log('Validation result:', JSON.stringify(validation, null, 2));
    console.log();

    if (!validation.valid) {
      console.log('❌ Extractor validation failed');
      console.log('Make sure the user has a valid OAuth token');
      console.log('Run the OAuth flow (npm start) to authenticate\n');
      return;
    }

    // Fetch user profile (works with current permissions)
    console.log('=== Example 3: Fetch User Profile ===');
    try {
      const profile = await extractor.fetchUserProfile();
      console.log('Profile result:', JSON.stringify(profile, null, 2));
      console.log();
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      console.log();
    }

    // Try to fetch activity posts (shows limitation)
    console.log('=== Example 4: Fetch Activity Posts ===');
    const posts = await extractor.fetchActivityPosts({
      startDate: new Date('2024-01-01'),
      endDate: new Date(),
      limit: 50
    });
    console.log('Posts result:', JSON.stringify(posts, null, 2));
    console.log();

    // Try to fetch interactions (shows limitation)
    console.log('=== Example 5: Fetch Interactions ===');
    const interactions = await extractor.fetchInteractions({
      startDate: new Date('2024-01-01'),
      endDate: new Date(),
      types: ['likes', 'comments'],
      limit: 100
    });
    console.log('Interactions result:', JSON.stringify(interactions, null, 2));
    console.log();

    // Extract all data at once
    console.log('=== Example 6: Extract All Data ===');
    const allData = await extractor.extractAllData({
      posts: {
        startDate: new Date('2024-01-01'),
        endDate: new Date(),
        limit: 50
      },
      interactions: {
        startDate: new Date('2024-01-01'),
        endDate: new Date(),
        types: ['likes', 'comments'],
        limit: 100
      }
    });
    console.log('Combined result:');
    console.log('  Success:', allData.success);
    console.log('  Data keys:', Object.keys(allData.data));
    console.log('  Errors:', allData.errors.length);
    if (allData.errors.length > 0) {
      console.log('\n  Error details:');
      allData.errors.forEach(err => {
        console.log(`    - ${err.method}: ${err.error.message}`);
      });
    }
    console.log();

    console.log('\n=== Summary ===');
    console.log('✓ Profile fetching works with current OAuth permissions');
    console.log('⚠️  Activity posts and interactions require Partner Program access');
    console.log('\nNext Steps:');
    console.log('1. Apply for LinkedIn Partner Program for full API access');
    console.log('2. OR implement manual data upload feature');
    console.log('3. OR focus on GitHub-only activity tracking for MVP');
    console.log('\nSee issue #4 for detailed API research and recommendations');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await disconnectDB();
    console.log('\n✓ Disconnected from database');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
