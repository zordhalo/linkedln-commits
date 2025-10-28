/**
 * Example usage of CronScheduler
 * 
 * This demonstrates how to use the CronScheduler to schedule jobs.
 */

const scheduler = require('./CronScheduler');

// Example task function
async function linkedInDataExtraction() {
  console.log('>>> Starting LinkedIn data extraction...');
  
  // Simulate data extraction work
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('>>> LinkedIn data extraction completed!');
}

// Example 1: Start a job with default schedule from config
console.log('\n--- Example 1: Start default job ---');
const result1 = scheduler.startScheduler('daily-extraction', linkedInDataExtraction);
console.log('Result:', result1);

// Example 2: Check scheduler status
console.log('\n--- Example 2: Get scheduler status ---');
const status1 = scheduler.getSchedulerStatus();
console.log('Status:', JSON.stringify(status1, null, 2));

// Example 3: Start a job with custom schedule (every minute for testing)
console.log('\n--- Example 3: Start custom schedule job ---');
const result2 = scheduler.startScheduler(
  'test-job',
  async () => {
    console.log('>>> Test job running at', new Date().toLocaleString());
  },
  '*/1 * * * *', // Every minute
  { timezone: 'UTC' }
);
console.log('Result:', result2);

// Example 4: Get status of specific job
console.log('\n--- Example 4: Get status of specific job ---');
const status2 = scheduler.getSchedulerStatus('test-job');
console.log('Status:', JSON.stringify(status2, null, 2));

// Example 5: Validate cron expressions
console.log('\n--- Example 5: Validate cron expressions ---');
console.log('Valid "0 2 * * *":', scheduler.validateCronExpression('0 2 * * *'));
console.log('Valid "invalid":', scheduler.validateCronExpression('invalid'));

// Example 6: Wait a bit to see the test job run
console.log('\n--- Example 6: Waiting for test job to run (65 seconds) ---');
setTimeout(() => {
  console.log('\n--- Example 7: Stop specific job ---');
  const stopResult = scheduler.stopScheduler('test-job');
  console.log('Result:', stopResult);

  console.log('\n--- Example 8: Get final status ---');
  const finalStatus = scheduler.getSchedulerStatus();
  console.log('Status:', JSON.stringify(finalStatus, null, 2));

  console.log('\n--- Example 9: Stop all schedulers ---');
  const stopAllResult = scheduler.stopAllSchedulers();
  console.log('Result:', stopAllResult);

  console.log('\n--- Example 10: Verify all stopped ---');
  const endStatus = scheduler.getSchedulerStatus();
  console.log('Status:', JSON.stringify(endStatus, null, 2));

  console.log('\n✓ Example completed successfully!');
  process.exit(0);
}, 65000);

console.log('\nScheduler is running... Press Ctrl+C to exit');
