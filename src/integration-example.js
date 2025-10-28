/**
 * Integration Example: Using CronScheduler with Express Server
 * 
 * This example shows how to integrate the CronScheduler with the existing
 * Express server to schedule automated LinkedIn data extraction.
 */

const express = require('express');
const scheduler = require('./scheduler/CronScheduler');
const config = require('../config/config');

const app = express();

// Example LinkedIn data extraction function
async function linkedInDataExtraction() {
  console.log('[DataExtraction] Starting LinkedIn data extraction...');
  
  try {
    // Your LinkedIn data extraction logic here
    // For example:
    // - Fetch user activities
    // - Process and store in database
    // - Update analytics
    
    console.log('[DataExtraction] Data extraction completed successfully');
  } catch (error) {
    console.error('[DataExtraction] Error during extraction:', error.message);
    throw error; // Re-throw to let scheduler handle it
  }
}

// Start scheduler when server starts
function startScheduledJobs() {
  if (!config.scheduler.enabled) {
    console.log('⚠️  Scheduler is disabled in configuration');
    return;
  }

  console.log('Starting scheduled jobs...');
  
  // Start the main data extraction job
  const result = scheduler.startScheduler(
    'linkedin-extraction',
    linkedInDataExtraction,
    config.scheduler.schedule,
    { timezone: config.scheduler.timezone }
  );

  if (result.success) {
    console.log('✓ Scheduler started successfully');
    console.log(`  Schedule: ${result.schedule}`);
    console.log(`  Timezone: ${result.timezone}`);
  } else {
    console.error('✗ Failed to start scheduler:', result.message);
  }
}

// API endpoint to manually trigger data extraction
app.post('/api/extract', async (req, res) => {
  try {
    await linkedInDataExtraction();
    res.json({
      success: true,
      message: 'Data extraction completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Data extraction failed',
      error: error.message
    });
  }
});

// API endpoint to get scheduler status
app.get('/api/scheduler/status', (req, res) => {
  const status = scheduler.getSchedulerStatus();
  res.json(status);
});

// API endpoint to stop scheduler
app.post('/api/scheduler/stop', (req, res) => {
  const result = scheduler.stopAllSchedulers();
  res.json(result);
});

// API endpoint to restart scheduler
app.post('/api/scheduler/start', (req, res) => {
  startScheduledJobs();
  const status = scheduler.getSchedulerStatus();
  res.json(status);
});

// Graceful shutdown
function gracefulShutdown() {
  console.log('\nShutting down gracefully...');
  
  // Stop all scheduled jobs
  const result = scheduler.stopAllSchedulers();
  console.log(`Stopped ${result.stoppedJobs ? result.stoppedJobs.length : 0} job(s)`);
  
  // Close server and exit
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function startServer() {
  try {
    // Start scheduled jobs
    startScheduledJobs();
    
    // Start Express server
    const port = config.port || 3000;
    app.listen(port, () => {
      console.log(`✓ Server running on http://localhost:${port}`);
      console.log('\nScheduler API endpoints:');
      console.log('  GET  /api/scheduler/status - Get scheduler status');
      console.log('  POST /api/scheduler/start  - Start scheduler');
      console.log('  POST /api/scheduler/stop   - Stop scheduler');
      console.log('  POST /api/extract          - Manual data extraction');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startScheduledJobs };
