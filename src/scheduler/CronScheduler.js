/**
 * CronScheduler Module
 * 
 * Provides scheduling capabilities for automated LinkedIn data extraction.
 * Uses node-cron for job scheduling with configurable schedule and timezone.
 */

const cron = require('node-cron');
const config = require('../../config/config');

class CronScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the scheduler with a job
   * @param {string} jobName - Unique identifier for the job
   * @param {Function} task - The function to execute on schedule
   * @param {string} schedule - Cron schedule expression (defaults from config)
   * @param {Object} options - Additional options (timezone, etc.)
   * @returns {Object} Status object with success and message
   */
  startScheduler(jobName = 'default', task, schedule = null, options = {}) {
    try {
      // Validate task
      if (typeof task !== 'function') {
        throw new Error('Task must be a function');
      }

      // Check if job already exists
      if (this.jobs.has(jobName)) {
        console.warn(`[Scheduler] Job "${jobName}" already exists. Stopping existing job first.`);
        this.stopScheduler(jobName);
      }

      // Use provided schedule or fall back to config
      const cronSchedule = schedule || config.scheduler.schedule;

      // Validate cron expression
      if (!cron.validate(cronSchedule)) {
        throw new Error(`Invalid cron expression: ${cronSchedule}`);
      }

      // Merge options with config defaults
      const jobOptions = {
        scheduled: true,
        timezone: options.timezone || config.scheduler.timezone,
        ...options
      };

      console.log(`[Scheduler] Starting job "${jobName}" with schedule: ${cronSchedule} (${jobOptions.timezone})`);

      // Create and start the cron job
      const cronJob = cron.schedule(cronSchedule, async () => {
        console.log(`[Scheduler] Job "${jobName}" triggered at ${new Date().toISOString()}`);
        try {
          await task();
          console.log(`[Scheduler] Job "${jobName}" completed successfully at ${new Date().toISOString()}`);
        } catch (error) {
          console.error(`[Scheduler] Job "${jobName}" failed:`, error.message);
        }
      }, jobOptions);

      // Store job reference
      this.jobs.set(jobName, {
        cronJob,
        schedule: cronSchedule,
        timezone: jobOptions.timezone,
        createdAt: new Date(),
        lastRun: null
      });

      this.isRunning = true;
      console.log(`[Scheduler] Job "${jobName}" started successfully`);

      return {
        success: true,
        message: `Job "${jobName}" started successfully`,
        schedule: cronSchedule,
        timezone: jobOptions.timezone
      };
    } catch (error) {
      console.error(`[Scheduler] Failed to start job "${jobName}":`, error.message);
      return {
        success: false,
        message: `Failed to start job: ${error.message}`
      };
    }
  }

  /**
   * Stop a specific scheduler job
   * @param {string} jobName - Name of the job to stop
   * @returns {Object} Status object with success and message
   */
  stopScheduler(jobName = 'default') {
    try {
      if (!this.jobs.has(jobName)) {
        console.warn(`[Scheduler] Job "${jobName}" not found`);
        return {
          success: false,
          message: `Job "${jobName}" not found`
        };
      }

      const job = this.jobs.get(jobName);
      job.cronJob.stop();
      this.jobs.delete(jobName);

      console.log(`[Scheduler] Job "${jobName}" stopped successfully`);

      // Update running status
      if (this.jobs.size === 0) {
        this.isRunning = false;
      }

      return {
        success: true,
        message: `Job "${jobName}" stopped successfully`
      };
    } catch (error) {
      console.error(`[Scheduler] Failed to stop job "${jobName}":`, error.message);
      return {
        success: false,
        message: `Failed to stop job: ${error.message}`
      };
    }
  }

  /**
   * Stop all running scheduler jobs
   * @returns {Object} Status object with success and message
   */
  stopAllSchedulers() {
    try {
      const jobNames = Array.from(this.jobs.keys());
      
      if (jobNames.length === 0) {
        console.log('[Scheduler] No jobs to stop');
        return {
          success: true,
          message: 'No jobs were running'
        };
      }

      jobNames.forEach(jobName => {
        const job = this.jobs.get(jobName);
        job.cronJob.stop();
      });

      const stoppedCount = this.jobs.size;
      this.jobs.clear();
      this.isRunning = false;

      console.log(`[Scheduler] Stopped ${stoppedCount} job(s) successfully`);

      return {
        success: true,
        message: `Stopped ${stoppedCount} job(s) successfully`,
        stoppedJobs: jobNames
      };
    } catch (error) {
      console.error('[Scheduler] Failed to stop all jobs:', error.message);
      return {
        success: false,
        message: `Failed to stop all jobs: ${error.message}`
      };
    }
  }

  /**
   * Get status of all scheduler jobs
   * @param {string} jobName - Optional specific job name to get status for
   * @returns {Object} Status information for job(s)
   */
  getSchedulerStatus(jobName = null) {
    try {
      // Get status for specific job
      if (jobName) {
        if (!this.jobs.has(jobName)) {
          return {
            success: false,
            message: `Job "${jobName}" not found`,
            running: false
          };
        }

        const job = this.jobs.get(jobName);
        return {
          success: true,
          jobName,
          running: true,
          schedule: job.schedule,
          timezone: job.timezone,
          createdAt: job.createdAt.toISOString(),
          lastRun: job.lastRun ? job.lastRun.toISOString() : null
        };
      }

      // Get status for all jobs
      const allJobs = Array.from(this.jobs.entries()).map(([name, job]) => ({
        jobName: name,
        schedule: job.schedule,
        timezone: job.timezone,
        createdAt: job.createdAt.toISOString(),
        lastRun: job.lastRun ? job.lastRun.toISOString() : null
      }));

      return {
        success: true,
        running: this.isRunning,
        jobCount: this.jobs.size,
        jobs: allJobs
      };
    } catch (error) {
      console.error('[Scheduler] Failed to get status:', error.message);
      return {
        success: false,
        message: `Failed to get status: ${error.message}`,
        running: false
      };
    }
  }

  /**
   * Validate a cron expression
   * @param {string} expression - Cron expression to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateCronExpression(expression) {
    return cron.validate(expression);
  }

  /**
   * Get the next scheduled run time for a job
   * @param {string} jobName - Name of the job
   * @returns {Object} Status object with next run time
   */
  getNextRunTime(jobName = 'default') {
    try {
      if (!this.jobs.has(jobName)) {
        return {
          success: false,
          message: `Job "${jobName}" not found`
        };
      }

      // Note: node-cron doesn't provide a built-in way to get next run time
      // This is a placeholder for potential future enhancement
      return {
        success: true,
        message: 'Next run time calculation not yet implemented',
        jobName
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get next run time: ${error.message}`
      };
    }
  }
}

// Export singleton instance
const schedulerInstance = new CronScheduler();

module.exports = schedulerInstance;
