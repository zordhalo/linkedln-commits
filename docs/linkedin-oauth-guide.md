# LinkedIn OAuth 2.0 Implementation Guide

Complete guide for implementing and using LinkedIn OAuth 2.0 authentication in this project.

## Table of Contents

- [Overview](#overview)
- [LinkedIn Developer Portal Setup](#linkedin-developer-portal-setup)
- [Environment Configuration](#environment-configuration)
- [OAuth Flow Walkthrough](#oauth-flow-walkthrough)
- [Using the Implementation](#using-the-implementation)
- [API Endpoints](#api-endpoints)
- [Token Management](#token-management)
- [Security Best Practices](#security-best-practices)
- [Error Handling](#error-handling)
- [Testing & Debugging](#testing--debugging)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

This project implements the **3-legged OAuth 2.0 flow** (Member Authorization) for LinkedIn API access. This allows users to authenticate with LinkedIn and authorize the application to access their profile data and perform actions on their behalf.

### What's Included

- ✅ Complete OAuth 2.0 authorization code flow
- ✅ Automatic token refresh before expiration
- ✅ Secure token storage in MongoDB
- ✅ CSRF protection with state parameter
- ✅ Comprehensive error handling
- ✅ Authentication middleware for route protection
- ✅ Session management
- ✅ Example Express server implementation

### Architecture

```
User → LinkedIn Authorization Page
         ↓
Authorization Code → Token Exchange
         ↓
Access Token + Refresh Token → Secure Storage (MongoDB)
         ↓
Protected API Access (Auto-refresh tokens)
```

## LinkedIn Developer Portal Setup

### Step 1: Access Your LinkedIn Application

**Project LinkedIn App**: https://www.linkedin.com/developers/apps/228836775/auth

Or create a new app at: https://www.linkedin.com/developers/apps

### Step 2: Configure OAuth 2.0 Settings

1. Navigate to the **Auth** tab in your LinkedIn application
2. Add authorized redirect URLs:
   - **Development**: `http://localhost:3000/auth/linkedin/callback`
   - **Production**: `https://yourdomain.com/auth/linkedin/callback`

⚠️ **Important**: The redirect URI must match **exactly** (including protocol, domain, port, and path)

### Step 3: Get Your Credentials

From the **Auth** tab, copy:
- **Client ID**: Your application's unique identifier
- **Client Secret**: Keep this secret! Never commit to version control

### Step 4: Request Products and Permissions

1. Go to the **Products** tab
2. Request **"Sign in with LinkedIn using OpenID Connect"**
   - Approval is typically automatic for this product
3. This grants access to:
   - `profile` - Member's name, headline, photo
   - `email` - Member's primary email address
   - `w_member_social` - Post on behalf of member (if needed)

### Available Scopes

The implementation supports these LinkedIn OAuth scopes:

| Scope | Description | Access Level |
|-------|-------------|--------------|
| `profile` | Basic profile information (name, headline, photo) | Open |
| `email` | Primary email address | Open |
| `w_member_social` | Post, comment, like on behalf of member | Open |

For additional scopes, you may need LinkedIn Partner Program approval.

## Environment Configuration

### Step 1: Create Environment File

```bash
cp .env.example .env
```

### Step 2: Configure Variables

Edit `.env` with your LinkedIn app credentials:

```env
# LinkedIn OAuth 2.0 Configuration
# Get these from: https://www.linkedin.com/developers/apps/228836775/auth
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# Session Configuration
# Generate a random string for production
SESSION_SECRET=your_random_session_secret_here

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/linkedin_activity

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Step 3: Generate a Secure Session Secret

For production, generate a strong random secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## OAuth Flow Walkthrough

### Step 1: Initiate Authentication

**User Action**: Click "Sign in with LinkedIn" button

**Backend**: Redirects to LinkedIn authorization page

```javascript
GET /auth/linkedin
```

**What Happens**:
1. Generate random `state` parameter (CSRF protection)
2. Store `state` in session
3. Redirect user to LinkedIn with:
   - Client ID
   - Redirect URI
   - Requested scopes
   - State parameter

### Step 2: User Authorizes

**User Action**: Reviews and grants permissions on LinkedIn's page

**LinkedIn**: Displays requested permissions to user

### Step 3: Authorization Code Returned

**LinkedIn Action**: Redirects back to your callback URL

```
GET /auth/linkedin/callback?code=AQT...&state=abc123
```

### Step 4: Token Exchange

**Backend Action**: Exchanges authorization code for access token

```javascript
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code={authorization_code}&
redirect_uri={redirect_uri}&
client_id={client_id}&
client_secret={client_secret}
```

**LinkedIn Response**:
```json
{
  "access_token": "AQX...",
  "expires_in": 5184000,
  "refresh_token": "AQW...",
  "refresh_token_expires_in": 31536000,
  "scope": "profile,email"
}
```

### Step 5: Get User Profile

**Backend Action**: Fetches LinkedIn user info with access token

```javascript
GET https://api.linkedin.com/v2/userinfo
Authorization: Bearer {access_token}
LinkedIn-Version: 202410
```

### Step 6: Store User and Tokens

**Backend Action**:
1. Find or create user in database
2. Store OAuth tokens securely
3. Create session for user
4. Return success response

## Using the Implementation

### Starting the Server

```bash
# Install dependencies
npm install

# Initialize database
npm run db:init

# Start server
npm start
```

Server starts at: http://localhost:3000

### Authenticating Users

#### From Browser

Visit http://localhost:3000 and click "Sign in with LinkedIn"

#### From API

```bash
# Redirect user to this endpoint
curl http://localhost:3000/auth/linkedin
```

### Protecting Routes

Use the authentication middleware to protect routes:

```javascript
const { requireAuth, withAccessToken } = require('./src/api/authMiddleware');

// Require authentication
app.get('/protected', requireAuth, (req, res) => {
  // req.user is available here
  res.json({ 
    message: 'You are authenticated',
    user: req.user 
  });
});

// Require authentication + valid access token
app.get('/linkedin-api', requireAuth, withAccessToken, async (req, res) => {
  // req.accessToken is available and automatically refreshed if needed
  const userInfo = await OAuthService.getUserInfo(req.accessToken);
  res.json(userInfo);
});
```

### Making LinkedIn API Calls

```javascript
const OAuthService = require('./src/api/oauthService');

// Get valid access token (auto-refreshes if expired)
const accessToken = await OAuthService.getValidAccessToken(userId);

// Make API call to LinkedIn
const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'LinkedIn-Version': '202410'
  }
});
```

## API Endpoints

### Authentication Endpoints

#### 1. Initiate OAuth Flow

```
GET /auth/linkedin
```

Redirects user to LinkedIn authorization page.

**Response**: 302 Redirect

---

#### 2. OAuth Callback

```
GET /auth/linkedin/callback?code={code}&state={state}
```

Handles callback from LinkedIn after user authorization.

**Query Parameters**:
- `code` - Authorization code
- `state` - CSRF protection token

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "linkedin_url": "https://www.linkedin.com/in/johndoe"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "user_cancelled_authorize",
  "message": "User denied authorization",
  "userCancelled": true
}
```

---

#### 3. Check Authentication Status

```
GET /auth/status
```

Returns current authentication status.

**Success Response** (200 OK):
```json
{
  "authenticated": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "linkedin_url": "https://www.linkedin.com/in/johndoe"
  }
}
```

**Not Authenticated** (200 OK):
```json
{
  "authenticated": false,
  "message": "Not authenticated"
}
```

---

#### 4. Logout

```
POST /auth/logout
```

Revokes OAuth tokens and clears session.

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### 5. Manually Refresh Token

```
POST /auth/refresh
```

Manually triggers token refresh (useful for testing).

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "AQX..."
}
```

---

### Protected Route Examples

#### 6. Get User Profile

```
GET /api/profile
```

**Requires**: Authentication

**Success Response** (200 OK):
```json
{
  "message": "This is a protected route",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "linkedin_url": "https://www.linkedin.com/in/johndoe"
  }
}
```

---

#### 7. Get LinkedIn User Info

```
GET /api/linkedin/userinfo
```

**Requires**: Authentication + Valid Token

**Success Response** (200 OK):
```json
{
  "message": "LinkedIn user info retrieved successfully",
  "data": {
    "sub": "abc123xyz",
    "name": "John Doe",
    "given_name": "John",
    "family_name": "Doe",
    "picture": "https://media.licdn.com/...",
    "email": "john.doe@example.com",
    "email_verified": true
  }
}
```

## Token Management

### Token Storage

Tokens are stored in the `oauth_tokens` MongoDB collection:

```javascript
{
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  provider: "linkedin",
  access_token: "AQX...",  // Excluded from queries by default
  refresh_token: "AQW...", // Excluded from queries by default
  token_type: "Bearer",
  expires_at: ISODate("2025-04-28T10:00:00Z"),
  refresh_expires_at: ISODate("2026-10-28T10:00:00Z"),
  scope: "profile email",
  created_at: ISODate("2025-10-28T10:00:00Z"),
  updated_at: ISODate("2025-10-28T10:00:00Z")
}
```

### Token Expiration

- **Access Token**: Expires in ~60 days (5,184,000 seconds)
- **Refresh Token**: Expires in ~365 days (31,536,000 seconds)

### Automatic Token Refresh

The implementation automatically refreshes tokens when:

1. **Making API calls** through `withAccessToken` middleware
2. **Getting valid token** via `OAuthService.getValidAccessToken()`
3. **Token expires soon** (within 24 hours)

**Refresh Logic**:
```javascript
// Check if token is expired or expiring soon
if (token.isAccessTokenExpired() || token.needsRefresh()) {
  // Attempt refresh
  const newTokens = await OAuthService.refreshAccessToken(token.refresh_token);
  // Store new tokens
  await OAuthService.storeTokens(userId, newTokens);
}
```

### Manual Token Refresh

For batch token refresh (e.g., daily cron job):

```javascript
const OAuthService = require('./src/api/oauthService');

// Refresh all tokens expiring within 24 hours
const results = await OAuthService.refreshExpiringTokens();

console.log(`Success: ${results.success}`);
console.log(`Failed: ${results.failed}`);
console.log('Errors:', results.errors);
```

### Token Security Features

1. **Excluded from Default Queries**: `access_token` and `refresh_token` are not returned unless explicitly requested
2. **Encrypted Storage**: Can be encrypted at database level
3. **HTTPS Only**: Production should use HTTPS for all token transmission
4. **Secure Sessions**: HTTP-only cookies prevent XSS attacks

## Security Best Practices

### 1. CSRF Protection

The implementation uses the `state` parameter for CSRF protection:

```javascript
// Generate random state
const state = crypto.randomBytes(32).toString('hex');

// Store in session
req.session.oauthState = state;

// Verify on callback
if (state !== req.session.oauthState) {
  throw new Error('State parameter mismatch');
}
```

### 2. Secure Token Storage

```javascript
// Tokens are excluded from queries by default
const oauthTokenSchema = new mongoose.Schema({
  access_token: {
    type: String,
    required: true,
    select: false  // Not returned in queries
  }
});
```

### 3. Session Security

```javascript
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // HTTPS only in production
    httpOnly: true,    // Prevents XSS
    sameSite: 'lax',   // CSRF protection
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));
```

### 4. Environment Variables

```bash
# NEVER commit these to version control
LINKEDIN_CLIENT_SECRET=***
SESSION_SECRET=***
```

### 5. Scope Minimization

Only request the scopes you actually need:

```javascript
scope: 'profile email'  // Don't request w_member_social unless needed
```

### 6. HTTPS in Production

```javascript
if (config.isProduction()) {
  // Enforce HTTPS
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}
```

## Error Handling

### OAuth Error Scenarios

#### 1. User Denies Authorization

```json
{
  "error": "user_cancelled_authorize",
  "message": "User denied authorization",
  "userCancelled": true
}
```

**Action**: Show friendly message, allow retry

#### 2. Invalid Client Credentials

```json
{
  "error": "invalid_client",
  "message": "Token exchange failed: Invalid client credentials"
}
```

**Action**: Check `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in `.env`

#### 3. Invalid Redirect URI

```json
{
  "error": "redirect_uri_mismatch",
  "message": "The redirect_uri does not match"
}
```

**Action**: Ensure redirect URI in code matches LinkedIn Developer Portal exactly

#### 4. State Parameter Mismatch

```json
{
  "error": "invalid_state",
  "message": "State parameter mismatch - potential CSRF attack"
}
```

**Action**: Check session configuration, ensure cookies are enabled

#### 5. Expired Access Token

```json
{
  "error": "token_expired",
  "message": "Access token expired. Please log in again."
}
```

**Action**: Token refresh failed, user needs to re-authenticate

#### 6. Token Refresh Failed

```json
{
  "error": "refresh_failed",
  "message": "Failed to refresh token",
  "details": "Both access and refresh tokens are expired"
}
```

**Action**: Redirect user to re-authenticate

### Error Response Format

All errors follow this structure:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": "Technical details (development only)"
}
```

## Testing & Debugging

### Manual Testing Flow

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Visit home page**:
   ```
   http://localhost:3000
   ```

3. **Click "Sign in with LinkedIn"**

4. **Authorize the app** on LinkedIn's page

5. **Check authentication status**:
   ```bash
   curl http://localhost:3000/auth/status
   ```

### Testing with cURL

#### Check Status
```bash
curl http://localhost:3000/auth/status
```

#### Access Protected Route
```bash
curl http://localhost:3000/api/profile \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

#### Manually Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

#### Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Testing Token Refresh

To test automatic token refresh:

1. **Manually expire token** in MongoDB:
   ```javascript
   db.oauth_tokens.updateOne(
     { user_id: ObjectId("...") },
     { $set: { expires_at: new Date() } }
   );
   ```

2. **Make API call** that requires token:
   ```bash
   curl http://localhost:3000/api/linkedin/userinfo \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
   ```

3. **Verify** token was automatically refreshed

### Debugging Tips

#### Enable Debug Logging

```javascript
// Add to server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

#### Check Session Cookie

```bash
# Chrome DevTools
Application → Cookies → http://localhost:3000 → connect.sid
```

#### Verify MongoDB Connection

```bash
mongosh mongodb://localhost:27017/linkedin_activity
db.oauth_tokens.find().pretty()
```

#### Test LinkedIn API Directly

Use LinkedIn's Token Generator:
https://www.linkedin.com/developers/tools/oauth/token-generator

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update `LINKEDIN_REDIRECT_URI` to production URL
- [ ] Generate strong `SESSION_SECRET`
- [ ] Configure HTTPS for all endpoints
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas or managed MongoDB
- [ ] Implement Redis/MongoDB session store
- [ ] Add rate limiting
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure CORS for frontend
- [ ] Encrypt tokens at rest
- [ ] Set up monitoring and alerts

### Environment Variables for Production

```env
NODE_ENV=production
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=https://yourdomain.com/auth/linkedin/callback
SESSION_SECRET=strong_random_secret_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/linkedin_activity
PORT=443
```

### Production Session Configuration

```javascript
const MongoStore = require('connect-mongo');

app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.databaseUrl,
    touchAfter: 24 * 3600
  }),
  cookie: {
    secure: true,      // HTTPS only
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    sameSite: 'lax',
    domain: '.yourdomain.com'
  }
}));
```

### Update LinkedIn Developer Portal

1. Add production redirect URI:
   ```
   https://yourdomain.com/auth/linkedin/callback
   ```

2. Update privacy policy URL

3. Update terms of service URL

### Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## Troubleshooting

### Common Issues

#### 1. "Invalid Redirect URI"

**Symptom**: OAuth flow fails immediately

**Solution**:
- Verify redirect URI in `.env` matches LinkedIn Developer Portal
- Check for trailing slashes
- Ensure protocol (http/https) matches
- Verify port number if using localhost

#### 2. "State Parameter Mismatch"

**Symptom**: Callback fails with CSRF error

**Solution**:
- Check session configuration
- Ensure cookies are enabled in browser
- Verify `SESSION_SECRET` is set
- Clear browser cookies and try again

#### 3. "Token Refresh Failed"

**Symptom**: API calls fail with 401

**Solution**:
- Check if refresh token expired
- Verify client credentials are correct
- Prompt user to re-authenticate
- Check MongoDB connection

#### 4. "MongoDB Connection Failed"

**Symptom**: Server won't start

**Solution**:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod --dbpath /path/to/data

# Verify connection string
echo $MONGODB_URI
```

#### 5. "Session Not Persisting"

**Symptom**: User logged out on page refresh

**Solution**:
- Check if cookies are enabled
- Verify `SESSION_SECRET` is set
- Use proper session store (Redis/MongoDB) in production
- Check cookie `secure` setting (must be false for http)

#### 6. "CORS Errors"

**Symptom**: API calls from frontend fail

**Solution**:
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://yourfrontend.com',
  credentials: true
}));
```

### Getting Help

1. **Check Logs**: Review console output for error messages
2. **MongoDB Logs**: Check `oauth_tokens` collection
3. **LinkedIn Developer Portal**: Check application status
4. **Documentation**: Review this guide and [API README](../src/api/README.md)
5. **LinkedIn Docs**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow

## Additional Resources

### Documentation
- [API Documentation](../src/api/README.md) - Complete API reference
- [Database Schema](./database-schema.md) - Database structure
- [LinkedIn API Research](./linkedin-api-research.md) - API capabilities and limitations
- [Quick Start Guide](../QUICKSTART.md) - Get started in 5 minutes
- [Security Guide](../SECURITY.md) - Security considerations

### Official LinkedIn Resources
- [LinkedIn OAuth 2.0 Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn API Guide](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts)
- [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
- [Token Generator Tool](https://www.linkedin.com/developers/tools/oauth/token-generator)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)

### Support
- **Project LinkedIn App**: https://www.linkedin.com/developers/apps/228836775/auth
- **GitHub Issues**: https://github.com/zordhalo/linkedln-commits/issues
- **LinkedIn Developer Forums**: https://www.linkedin.com/help/linkedin/ask

---

**Last Updated**: October 2025  
**LinkedIn API Version**: 202410  
**OAuth Version**: 2.0
