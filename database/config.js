/**
 * Database Configuration
 * Handles MongoDB connection setup and configuration
 */

const mongoose = require('mongoose');

/**
 * MongoDB connection configuration
 */
const config = {
  // MongoDB URI - use environment variable or default to local
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_activity',
  
  // Connection options
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Automatically create indexes
    autoIndex: true,
    // Connection pool size
    maxPoolSize: 10,
    minPoolSize: 2,
    // Socket timeout
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};

/**
 * Connect to MongoDB
 * @returns {Promise} Connection promise
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoURI, config.options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise} Disconnection promise
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
};

/**
 * Get connection status
 * @returns {string} Connection state
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  config
};
