# Database

This directory contains the MongoDB database schema, models, and scripts for the LinkedIn Activity Tracker.

## Structure

```
database/
├── config.js              # Database connection configuration
├── models/                # Mongoose schema models
│   ├── index.js          # Models export
│   ├── user.js           # User model
│   └── activity.js       # Activity model
└── scripts/              # Database management scripts
    ├── init.js           # Initialize database and indexes
    └── seed.js           # Seed sample data
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your MongoDB URI:

```bash
cp .env.example .env
```

### 3. Initialize Database

Create collections and indexes:

```bash
npm run db:init
```

Or drop existing data and start fresh:

```bash
npm run db:init:fresh
```

### 4. Seed Sample Data (Optional)

Populate with test data:

```bash
npm run db:seed
```

### 5. All-in-One Setup

Run initialization and seeding together:

```bash
npm run db:setup
```

## Models

### User Model

Stores user information and LinkedIn credentials.

**File**: `models/user.js`

**Key Features**:
- LinkedIn URL validation
- Access token security (not returned by default)
- Automatic timestamps
- Indexed for fast lookups

### Activity Model

Stores daily activity metrics for users.

**File**: `models/activity.js`

**Key Features**:
- User reference via ObjectId
- Date-based indexing for performance
- Unique constraint per user per day
- Virtual `total_activity` property
- Compound indexes for efficient queries

## Scripts

### init.js

Initializes the database by:
- Creating collections
- Building indexes
- Verifying setup

**Usage**:
```bash
node database/scripts/init.js [--drop]
```

Options:
- `--drop`: Drop existing collections before initialization

### seed.js

Seeds the database with sample data:
- 2 sample users
- 30 days of activity data per user

**Usage**:
```bash
node database/scripts/seed.js
```

## Documentation

Full database schema documentation is available at:
- `/docs/database-schema.md`

## Connection Configuration

The database connection is configured in `config.js` and uses:
- Environment variable: `MONGODB_URI`
- Default: `mongodb://localhost:27017/linkedin_activity`

Connection options include:
- Connection pooling (2-10 connections)
- Auto-indexing enabled
- 5 second server selection timeout
- 45 second socket timeout

## Security Notes

- Never commit `.env` file with real credentials
- Access tokens are excluded from default queries
- Use secure connection strings in production
- Enable TLS/SSL for production databases

## Support

For more information, see:
- [Database Schema Documentation](../docs/database-schema.md)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
