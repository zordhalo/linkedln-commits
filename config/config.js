/**
 * Configuration module for loading environment variables
 * 
 * This module loads environment variables from .env file (if present)
 * and exports them for use throughout the application.
 */

// Load environment variables from .env file
// In production, you can use dotenv package: require('dotenv').config();

const config = {
  // LinkedIn API Configuration
  linkedinApiKey: process.env.LINKEDIN_API_KEY || '',
  
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
