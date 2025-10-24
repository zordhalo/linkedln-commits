/**
 * OAuth Controller
 * Handles HTTP endpoints for OAuth 2.0 authentication flow
 */

const OAuthService = require('./oauthService');
const { User } = require('../../database/models');

class OAuthController {
  /**
   * Initiate OAuth authorization flow
   * Route: GET /auth/linkedin
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async authorize(req, res) {
    try {
      // Generate CSRF state token
      const state = OAuthService.generateState();
      
      // Store state in session for verification in callback
      // In production, use a proper session store (Redis, database, etc.)
      if (req.session) {
        req.session.oauthState = state;
      }

      // Build authorization URL
      const authUrl = OAuthService.getAuthorizationUrl(state);

      // Redirect user to LinkedIn authorization page
      res.redirect(authUrl);
    } catch (error) {
      console.error('OAuth authorization error:', error);
      res.status(500).json({
        error: 'authorization_failed',
        message: 'Failed to initiate OAuth authorization',
        details: error.message
      });
    }
  }

  /**
   * Handle OAuth callback from LinkedIn
   * Route: GET /auth/linkedin/callback
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async callback(req, res) {
    try {
      const { code, state, error, error_description } = req.query;

      // Handle user denial or other OAuth errors
      if (error) {
        return res.status(400).json({
          error: error,
          message: error_description || 'OAuth authorization failed',
          userCancelled: error === 'user_cancelled_authorize'
        });
      }

      // Verify required parameters
      if (!code) {
        return res.status(400).json({
          error: 'missing_code',
          message: 'Authorization code not provided'
        });
      }

      if (!state) {
        return res.status(400).json({
          error: 'missing_state',
          message: 'State parameter not provided'
        });
      }

      // Verify state parameter (CSRF protection)
      if (req.session && req.session.oauthState) {
        if (state !== req.session.oauthState) {
          return res.status(400).json({
            error: 'invalid_state',
            message: 'State parameter mismatch - potential CSRF attack'
          });
        }
        // Clear the state from session
        delete req.session.oauthState;
      }

      // Exchange authorization code for access token
      const tokenData = await OAuthService.exchangeCodeForToken(code);

      // Get user info from LinkedIn
      const linkedInUserInfo = await OAuthService.getUserInfo(tokenData.access_token);

      // Find or create user in database
      let user = await User.findOne({ 
        linkedin_url: linkedInUserInfo.sub || linkedInUserInfo.id 
      });

      if (!user) {
        // Create new user
        user = await User.create({
          name: linkedInUserInfo.name || 'LinkedIn User',
          linkedin_url: linkedInUserInfo.sub || linkedInUserInfo.id,
          access_token: 'managed_by_oauth_token' // Placeholder, actual token in OAuthToken
        });
      }

      // Store OAuth tokens
      await OAuthService.storeTokens(user._id, tokenData);

      // In production, create session or JWT token here
      if (req.session) {
        req.session.userId = user._id.toString();
      }

      // Return success response
      res.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user._id,
          name: user.name,
          linkedin_url: user.linkedin_url
        }
      });
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({
        error: 'callback_failed',
        message: 'Failed to complete OAuth callback',
        details: error.message
      });
    }
  }

  /**
   * Logout user by revoking OAuth tokens
   * Route: POST /auth/logout
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async logout(req, res) {
    try {
      const userId = req.session?.userId || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          error: 'missing_user_id',
          message: 'User ID not provided'
        });
      }

      // Revoke OAuth tokens
      await OAuthService.revokeTokens(userId);

      // Clear session
      if (req.session) {
        req.session.destroy();
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'logout_failed',
        message: 'Failed to logout',
        details: error.message
      });
    }
  }

  /**
   * Get current authentication status
   * Route: GET /auth/status
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async status(req, res) {
    try {
      const userId = req.session?.userId || req.query.userId;

      if (!userId) {
        return res.json({
          authenticated: false,
          message: 'Not authenticated'
        });
      }

      const hasValidToken = await OAuthService.hasValidToken(userId);

      if (!hasValidToken) {
        return res.json({
          authenticated: false,
          message: 'Token expired or invalid'
        });
      }

      const user = await User.findById(userId);

      res.json({
        authenticated: true,
        user: {
          id: user._id,
          name: user.name,
          linkedin_url: user.linkedin_url
        }
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        error: 'status_check_failed',
        message: 'Failed to check authentication status',
        details: error.message
      });
    }
  }

  /**
   * Manually refresh access token for a user
   * Route: POST /auth/refresh
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async refresh(req, res) {
    try {
      const userId = req.session?.userId || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          error: 'missing_user_id',
          message: 'User ID not provided'
        });
      }

      const accessToken = await OAuthService.getValidAccessToken(userId);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: accessToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'refresh_failed',
        message: 'Failed to refresh token',
        details: error.message
      });
    }
  }
}

module.exports = OAuthController;
