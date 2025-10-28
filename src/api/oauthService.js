/**
 * OAuth Service
 * Handles OAuth 2.0 authentication flow for LinkedIn
 */

const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config/config');
const { OAuthToken } = require('../../database/models');

class OAuthService {
  /**
   * Generate a random state parameter for CSRF protection
   * @returns {string} Random state string
   */
  static generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Build the LinkedIn authorization URL
   * @param {string} state - CSRF protection token
   * @returns {string} Authorization URL
   */
  static getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.linkedin.clientId,
      redirect_uri: config.linkedin.redirectUri,
      state: state,
      scope: config.linkedin.scope
    });

    return `${config.linkedin.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @returns {Promise<Object>} Token response
   */
  static async exchangeCodeForToken(code) {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.linkedin.redirectUri,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret
      });

      const response = await axios.post(
        config.linkedin.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Token exchange failed: ${error.response.data.error_description || error.response.data.error}`);
      }
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh an expired access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token response
   */
  static async refreshAccessToken(refreshToken) {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret
      });

      const response = await axios.post(
        config.linkedin.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Token refresh failed: ${error.response.data.error_description || error.response.data.error}`);
      }
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get LinkedIn user info using access token
   * @param {string} accessToken - Valid access token
   * @returns {Promise<Object>} User info from LinkedIn
   */
  static async getUserInfo(accessToken) {
    try {
      const response = await axios.get(config.linkedin.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'LinkedIn-Version': config.linkedin.apiVersion
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Get user info failed: ${error.response.data.message || error.response.statusText}`);
      }
      throw new Error(`Get user info failed: ${error.message}`);
    }
  }

  /**
   * Store OAuth tokens in database
   * @param {string} userId - User ID
   * @param {Object} tokenData - Token data from LinkedIn
   * @returns {Promise<Object>} Saved token document
   */
  static async storeTokens(userId, tokenData) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    let refreshExpiresAt = null;
    if (tokenData.refresh_token_expires_in) {
      refreshExpiresAt = new Date();
      refreshExpiresAt.setSeconds(refreshExpiresAt.getSeconds() + tokenData.refresh_token_expires_in);
    }

    const tokenDoc = await OAuthToken.findOneAndUpdate(
      { user_id: userId, provider: 'linkedin' },
      {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: expiresAt,
        refresh_expires_at: refreshExpiresAt,
        scope: tokenData.scope
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return tokenDoc;
  }

  /**
   * Get valid access token for user (refresh if needed)
   * @param {string} userId - User ID
   * @returns {Promise<string>} Valid access token
   */
  static async getValidAccessToken(userId) {
    const tokenDoc = await OAuthToken.findOne({ 
      user_id: userId, 
      provider: 'linkedin' 
    }).select('+access_token +refresh_token');

    if (!tokenDoc) {
      throw new Error('No OAuth token found for user');
    }

    // If token is not expired, return it
    if (!tokenDoc.isAccessTokenExpired()) {
      return tokenDoc.access_token;
    }

    // Token is expired, try to refresh
    if (!tokenDoc.refresh_token) {
      throw new Error('Access token expired and no refresh token available');
    }

    if (tokenDoc.isRefreshTokenExpired()) {
      throw new Error('Both access and refresh tokens are expired. Re-authentication required.');
    }

    // Refresh the token
    const newTokenData = await this.refreshAccessToken(tokenDoc.refresh_token);
    await this.storeTokens(userId, newTokenData);

    return newTokenData.access_token;
  }

  /**
   * Revoke user's OAuth tokens (logout)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async revokeTokens(userId) {
    await OAuthToken.deleteOne({ 
      user_id: userId, 
      provider: 'linkedin' 
    });
  }

  /**
   * Check if user has valid OAuth token
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if user has valid token
   */
  static async hasValidToken(userId) {
    try {
      await this.getValidAccessToken(userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Refresh all tokens that are expiring soon
   * This should be called periodically (e.g., daily cron job)
   * @returns {Promise<Object>} Results of refresh operation
   */
  static async refreshExpiringTokens() {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      const tokensNeedingRefresh = await OAuthToken.findTokensNeedingRefresh();

      for (const tokenDoc of tokensNeedingRefresh) {
        try {
          // Skip if refresh token is expired
          if (tokenDoc.isRefreshTokenExpired()) {
            results.failed++;
            results.errors.push({
              userId: tokenDoc.user_id,
              error: 'Refresh token expired'
            });
            continue;
          }

          const newTokenData = await this.refreshAccessToken(tokenDoc.refresh_token);
          await this.storeTokens(tokenDoc.user_id, newTokenData);
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            userId: tokenDoc.user_id,
            error: err.message
          });
        }
      }
    } catch (error) {
      throw new Error(`Failed to refresh expiring tokens: ${error.message}`);
    }

    return results;
  }
}

module.exports = OAuthService;
