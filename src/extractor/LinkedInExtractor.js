/**
 * LinkedIn Data Extractor
 * 
 * Extracts LinkedIn profile activity data using LinkedIn's API.
 * 
 * IMPORTANT LIMITATIONS:
 * Based on research in issue #4, LinkedIn heavily restricts activity data access.
 * - Open permissions (profile, email, w_member_social) do NOT include activity feed/history
 * - Activity data APIs require LinkedIn Partner Program approval
 * - Most methods are stubs/placeholders pending Partner Program access or alternative approach
 * 
 * Current Implementation Status:
 * - ✅ fetchUserProfile() - Works with OAuth (uses userinfo endpoint)
 * - ⚠️  fetchActivityPosts() - Placeholder (requires Partner API or manual upload)
 * - ⚠️  fetchInteractions() - Placeholder (requires Partner API or manual upload)
 * 
 * Alternative Approaches for MVP:
 * 1. Manual data upload feature
 * 2. GitHub-only activity tracking
 * 3. Browser extension for user-authorized data extraction
 */

const axios = require('axios');
const OAuthService = require('../api/oauthService');
const config = require('../../config/config');

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if request can proceed or needs to wait
   * @returns {Promise<void>}
   */
  async checkLimit() {
    const now = Date.now();
    // Remove requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.checkLimit(); // Recheck after waiting
      }
    }

    this.requests.push(now);
  }
}

/**
 * Retry logic for API calls
 */
class RetryHandler {
  /**
   * Execute function with retry logic
   * @param {Function} fn - Async function to execute
   * @param {Object} options - Retry options
   * @returns {Promise<any>} Result of function
   */
  static async execute(fn, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      backoffMultiplier = 2,
      retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
    } = options;

    let lastError;
    let delay = retryDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable
        // Network errors (ECONNRESET, ETIMEDOUT, etc.) or HTTP 5xx errors
        const isNetworkError = retryableErrors.some(code => 
          error.code === code || error.message.includes(code)
        );
        const isServerError = error.response && error.response.status >= 500;
        const isRetryable = isNetworkError || isServerError;

        if (!isRetryable) {
          throw error; // Don't retry non-retryable errors
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffMultiplier;
      }
    }

    throw lastError;
  }
}

/**
 * LinkedIn Data Extractor Class
 */
class LinkedInExtractor {
  constructor(userId, options = {}) {
    this.userId = userId;
    this.rateLimiter = new RateLimiter(
      options.maxRequests || 100,
      options.windowMs || 60000
    );
    this.retryOptions = options.retryOptions || {};
  }

  /**
   * Get valid access token for API calls
   * @returns {Promise<string>} Access token
   * @private
   */
  async _getAccessToken() {
    try {
      return await OAuthService.getValidAccessToken(this.userId);
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Make API request with rate limiting and retry logic
   * @param {Function} requestFn - Function that makes the API request
   * @returns {Promise<any>} API response
   * @private
   */
  async _makeRequest(requestFn) {
    await this.rateLimiter.checkLimit();
    return RetryHandler.execute(requestFn, this.retryOptions);
  }

  /**
   * Fetch user profile data from LinkedIn
   * This uses the OAuth userinfo endpoint which is available with open permissions.
   * 
   * @returns {Promise<Object>} User profile data in consistent JSON format
   */
  async fetchUserProfile() {
    try {
      const accessToken = await this._getAccessToken();
      
      const userData = await this._makeRequest(async () => {
        const response = await axios.get(config.linkedin.userInfoUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'LinkedIn-Version': config.linkedin.apiVersion
          }
        });
        return response.data;
      });

      // Return in consistent JSON format
      return {
        success: true,
        data: {
          id: userData.sub,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
          locale: userData.locale,
          email_verified: userData.email_verified
        },
        timestamp: new Date().toISOString(),
        source: 'linkedin_oauth'
      };
    } catch (error) {
      return this._formatError('fetchUserProfile', error);
    }
  }

  /**
   * Fetch activity posts from LinkedIn
   * 
   * ⚠️ LIMITATION: LinkedIn's activity feed APIs require Partner Program approval.
   * Open permissions (profile, email, w_member_social) do not include activity history.
   * 
   * This is a placeholder implementation that returns a structured error response
   * indicating the limitation and suggesting alternative approaches.
   * 
   * @param {Object} options - Query options (startDate, endDate, limit)
   * @returns {Promise<Object>} Activity posts data or limitation notice
   */
  async fetchActivityPosts(options = {}) {
    const { startDate, endDate, limit = 50 } = options;

    return {
      success: false,
      error: {
        code: 'API_LIMITATION',
        message: 'LinkedIn activity feed access requires Partner Program approval',
        details: [
          'Open permissions (profile, email, w_member_social) do not include activity history',
          'Activity data APIs require LinkedIn Partner Program access',
          'See issue #4 for detailed research'
        ],
        alternatives: [
          'Manual data upload feature',
          'Browser extension for user-authorized extraction',
          'GitHub-only activity tracking',
          'Apply for LinkedIn Partner Program'
        ]
      },
      requestedParams: {
        startDate,
        endDate,
        limit
      },
      timestamp: new Date().toISOString(),
      source: 'linkedin_api_stub'
    };
  }

  /**
   * Fetch interactions (likes, comments) from LinkedIn
   * 
   * ⚠️ LIMITATION: LinkedIn's interaction data APIs require Partner Program approval.
   * Open permissions do not provide access to historical interaction data.
   * 
   * Note: w_member_social permission allows POSTING/COMMENTING on behalf of user,
   * but not READING historical interactions.
   * 
   * This is a placeholder implementation for future integration.
   * 
   * @param {Object} options - Query options (startDate, endDate, types, limit)
   * @returns {Promise<Object>} Interactions data or limitation notice
   */
  async fetchInteractions(options = {}) {
    const { startDate, endDate, types = ['likes', 'comments'], limit = 100 } = options;

    return {
      success: false,
      error: {
        code: 'API_LIMITATION',
        message: 'LinkedIn interaction history requires Partner Program approval',
        details: [
          'w_member_social allows posting/commenting, not reading history',
          'Historical interaction data requires Partner API access',
          'See issue #4 for detailed research'
        ],
        alternatives: [
          'Manual data upload feature',
          'Browser extension for user-authorized extraction',
          'Focus on new interactions only (limited to user\'s own actions)',
          'Apply for LinkedIn Partner Program'
        ]
      },
      requestedParams: {
        startDate,
        endDate,
        types,
        limit
      },
      timestamp: new Date().toISOString(),
      source: 'linkedin_api_stub'
    };
  }

  /**
   * Extract all available data for a user
   * Combines profile, posts, and interactions into a single response
   * 
   * @param {Object} options - Options for data extraction
   * @returns {Promise<Object>} Combined data response
   */
  async extractAllData(options = {}) {
    const results = {
      success: true,
      data: {},
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Fetch profile (this works with current permissions)
      const profileResult = await this.fetchUserProfile();
      if (profileResult.success) {
        results.data.profile = profileResult.data;
      } else {
        results.errors.push({ method: 'fetchUserProfile', error: profileResult.error });
      }

      // Fetch posts (currently limited)
      const postsResult = await this.fetchActivityPosts(options.posts);
      if (postsResult.success) {
        results.data.posts = postsResult.data;
      } else {
        results.errors.push({ method: 'fetchActivityPosts', error: postsResult.error });
      }

      // Fetch interactions (currently limited)
      const interactionsResult = await this.fetchInteractions(options.interactions);
      if (interactionsResult.success) {
        results.data.interactions = interactionsResult.data;
      } else {
        results.errors.push({ method: 'fetchInteractions', error: interactionsResult.error });
      }

      // Overall success only if profile succeeded (minimum requirement)
      results.success = profileResult.success;

      return results;
    } catch (error) {
      return this._formatError('extractAllData', error);
    }
  }

  /**
   * Format error response consistently
   * @param {string} method - Method name that failed
   * @param {Error} error - Error object
   * @returns {Object} Formatted error response
   * @private
   */
  _formatError(method, error) {
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        method: method,
        details: error.response?.data || null
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate if extractor is properly configured
   * @returns {Promise<Object>} Validation result
   */
  async validate() {
    const validation = {
      valid: true,
      checks: {},
      timestamp: new Date().toISOString()
    };

    // Check if user has valid OAuth token
    try {
      const hasToken = await OAuthService.hasValidToken(this.userId);
      validation.checks.authentication = {
        valid: hasToken,
        message: hasToken ? 'Valid OAuth token found' : 'No valid OAuth token'
      };
      
      if (!hasToken) {
        validation.valid = false;
      }
    } catch (error) {
      validation.checks.authentication = {
        valid: false,
        message: `Authentication check failed: ${error.message}`
      };
      validation.valid = false;
    }

    // Check API configuration
    validation.checks.configuration = {
      valid: !!(config.linkedin.clientId && config.linkedin.clientSecret),
      message: config.linkedin.clientId ? 'LinkedIn API configured' : 'LinkedIn API not configured'
    };

    if (!validation.checks.configuration.valid) {
      validation.valid = false;
    }

    return validation;
  }
}

module.exports = LinkedInExtractor;
