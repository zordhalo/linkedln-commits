# linkedln-commits
Repo to keep track of linkedln activity similarily to how github displays Commits.

## Project Overview
This project tracks LinkedIn activity and visualizes it in a commit-style format, similar to GitHub's activity display.

## Directory Structure
```
linkedln-commits/
├── src/
│   ├── extractor/     # Data extraction logic
│   ├── storage/       # Database operations
│   ├── api/           # Backend API
│   ├── visualization/ # Frontend rendering
│   └── scheduler/     # Automation
├── config/            # Configuration files
├── data/              # Data storage
└── tests/             # Test files
```

## Getting Started

### Environment Setup

1. **Create environment configuration file**
   
   Copy the example environment file and update it with your own values:
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**
   
   Open `.env` file and set the following variables:
   - `LINKEDIN_API_KEY`: Your LinkedIn API key for accessing LinkedIn data
   - `DATABASE_URL`: Connection string for your database (e.g., PostgreSQL)
   - `PORT`: Port number for the API server (default: 3000)
   - `NODE_ENV`: Environment mode (`development`, `production`, or `test`)

3. **Example configuration**
   ```
   LINKEDIN_API_KEY=your_actual_api_key
   DATABASE_URL=postgresql://username:password@localhost:5432/linkedln_commits
   PORT=3000
   NODE_ENV=development
   ```

> **Note:** Never commit your `.env` file to version control. It contains sensitive information and is already included in `.gitignore`.
