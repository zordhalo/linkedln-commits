# LinkedIn Commits

Track your LinkedIn activity similar to how GitHub displays commits. Monitor your daily posts, likes, and comments in one place.

## Features

- Track daily LinkedIn activity (posts, likes, comments)
- Store user profiles and authentication
- MongoDB-based storage with optimized indexes
- Ready-to-use database schema and scripts

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

Update the MongoDB connection URI in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/linkedin_activity
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

## Database Schema

The application uses MongoDB with two main collections:

### Users
- Stores user profile and LinkedIn credentials
- Fields: name, linkedin_url, access_token
- Indexed on linkedin_url for fast lookups

### Activities
- Stores daily activity metrics
- Fields: user_id, date, posts, likes, comments
- Indexed on user_id and date for efficient queries
- Unique constraint on user_id + date

For detailed schema documentation, see [docs/database-schema.md](docs/database-schema.md)

## Scripts

- `npm run db:init` - Initialize database collections and indexes
- `npm run db:init:fresh` - Drop existing data and reinitialize
- `npm run db:seed` - Populate database with sample data
- `npm run db:setup` - Initialize and seed in one command

## Project Structure

```
.
├── database/
│   ├── models/           # Mongoose schema models
│   ├── scripts/          # Database management scripts
│   ├── config.js         # Database configuration
│   └── README.md         # Database documentation
├── docs/
│   └── database-schema.md # Detailed schema documentation
└── README.md             # This file
```

## Documentation

- [Database Schema](docs/database-schema.md) - Complete database documentation
- [Database README](database/README.md) - Database setup and usage guide

## License

ISC
