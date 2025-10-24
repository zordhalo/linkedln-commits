/**
 * Example Usage Script
 * Demonstrates how to use the OAuth implementation programmatically
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../../database/config');
const OAuthService = require('../api/oauthService');
const { User, OAuthToken } = require('../../database/models');

async function main() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await connectDB();
    console.log('✓ Connected to database\n');

    // Example 1: Generate Authorization URL
    console.log('=== Example 1: Generate Authorization URL ===');
    const state = OAuthService.generateState();
    const authUrl = OAuthService.getAuthorizationUrl(state);
    console.log('State:', state);
    console.log('Authorization URL:', authUrl);
    console.log('Note: In a real app, store the state in session for verification\n');

    // Example 2: Exchange Code for Token (simulated)
    console.log('=== Example 2: Token Exchange ===');
    console.log('After user authorizes, LinkedIn redirects to callback with code');
    console.log('Then call: OAuthService.exchangeCodeForToken(code)');
    console.log('This returns token data: { access_token, refresh_token, expires_in, ... }\n');

    // Example 3: Store Tokens
    console.log('=== Example 3: Store Tokens ===');
    console.log('Tokens are stored with encryption and expiration tracking\n');

    // Example 4: Check if User Has Valid Token
    console.log('=== Example 4: Check Token Validity ===');
    const users = await User.find().limit(1);
    if (users.length > 0) {
      const userId = users[0]._id;
      const hasValid = await OAuthService.hasValidToken(userId);
      console.log(`User ${userId} has valid token:`, hasValid);
    } else {
      console.log('No users found. Create a user first.');
    }
    console.log();

    // Example 5: Get Valid Access Token (with auto-refresh)
    console.log('=== Example 5: Get Valid Access Token ===');
    if (users.length > 0) {
      const userId = users[0]._id;
      try {
        const accessToken = await OAuthService.getValidAccessToken(userId);
        console.log('Access token retrieved (masked):', accessToken.substring(0, 20) + '...');
        console.log('Note: Token is automatically refreshed if expired');
      } catch (error) {
        console.log('Could not get token:', error.message);
        console.log('User needs to authenticate via OAuth flow');
      }
    }
    console.log();

    console.log('\n=== Complete OAuth Flow Example ===');
    console.log('See src/server.js for full implementation');

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
