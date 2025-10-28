/**
 * Configuration module for loading environment variables
 * 
 * This module loads environment variables from .env file (if present)
 * and exports them for use throughout the application.
 */

// Load environment variables from .env file
require('dotenv').config();

const config = {
  // LinkedIn OAuth 2.0 Configuration
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/auth/linkedin/callback',
    scope: 'profile email w_member_social', // Default scopes
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    apiVersion: '202410' // LinkedIn API version header
  },
  
  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
  },
  
  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Server Configuration
  port: process.env.PORT || 3000,
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Helper methods
  isDevelopment: function() {
    return this.nodeEnv === 'development';
  },
  
  isProduction: function() {
    return this.nodeEnv === 'production';
  },
  
  isTest: function() {
    return this.nodeEnv === 'test';
  }
};

module.exports = config;
