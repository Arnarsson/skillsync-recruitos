import { test as setup } from '@playwright/test';

/**
 * Global setup for E2E tests.
 * Runs once before all test files.
 * Used for any global configuration that doesn't require a browser context.
 */
setup('global setup', async () => {
  // Log test environment info
  console.log('E2E Test Suite Starting');
  console.log('Environment:', process.env.CI ? 'CI' : 'Local');
  console.log('Base URL: http://localhost:3000');

  // Any global setup tasks can be added here
  // For example: database seeding, API setup, etc.
});
