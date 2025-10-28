# CronScheduler Module

The CronScheduler module provides automated job scheduling capabilities for the LinkedIn Commits application using `node-cron`.

## Features

- ✅ Schedule jobs with cron expressions
- ✅ Configurable schedule via environment variables
- ✅ Support for multiple concurrent jobs
- ✅ Timezone support
- ✅ Start/stop individual or all jobs
- ✅ Get scheduler status and job information
- ✅ Comprehensive event logging
- ✅ Validation of cron expressions

## Installation

The `node-cron` package is already included in the project dependencies:

```bash
npm install
```

## Configuration

Add these variables to your `.env` file:

```env
# Cron schedule expression (default: daily at 2 AM)
CRON_SCHEDULE=0 2 * * *

# Timezone for scheduler (default: America/New_York)
TIMEZONE=America/New_York

# Enable/disable scheduler (default: true)
SCHEDULER_ENABLED=true
```

### Cron Expression Format

```
# ┌────────────── minute (0-59)
# │ ┌──────────── hour (0-23)
# │ │ ┌────────── day of month (1-31)
# │ │ │ ┌──────── month (1-12)
# │ │ │ │ ┌────── day of week (0-7, 0/7=Sun)
# * * * * *
```

### Common Patterns

```javascript
'* * * * *'        // Every minute
'*/5 * * * *'      // Every 5 minutes
'0 * * * *'        // Every hour
'0 0 * * *'        // Daily at midnight
'0 2 * * *'        // Daily at 2 AM
'0 9 * * 1-5'      // Weekdays at 9 AM
'0 0 1 * *'        // First day of month
'0 0 * * 0'        // Every Sunday at midnight
```

## Usage

### Basic Usage

```javascript
const scheduler = require('./src/scheduler/CronScheduler');

// Define your task
async function myTask() {
  console.log('Task is running!');
  // Your task logic here
}

// Start the scheduler with default config
scheduler.startScheduler('my-job', myTask);

// Get status
const status = scheduler.getSchedulerStatus();
console.log(status);

// Stop the scheduler
scheduler.stopScheduler('my-job');
```

### Advanced Usage

```javascript
const scheduler = require('./src/scheduler/CronScheduler');

// Start with custom schedule
scheduler.startScheduler(
  'custom-job',
  async () => {
    console.log('Custom job running');
  },
  '0 */6 * * *', // Every 6 hours
  { timezone: 'UTC' }
);

// Start multiple jobs
scheduler.startScheduler('job1', task1, '0 2 * * *');
scheduler.startScheduler('job2', task2, '0 14 * * *');

// Get status of specific job
const jobStatus = scheduler.getSchedulerStatus('job1');

// Get status of all jobs
const allStatus = scheduler.getSchedulerStatus();

// Stop all jobs
scheduler.stopAllSchedulers();
```

## API Reference

### `startScheduler(jobName, task, schedule, options)`

Start a new scheduled job.

**Parameters:**
- `jobName` (string): Unique identifier for the job (default: 'default')
- `task` (Function): The async/sync function to execute
- `schedule` (string): Cron expression (default: from config)
- `options` (Object): Additional options
  - `timezone` (string): Timezone for the schedule (default: from config)

**Returns:** Object with `success`, `message`, `schedule`, and `timezone`

**Example:**
```javascript
const result = scheduler.startScheduler(
  'data-extraction',
  extractData,
  '0 2 * * *',
  { timezone: 'America/New_York' }
);
```

### `stopScheduler(jobName)`

Stop a specific scheduled job.

**Parameters:**
- `jobName` (string): Name of the job to stop (default: 'default')

**Returns:** Object with `success` and `message`

**Example:**
```javascript
const result = scheduler.stopScheduler('data-extraction');
```

### `stopAllSchedulers()`

Stop all running scheduled jobs.

**Returns:** Object with `success`, `message`, and `stoppedJobs` array

**Example:**
```javascript
const result = scheduler.stopAllSchedulers();
```

### `getSchedulerStatus(jobName)`

Get status information for scheduler jobs.

**Parameters:**
- `jobName` (string, optional): Specific job name. If omitted, returns all jobs.

**Returns:** Object with job status information

**Example:**
```javascript
// Get all jobs status
const allStatus = scheduler.getSchedulerStatus();

// Get specific job status
const jobStatus = scheduler.getSchedulerStatus('data-extraction');
```

### `validateCronExpression(expression)`

Validate a cron expression.

**Parameters:**
- `expression` (string): Cron expression to validate

**Returns:** Boolean (true if valid)

**Example:**
```javascript
const isValid = scheduler.validateCronExpression('0 2 * * *');
// Returns: true
```

## Logging

The scheduler logs all important events:

- Job start/stop events
- Job execution triggers
- Job completion (success/failure)
- Configuration information
- Errors and warnings

All logs are prefixed with `[Scheduler]` for easy filtering.

## Example Integration

See `src/scheduler/example.js` for a complete working example:

```bash
node src/scheduler/example.js
```

## Integration with Express Server

```javascript
const express = require('express');
const scheduler = require('./src/scheduler/CronScheduler');
const config = require('../config/config');

const app = express();

// Start scheduler when server starts
async function startServer() {
  // ... other initialization ...
  
  if (config.scheduler.enabled) {
    scheduler.startScheduler('linkedin-extraction', async () => {
      console.log('Running scheduled LinkedIn data extraction...');
      // Your extraction logic here
    });
    console.log('✓ Scheduler started');
  }
  
  app.listen(3000);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  scheduler.stopAllSchedulers();
  process.exit(0);
});

startServer();
```

## Testing

You can test the scheduler with a short interval:

```javascript
// Test job that runs every minute
scheduler.startScheduler(
  'test',
  () => console.log('Test job running'),
  '*/1 * * * *'
);
```

## Troubleshooting

### Job not running

1. Check the cron expression is valid:
   ```javascript
   scheduler.validateCronExpression(yourExpression);
   ```

2. Verify the job was started successfully:
   ```javascript
   const status = scheduler.getSchedulerStatus('your-job-name');
   console.log(status);
   ```

3. Check timezone configuration matches your expectations

### Multiple instances

The scheduler exports a singleton instance, so all imports reference the same scheduler. This prevents duplicate job scheduling.

## Best Practices

1. **Use descriptive job names**: Makes debugging and management easier
2. **Handle errors in tasks**: Always wrap async operations in try-catch
3. **Log important events**: Use console.log/error for monitoring
4. **Test cron expressions**: Use `validateCronExpression()` before deployment
5. **Graceful shutdown**: Stop schedulers on process termination
6. **Monitor job execution**: Implement success/failure tracking in your tasks

## Dependencies

- [node-cron](https://www.npmjs.com/package/node-cron) v4.2.1

## License

Part of the LinkedIn Commits project.
