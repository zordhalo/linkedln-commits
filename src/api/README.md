# OAuth 2.0 Authentication Implementation

This directory contains the complete OAuth 2.0 authentication implementation for LinkedIn integration.

📖 **For the complete OAuth implementation guide, see [docs/linkedin-oauth-guide.md](../../docs/linkedin-oauth-guide.md)**

## Overview

The OAuth implementation provides secure authentication using LinkedIn's 3-legged OAuth 2.0 flow (Member Authorization). It includes:

- Authorization flow initiation
- Callback handling with token exchange
- Secure token storage with automatic refresh
- Authentication middleware
- Error handling for all OAuth scenarios

## Architecture

### Components

1. **OAuthToken Model** (`database/models/oauthToken.js`)
   - Stores access and refresh tokens securely
   - Tracks token expiration
   - Provides methods for token management

2. **OAuthService** (`src/api/oauthService.js`)
   - Core OAuth logic
   - Token exchange and refresh
   - LinkedIn API interactions

3. **OAuthController** (`src/api/oauthController.js`)
   - HTTP endpoint handlers
   - Request validation
   - Error responses

4. **Authentication Middleware** (`src/api/authMiddleware.js`)
   - Route protection
   - Automatic token refresh
   - User context injection

5. **Example Server** (`src/server.js`)
   - Complete Express server example
   - Demonstrates all OAuth features
   - Includes protected and public routes

## Setup

### 1. LinkedIn Developer Portal Configuration

1. Go to https://www.linkedin.com/developers/apps
2. Create a new application (or use existing app: https://www.linkedin.com/developers/apps/228836775/auth)
3. Configure OAuth 2.0 settings:
   - Redirect URL: `http://localhost:3000/auth/linkedin/callback` (development)
   - Redirect URL: `https://yourdomain.com/auth/linkedin/callback` (production)
4. Copy your Client ID and Client Secret

**Project LinkedIn App**: https://www.linkedin.com/developers/apps/228836775/auth

### 2. Environment Configuration

Create a `.env` file:

```env
# LinkedIn OAuth Configuration
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# Session Configuration
SESSION_SECRET=your_random_session_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/linkedin_activity

# Server
PORT=3000
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Initialize Database

```bash
npm run db:init
```

### 5. Start the Server

```bash
npm start
```

The server will start on http://localhost:3000

## Usage

### Basic Authentication Flow

1. **Initiate Authentication**
   ```
   GET /auth/linkedin
   ```
   Redirects user to LinkedIn authorization page

2. **User Authorizes App**
   User grants permissions on LinkedIn

3. **Callback Handling**
   ```
   GET /auth/linkedin/callback?code=xxx&state=xxx
   ```
   Automatically exchanges code for tokens and creates/updates user

4. **Access Protected Routes**
   Use session or authentication headers to access protected routes

### API Endpoints

#### Authentication Endpoints

- `GET /auth/linkedin` - Initiate OAuth flow
- `GET /auth/linkedin/callback` - OAuth callback (automatic)
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout and revoke tokens
- `POST /auth/refresh` - Manually refresh access token

#### Example Protected Routes

- `GET /api/profile` - Get user profile (requires auth)
- `GET /api/linkedin/userinfo` - Get LinkedIn user info (requires auth)
- `GET /api/public` - Public route with optional auth

### Using in Your Application

#### Protecting Routes

```javascript
const { requireAuth } = require('./api/authMiddleware');

app.get('/protected', requireAuth, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

#### Making Authenticated LinkedIn API Calls

```javascript
const { requireAuth, withAccessToken } = require('./api/authMiddleware');
const OAuthService = require('./api/oauthService');

app.get('/linkedin-data', requireAuth, withAccessToken, async (req, res) => {
  // req.accessToken is available and valid (auto-refreshed if needed)
  const userInfo = await OAuthService.getUserInfo(req.accessToken);
  res.json(userInfo);
});
```

#### Manual Token Management

```javascript
const OAuthService = require('./api/oauthService');

// Get valid token (auto-refreshes if needed)
const accessToken = await OAuthService.getValidAccessToken(userId);

// Check if user has valid token
const hasValid = await OAuthService.hasValidToken(userId);

// Revoke tokens
await OAuthService.revokeTokens(userId);
```

## Token Management

### Token Storage

Tokens are stored in the `oauth_tokens` collection with:
- Access token (excluded from queries by default)
- Refresh token (excluded from queries by default)
- Expiration timestamps
- User association

### Automatic Token Refresh

Tokens are automatically refreshed when:
1. Access token is expired
2. Making API calls through `withAccessToken` middleware
3. Calling `getValidAccessToken()` method

### Manual Token Refresh

For batch token refresh (e.g., daily cron job):

```javascript
const OAuthService = require('./api/oauthService');

// Refresh all tokens expiring within 24 hours
const results = await OAuthService.refreshExpiringTokens();
console.log(`Refreshed: ${results.success}, Failed: ${results.failed}`);
```

## Security Features

1. **CSRF Protection**: State parameter validation
2. **Secure Token Storage**: Tokens excluded from queries by default
3. **HTTPS in Production**: Secure cookies and redirects
4. **Token Encryption**: Can be added at database level
5. **Session Security**: HTTP-only cookies
6. **Error Handling**: Graceful error responses without leaking sensitive data

## Error Handling

The implementation handles all OAuth error scenarios:

- User denies authorization: `error=user_cancelled_authorize`
- Invalid client credentials: `401 Unauthorized`
- Invalid redirect URI: OAuth fails at LinkedIn
- Expired tokens: Automatic refresh or re-authentication prompt
- Revoked access: Clear tokens and prompt re-authentication

### Error Response Format

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": "Technical details (development only)"
}
```

## Testing

### Manual Testing

1. Start the server: `npm start`
2. Visit http://localhost:3000
3. Click "Sign in with LinkedIn"
4. Authorize the app
5. Test protected routes

### Testing Token Refresh

```bash
# Check status
curl http://localhost:3000/auth/status

# Manually refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID_HERE"}'
```

### Testing with cURL

```bash
# Get authentication status
curl http://localhost:3000/auth/status

# Access protected route (with session cookie)
curl http://localhost:3000/api/profile \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## Production Considerations

### Required Changes

1. **Use HTTPS**: All OAuth must be over HTTPS in production
2. **Session Store**: Use Redis or MongoDB session store
3. **Environment Variables**: Never commit secrets to version control
4. **Error Logging**: Implement proper error logging (e.g., Sentry)
5. **Rate Limiting**: Add rate limiting to prevent abuse
6. **Token Encryption**: Encrypt tokens at rest in database

### Example Production Session Setup

```javascript
const MongoStore = require('connect-mongo');

app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.databaseUrl,
    touchAfter: 24 * 3600 // Lazy session update
  }),
  cookie: {
    secure: true,  // HTTPS only
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  }
}));
```

## Database Schema

### OAuthToken Collection

```javascript
{
  user_id: ObjectId,           // Reference to User
  provider: 'linkedin',        // OAuth provider
  access_token: String,        // Access token (excluded by default)
  refresh_token: String,       // Refresh token (excluded by default)
  token_type: 'Bearer',        // Token type
  expires_at: Date,            // Access token expiration
  refresh_expires_at: Date,    // Refresh token expiration
  scope: String,               // Granted scopes
  created_at: Date,            // Creation timestamp
  updated_at: Date             // Last update timestamp
}
```

### Indexes

- `{ user_id: 1, provider: 1 }` - Unique compound index
- `{ expires_at: 1 }` - For finding expiring tokens
- `{ user_id: 1 }` - For user lookups

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**
   - Ensure redirect URI in code exactly matches LinkedIn Developer Portal
   - Include http:// or https://
   - Match trailing slashes

2. **State Parameter Mismatch**
   - Check session configuration
   - Ensure cookies are enabled
   - Verify session secret is set

3. **Token Refresh Fails**
   - Check if refresh token is expired
   - Verify client credentials
   - Prompt user to re-authenticate

4. **CORS Errors**
   - Configure CORS middleware if frontend is separate
   - Ensure credentials are included in requests

## References

- [LinkedIn OAuth 2.0 Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn API Guide](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)

## Support

For issues or questions:
1. Check this README
2. Review the example server code
3. Check LinkedIn Developer Portal documentation
4. Open an issue in the repository
