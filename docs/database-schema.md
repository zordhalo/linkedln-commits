# Database Schema Documentation

## Overview

This document describes the MongoDB database schema for the LinkedIn Activity Tracker application. The database is designed to store user information and their daily LinkedIn activity metrics.

## Technology Stack

- **Database**: MongoDB (NoSQL document database)
- **ODM**: Mongoose (Object Data Modeling library for MongoDB)
- **Environment**: 
  - Local Development: MongoDB on localhost
  - Production: MongoDB (cloud or self-hosted)

## Collections

### 1. Users Collection

Stores LinkedIn user information and authentication credentials.

#### Schema Definition

```javascript
{
  _id: ObjectId,              // Auto-generated unique identifier
  name: String,               // User's full name (required, max 255 chars)
  linkedin_url: String,       // LinkedIn profile URL (required, unique, validated)
  access_token: String,       // OAuth access token (required, not returned by default)
  created_at: Date,           // Account creation timestamp (auto-generated)
  updated_at: Date,           // Last update timestamp (auto-updated)
  last_sync: Date             // Last activity sync timestamp (nullable)
}
```

#### Field Details

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `_id` | ObjectId | Yes (auto) | Yes | MongoDB unique identifier |
| `name` | String | Yes | No | User's full name, trimmed, max 255 characters |
| `linkedin_url` | String | Yes | Yes | Valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username/) |
| `access_token` | String | Yes | No | OAuth access token for LinkedIn API (excluded from queries by default) |
| `created_at` | Date | Yes (auto) | No | Timestamp when user was created |
| `updated_at` | Date | Yes (auto) | No | Timestamp when user was last updated |
| `last_sync` | Date | No | No | Timestamp of last activity synchronization |

#### Indexes

- `linkedin_url`: Single field index for fast user lookups by profile URL
- `_id`: Default index (automatically created by MongoDB)

#### Validation Rules

- `name`: Required, trimmed whitespace, maximum length 255 characters
- `linkedin_url`: Must match pattern `https://(www.)?linkedin.com/in/[\w-]+/?`
- `access_token`: Required but excluded from default queries for security

---

### 2. Activities Collection

Stores daily LinkedIn activity metrics for each user.

#### Schema Definition

```javascript
{
  _id: ObjectId,              // Auto-generated unique identifier
  user_id: ObjectId,          // Reference to Users collection (required, indexed)
  date: Date,                 // Activity date (required, indexed, normalized to start of day)
  posts: Number,              // Number of posts made (default: 0, min: 0)
  likes: Number,              // Number of likes given (default: 0, min: 0)
  comments: Number,           // Number of comments made (default: 0, min: 0)
  created_at: Date,           // Record creation timestamp (auto-generated)
  updated_at: Date            // Last update timestamp (auto-updated)
}
```

#### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes (auto) | MongoDB unique identifier |
| `user_id` | ObjectId | Yes | Reference to user who performed activities |
| `date` | Date | Yes | Date of activities (normalized to midnight UTC) |
| `posts` | Number | No | Number of posts created (default: 0, minimum: 0) |
| `likes` | Number | No | Number of likes given (default: 0, minimum: 0) |
| `comments` | Number | No | Number of comments made (default: 0, minimum: 0) |
| `created_at` | Date | Yes (auto) | Timestamp when record was created |
| `updated_at` | Date | Yes (auto) | Timestamp when record was last updated |

#### Virtual Properties

- `total_activity`: Calculated field (posts + likes + comments) - included in JSON/Object output

#### Indexes

1. **Compound Index**: `{ user_id: 1, date: -1 }`
   - Primary query pattern: Get activities for a specific user, sorted by date (newest first)
   - Supports efficient date range queries per user

2. **Date Index**: `{ date: -1 }`
   - Query pattern: Get all activities for a specific date across all users
   - Supports date-based aggregations and reports

3. **Single Field Index**: `{ user_id: 1 }`
   - Query pattern: Get all activities for a specific user

4. **Unique Compound Index**: `{ user_id: 1, date: 1 }`
   - Constraint: Prevents duplicate entries for the same user and date
   - Ensures data integrity

#### Validation Rules

- `user_id`: Required, must be a valid ObjectId reference
- `date`: Required, stored as Date object
- `posts`, `likes`, `comments`: Minimum value of 0 (cannot be negative)

---

## Relationships

```
Users (1) ----< (Many) Activities
```

- One user can have many activity records
- Each activity record belongs to exactly one user
- Relationship maintained via `user_id` foreign key in Activities collection

---

## Database Setup

### Prerequisites

```bash
# Install MongoDB
# For macOS
brew install mongodb-community

# For Ubuntu/Debian
sudo apt-get install mongodb

# For Windows
# Download from https://www.mongodb.com/try/download/community
```

### Installation

1. **Install Dependencies**

```bash
npm install mongoose
```

2. **Environment Configuration**

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/linkedin_activity
```

For production, use a connection string like:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/linkedin_activity
```

3. **Initialize Database**

Run the initialization script to create collections and indexes:

```bash
node database/scripts/init.js
```

To drop existing collections and start fresh:

```bash
node database/scripts/init.js --drop
```

4. **Seed Sample Data (Optional)**

Populate the database with sample data for testing:

```bash
node database/scripts/seed.js
```

---

## Usage Examples

### Connecting to the Database

```javascript
const { connectDB, disconnectDB } = require('./database/config');

// Connect
await connectDB();

// Your database operations here

// Disconnect when done
await disconnectDB();
```

### Creating a User

```javascript
const { User } = require('./database/models');

const newUser = await User.create({
  name: 'John Doe',
  linkedin_url: 'https://www.linkedin.com/in/johndoe/',
  access_token: 'your_access_token_here'
});
```

### Recording Activity

```javascript
const { Activity } = require('./database/models');

const activity = await Activity.create({
  user_id: userId,
  date: new Date(),
  posts: 2,
  likes: 15,
  comments: 5
});
```

### Querying Activities

```javascript
// Get all activities for a user in the last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const activities = await Activity.find({
  user_id: userId,
  date: { $gte: thirtyDaysAgo }
}).sort({ date: -1 });

// Get activity for a specific date
const today = new Date();
today.setHours(0, 0, 0, 0);

const todayActivity = await Activity.findOne({
  user_id: userId,
  date: today
});

// Aggregate total activities for a user
const stats = await Activity.aggregate([
  { $match: { user_id: userId } },
  {
    $group: {
      _id: '$user_id',
      totalPosts: { $sum: '$posts' },
      totalLikes: { $sum: '$likes' },
      totalComments: { $sum: '$comments' }
    }
  }
]);
```

### Updating Activity

```javascript
// Update or insert (upsert) activity for a specific date
await Activity.findOneAndUpdate(
  {
    user_id: userId,
    date: new Date()
  },
  {
    $set: {
      posts: 3,
      likes: 20,
      comments: 8
    }
  },
  { upsert: true, new: true }
);
```

---

## Performance Considerations

### Index Strategy

1. **User Lookups**: The `linkedin_url` index enables fast user authentication and profile lookups
2. **Activity Queries**: The compound index `(user_id, date)` supports the most common query pattern
3. **Date-based Reports**: The `date` index enables efficient cross-user date queries
4. **Data Integrity**: The unique compound index prevents duplicate entries

### Query Optimization Tips

- Always use indexed fields in query filters
- Use projection to limit returned fields when full documents aren't needed
- Consider using aggregation pipelines for complex analytics
- Implement pagination for large result sets
- Use `lean()` for read-only queries to improve performance

### Recommended Practices

1. **Date Handling**: Always normalize dates to midnight UTC before storing
2. **Bulk Operations**: Use `insertMany()` or `bulkWrite()` for batch inserts
3. **Connection Pooling**: Configure appropriate pool size based on load
4. **Error Handling**: Always wrap database operations in try-catch blocks
5. **Validation**: Rely on schema validation to maintain data quality

---

## Security Considerations

1. **Access Token Protection**
   - The `access_token` field is excluded from queries by default
   - Use `.select('+access_token')` only when explicitly needed
   - Never expose tokens in logs or client responses

2. **Connection Security**
   - Use connection strings with authentication in production
   - Enable TLS/SSL for database connections
   - Restrict database access by IP when possible

3. **Input Validation**
   - All inputs are validated against schema rules
   - LinkedIn URL format is strictly validated
   - Numeric fields have minimum value constraints

---

## Backup and Maintenance

### Backup Strategy

```bash
# Create a backup
mongodump --uri="mongodb://localhost:27017/linkedin_activity" --out=/path/to/backup

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/linkedin_activity" /path/to/backup/linkedin_activity
```

### Monitoring

- Monitor index usage with `db.collection.stats()`
- Track query performance with MongoDB profiler
- Set up alerts for connection pool exhaustion
- Monitor disk space and database size growth

---

## Migration Strategy

When schema changes are needed:

1. Create a migration script in `database/scripts/migrations/`
2. Test migration on development database
3. Backup production database before migration
4. Run migration during maintenance window
5. Verify data integrity post-migration

---

## Future Enhancements

Potential schema improvements to consider:

1. **User Profile Enrichment**
   - Add fields for profile picture, bio, industry, location
   - Track follower/connection counts

2. **Detailed Activity Tracking**
   - Store individual post/like/comment IDs
   - Track engagement metrics (views, shares)
   - Add activity types (shares, mentions, etc.)

3. **Analytics**
   - Pre-calculated weekly/monthly statistics
   - Activity streaks and milestones
   - Comparison with network averages

4. **Audit Trail**
   - Track all data modifications
   - Store sync history and errors

---

## Support

For issues or questions about the database schema:

1. Check MongoDB documentation: https://docs.mongodb.com/
2. Review Mongoose documentation: https://mongoosejs.com/docs/
3. Open an issue in the project repository

---

**Last Updated**: October 2025
**Schema Version**: 1.0.0
