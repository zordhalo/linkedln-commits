# LinkedIn Commits

Track your LinkedIn activity similar to how GitHub displays commits. Monitor your daily posts, likes, and comments in one place.

## Features

- **OAuth 2.0 Authentication**: Secure LinkedIn authentication using industry-standard OAuth 2.0
- **Automatic Token Management**: Access tokens are automatically refreshed before expiration
- **Track LinkedIn Activity**: Track daily LinkedIn activity (posts, likes, comments)
- **User Profiles**: Store user profiles and authentication
- **MongoDB Storage**: MongoDB-based storage with optimized indexes
- **Express API**: Ready-to-use API server with protected routes
- **Comprehensive Security**: CSRF protection, secure token storage, and error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Update the configuration in `.env`:

```env
# LinkedIn OAuth (get from https://www.linkedin.com/developers/apps/228836775/auth)
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# Session Secret
SESSION_SECRET=your_random_session_secret_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/linkedin_activity

# Server
PORT=3000
```

### 3. Database Setup

Initialize the database:

```bash
npm run db:init
```

Optionally, seed with sample data:

```bash
npm run db:seed
```

### 4. Start the Server

```bash
npm start
```

The server will start on http://localhost:3000

Visit the home page and click "Sign in with LinkedIn" to authenticate!

📚 **New to the project?** Check out the [Quick Start Guide](QUICKSTART.md) for detailed setup instructions!

## Database Schema

The application uses MongoDB with three main collections:

### Users
- Stores user profile and LinkedIn credentials
- Fields: name, linkedin_url, access_token
- Indexed on linkedin_url for fast lookups

### Activities
- Stores daily activity metrics
- Fields: user_id, date, posts, likes, comments
- Indexed on user_id and date for efficient queries
- Unique constraint on user_id + date

### OAuth Tokens
- Stores OAuth 2.0 access and refresh tokens
- Fields: user_id, provider, access_token, refresh_token, expires_at
- Automatic token refresh support
- Secure storage with excluded default queries

For detailed schema documentation, see [docs/database-schema.md](docs/database-schema.md)

## Scripts

- `npm start` - Start the Express server with OAuth authentication
- `npm run db:init` - Initialize database collections and indexes
- `npm run db:init:fresh` - Drop existing data and reinitialize
- `npm run db:seed` - Populate database with sample data
- `npm run db:setup` - Initialize and seed in one command

## Project Structure

```
.
├── src/
│   ├── api/                # OAuth and API implementation
│   │   ├── oauthService.js       # OAuth 2.0 service
│   │   ├── oauthController.js    # OAuth HTTP handlers
│   │   ├── authMiddleware.js     # Authentication middleware
│   │   └── README.md             # API documentation
│   ├── server.js           # Express server with OAuth
│   └── examples/           # Usage examples
├── database/
│   ├── models/            # Mongoose schema models
│   │   ├── user.js              # User model
│   │   ├── activity.js          # Activity model
│   │   └── oauthToken.js        # OAuth token model
│   ├── scripts/           # Database management scripts
│   ├── config.js          # Database configuration
│   └── README.md          # Database documentation
├── config/
│   └── config.js          # Application configuration
├── docs/
│   └── database-schema.md # Detailed schema documentation
├── SECURITY.md            # Security considerations
└── README.md              # This file
```

## Documentation

- [Quick Start Guide](QUICKSTART.md) - Get started in 5 minutes
- [LinkedIn OAuth 2.0 Guide](docs/linkedin-oauth-guide.md) - **Complete OAuth implementation guide**
- [API Documentation](src/api/README.md) - OAuth API reference
- [Database Schema](docs/database-schema.md) - Complete database documentation
- [LinkedIn API Research](docs/linkedin-api-research.md) - API capabilities and limitations
- [Security Guide](SECURITY.md) - Security considerations and best practices
- [Database README](database/README.md) - Database setup and usage guide

## OAuth 2.0 Authentication

The application implements LinkedIn OAuth 2.0 authentication flow with:

- **Authorization Flow**: Secure 3-legged OAuth 2.0 with state validation
- **Token Management**: Automatic token refresh before expiration
- **Secure Storage**: Tokens stored with encryption support and excluded from default queries
- **Error Handling**: Comprehensive error handling for all OAuth scenarios
- **Session Management**: Secure session handling with HTTP-only cookies

📖 **For complete OAuth implementation details, see the [LinkedIn OAuth 2.0 Guide](docs/linkedin-oauth-guide.md)**

### API Endpoints

- `GET /auth/linkedin` - Initiate OAuth authentication
- `GET /auth/linkedin/callback` - OAuth callback handler
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout and revoke tokens
- `POST /auth/refresh` - Manually refresh access token
- `GET /api/profile` - Get user profile (protected)
- `GET /api/linkedin/userinfo` - Get LinkedIn user info (protected)

For detailed API documentation, see [src/api/README.md](src/api/README.md)

## LinkedIn Developer Setup

1. Go to https://www.linkedin.com/developers/apps
2. Create a new application (or use existing app: https://www.linkedin.com/developers/apps/228836775/auth)
3. Configure OAuth 2.0 redirect URLs
4. Copy Client ID and Client Secret to `.env`
5. Request access to required products (Sign in with LinkedIn)

**Project LinkedIn App**: https://www.linkedin.com/developers/apps/228836775/auth

See the [issue comments](https://github.com/zordhalo/linkedln-commits/issues) for detailed setup instructions.

## License

ISC
