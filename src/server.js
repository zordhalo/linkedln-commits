/**
 * Example Express Server with OAuth 2.0 Authentication
 * 
 * This demonstrates how to set up the OAuth authentication flow
 * with LinkedIn using the OAuthService and OAuthController.
 */

const express = require('express');
const session = require('express-session');
const config = require('../config/config');
const { connectDB } = require('../database/config');
const OAuthController = require('./api/oauthController');
const { requireAuth, withAccessToken, optionalAuth } = require('./api/authMiddleware');
const OAuthService = require('./api/oauthService');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
// In production, use a proper session store like Redis or connect-mongo
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isProduction(), // Use secure cookies in production (HTTPS)
    httpOnly: true,
    sameSite: 'lax', // Helps prevent CSRF attacks
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ============================================================================
// OAuth Routes
// ============================================================================

/**
 * Initiate OAuth authentication
 * Redirects user to LinkedIn authorization page
 */
app.get('/auth/linkedin', OAuthController.authorize);

/**
 * OAuth callback endpoint
 * LinkedIn redirects here after user authorizes the app
 */
app.get('/auth/linkedin/callback', OAuthController.callback);

/**
 * Logout endpoint
 * Revokes OAuth tokens and clears session
 */
app.post('/auth/logout', OAuthController.logout);

/**
 * Check authentication status
 * Returns current user info if authenticated
 */
app.get('/auth/status', OAuthController.status);

/**
 * Manually refresh access token
 * Useful for testing token refresh logic
 */
app.post('/auth/refresh', OAuthController.refresh);

// ============================================================================
// Protected Routes (Examples)
// ============================================================================

/**
 * Example protected route
 * Requires authentication to access
 */
app.get('/api/profile', requireAuth, async (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: {
      id: req.user._id,
      name: req.user.name,
      linkedin_url: req.user.linkedin_url
    }
  });
});

/**
 * Example route that makes authenticated API calls to LinkedIn
 * Automatically gets and refreshes access token if needed
 */
app.get('/api/linkedin/userinfo', requireAuth, withAccessToken, async (req, res) => {
  try {
    // Use req.accessToken to make authenticated API calls
    const userInfo = await OAuthService.getUserInfo(req.accessToken);
    
    res.json({
      message: 'LinkedIn user info retrieved successfully',
      data: userInfo
    });
  } catch (error) {
    res.status(500).json({
      error: 'api_call_failed',
      message: 'Failed to get LinkedIn user info',
      details: error.message
    });
  }
});

/**
 * Example public route with optional authentication
 * Works with or without authentication
 */
app.get('/api/public', optionalAuth, (req, res) => {
  const response = {
    message: 'This is a public route',
    authenticated: !!req.user
  };

  if (req.user) {
    response.user = {
      id: req.user._id,
      name: req.user.name
    };
  }

  res.json(response);
});

// ============================================================================
// Public Routes
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * Home page with authentication instructions
 */
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>LinkedIn OAuth Example</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #0077B5; }
          .btn { display: inline-block; padding: 10px 20px; background: #0077B5; color: white; text-decoration: none; border-radius: 4px; }
          .btn:hover { background: #005885; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; }
          .endpoint { margin: 20px 0; padding: 15px; border-left: 4px solid #0077B5; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>LinkedIn OAuth 2.0 Example</h1>
        <p>This is a demonstration of OAuth 2.0 authentication with LinkedIn.</p>
        
        <h2>Getting Started</h2>
        <ol>
          <li>Configure your LinkedIn app credentials in <code>.env</code></li>
          <li>Click the button below to authenticate</li>
          <li>After authentication, you can access protected routes</li>
        </ol>
        
        <a href="/auth/linkedin" class="btn">Sign in with LinkedIn</a>
        
        <h2>Available Endpoints</h2>
        
        <div class="endpoint">
          <strong>GET /auth/linkedin</strong><br>
          Initiates OAuth authentication flow
        </div>
        
        <div class="endpoint">
          <strong>GET /auth/linkedin/callback</strong><br>
          OAuth callback endpoint (handled automatically)
        </div>
        
        <div class="endpoint">
          <strong>GET /auth/status</strong><br>
          Check current authentication status
        </div>
        
        <div class="endpoint">
          <strong>POST /auth/logout</strong><br>
          Logout and revoke tokens
        </div>
        
        <div class="endpoint">
          <strong>POST /auth/refresh</strong><br>
          Manually refresh access token
        </div>
        
        <div class="endpoint">
          <strong>GET /api/profile</strong> (Protected)<br>
          Get user profile (requires authentication)
        </div>
        
        <div class="endpoint">
          <strong>GET /api/linkedin/userinfo</strong> (Protected)<br>
          Get LinkedIn user info (requires authentication)
        </div>
        
        <div class="endpoint">
          <strong>GET /api/public</strong><br>
          Public endpoint with optional authentication
        </div>
        
        <h2>Configuration</h2>
        <p>Make sure your <code>.env</code> file contains:</p>
        <pre>
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback
SESSION_SECRET=your_random_session_secret
        </pre>
        
        <h2>Testing with cURL</h2>
        <p>After authentication, you can test the API:</p>
        <pre>
# Check status
curl http://localhost:3000/auth/status

# Access protected route
curl http://localhost:3000/api/profile -H "Cookie: connect.sid=YOUR_SESSION_ID"

# Logout
curl -X POST http://localhost:3000/auth/logout -H "Cookie: connect.sid=YOUR_SESSION_ID"
        </pre>
      </body>
    </html>
  `);
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'internal_error',
    message: 'An unexpected error occurred',
    details: config.isDevelopment() ? err.message : undefined
  });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('✓ Connected to database');

    // Start server
    const port = config.port;
    app.listen(port, () => {
      console.log(`✓ Server running on http://localhost:${port}`);
      console.log(`✓ OAuth callback URL: ${config.linkedin.redirectUri}`);
      console.log('\nAvailable routes:');
      console.log('  GET  /                           - Home page with instructions');
      console.log('  GET  /auth/linkedin              - Initiate OAuth authentication');
      console.log('  GET  /auth/linkedin/callback     - OAuth callback');
      console.log('  GET  /auth/status                - Check authentication status');
      console.log('  POST /auth/logout                - Logout');
      console.log('  POST /auth/refresh               - Refresh access token');
      console.log('  GET  /api/profile                - Get user profile (protected)');
      console.log('  GET  /api/linkedin/userinfo      - Get LinkedIn user info (protected)');
      console.log('  GET  /api/public                 - Public endpoint');
      console.log('  GET  /health                     - Health check');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
