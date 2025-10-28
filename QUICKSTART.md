# Quick Start Guide

Get up and running with the LinkedIn Activity Tracker database in 5 minutes!

## Prerequisites

Ensure you have these installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (v4.4 or higher)

## Step-by-Step Setup

### 1. Start MongoDB

**On macOS/Linux:**
```bash
mongod --dbpath /path/to/data/directory
```

**On Windows:**
```bash
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred editor
# The default settings work for local development
```

### 4. Initialize Database

```bash
# Create collections and indexes
npm run db:init

# Or start fresh (drops existing data)
npm run db:init:fresh
```

### 5. (Optional) Add Sample Data

```bash
npm run db:seed
```

This creates:
- 2 sample users
- 30 days of activity data for each user

### 6. Verify Setup

```bash
npm run db:validate
```

## What's Created

### Collections

1. **users**
   - Stores user profiles and LinkedIn credentials
   - Indexed on `linkedin_url`

2. **activities**
   - Stores daily activity metrics (posts, likes, comments)
   - Indexed on `(user_id, date)`, `date`, and `user_id`

### Indexes

All performance indexes are created automatically during initialization:
- Users: `linkedin_url` (unique)
- Activities: `(user_id, date)` compound, `date`, `user_id`, unique `(user_id, date)`

## Common Tasks

### Connect to MongoDB Shell

```bash
mongosh mongodb://localhost:27017/linkedin_activity
```

### View Collections

```javascript
// In MongoDB shell
show collections

db.users.find().pretty()
db.activities.find().limit(5).pretty()
```

### Check Index Status

```javascript
// In MongoDB shell
db.users.getIndexes()
db.activities.getIndexes()
```

### Backup Database

```bash
mongodump --db=linkedin_activity --out=/path/to/backup
```

### Restore Database

```bash
mongorestore --db=linkedin_activity /path/to/backup/linkedin_activity
```

## Using in Your Application

### Basic Connection

```javascript
const { connectDB } = require('./database/config');
const { User, Activity } = require('./database/models');

async function main() {
  // Connect to database
  await connectDB();
  
  // Your code here
  const users = await User.find();
  console.log(users);
}

main();
```

### Create a User

```javascript
const user = await User.create({
  name: 'Your Name',
  linkedin_url: 'https://www.linkedin.com/in/yourprofile/',
  access_token: 'your_linkedin_oauth_token'
});

console.log('Created user:', user._id);
```

### Record Activity

```javascript
const activity = await Activity.create({
  user_id: user._id,
  date: new Date(),
  posts: 2,
  likes: 15,
  comments: 8
});

console.log('Recorded activity:', activity);
```

### Query Activities

```javascript
// Get last 7 days of activities
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const recentActivities = await Activity.find({
  user_id: user._id,
  date: { $gte: sevenDaysAgo }
}).sort({ date: -1 });

console.log('Recent activities:', recentActivities);
```

## Troubleshooting

### MongoDB Connection Failed

**Error:** `MongoServerSelectionError: connect ECONNREFUSED`

**Solution:** Ensure MongoDB is running:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB if not running
mongod --dbpath /path/to/data
```

### Port Already in Use

**Error:** `address already in use`

**Solution:** Either stop the existing MongoDB process or use a different port:
```bash
mongod --port 27018 --dbpath /path/to/data
```

Then update `.env`:
```
MONGODB_URI=mongodb://localhost:27018/linkedin_activity
```

### Permission Denied

**Error:** `Data directory /data/db not found`

**Solution:** Create the directory with proper permissions:
```bash
sudo mkdir -p /data/db
sudo chown -R $(whoami) /data/db
```

### Module Not Found

**Error:** `Cannot find module 'mongoose'`

**Solution:** Install dependencies:
```bash
npm install
```

## Next Steps

1. **Set up OAuth authentication**: See [docs/linkedin-oauth-guide.md](docs/linkedin-oauth-guide.md)
2. **Read the full documentation**: See [docs/database-schema.md](docs/database-schema.md)
3. **Explore the models**: Check out files in `database/models/`
4. **Review the scripts**: Look at `database/scripts/` for examples
5. **Build your app**: Use the models in your application code

## Getting Help

- Check [README.md](README.md) for general information
- Read [LinkedIn OAuth 2.0 Guide](docs/linkedin-oauth-guide.md) for OAuth implementation
- Read [database/README.md](database/README.md) for detailed database docs
- Review [docs/database-schema.md](docs/database-schema.md) for schema details

## Security Notes

⚠️ **Important Security Reminders:**
- Never commit `.env` file with real credentials
- Use strong passwords for production MongoDB
- Enable authentication on production MongoDB instances
- Use TLS/SSL for production connections
- Regularly update dependencies for security patches

---

**Ready to track your LinkedIn activity!** 🚀
