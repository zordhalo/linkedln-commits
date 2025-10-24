/**
 * Authentication Middleware
 * Middleware to protect routes that require authentication
 */

const OAuthService = require('./oauthService');
const { User } = require('../../database/models');

/**
 * Middleware to ensure user is authenticated
 * Checks for valid OAuth token
 */
async function requireAuth(req, res, next) {
  try {
    // Get user ID from session or request
    const userId = req.session?.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required. Please log in.'
      });
    }

    // Check if user has valid token
    const hasValidToken = await OAuthService.hasValidToken(userId);

    if (!hasValidToken) {
      return res.status(401).json({
        error: 'token_expired',
        message: 'Authentication token expired. Please log in again.'
      });
    }

    // Attach user to request
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        error: 'user_not_found',
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'auth_check_failed',
      message: 'Failed to verify authentication',
      details: error.message
    });
  }
}

/**
 * Middleware to get valid access token for API calls
 * Automatically refreshes token if needed
 */
async function withAccessToken(req, res, next) {
  try {
    const userId = req.user?._id || req.session?.userId || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'User not authenticated'
      });
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await OAuthService.getValidAccessToken(userId);
    
    // Attach access token to request
    req.accessToken = accessToken;
    next();
  } catch (error) {
    console.error('Access token middleware error:', error);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({
        error: 'token_expired',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'token_retrieval_failed',
      message: 'Failed to get access token',
      details: error.message
    });
  }
}

/**
 * Optional authentication - doesn't fail if not authenticated
 * Just attaches user if available
 */
async function optionalAuth(req, res, next) {
  try {
    const userId = req.session?.userId || req.headers['x-user-id'];

    if (userId) {
      const hasValidToken = await OAuthService.hasValidToken(userId);
      
      if (hasValidToken) {
        const user = await User.findById(userId);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail the request, just log the error
    console.error('Optional auth error:', error);
    next();
  }
}

module.exports = {
  requireAuth,
  withAccessToken,
  optionalAuth
};
