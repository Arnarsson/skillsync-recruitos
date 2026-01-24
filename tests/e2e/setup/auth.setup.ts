import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * Authentication setup for E2E tests.
 * Sets localStorage values for admin mode, credits, and mocked session.
 * This runs before all tests and saves the storage state.
 */
setup('authenticate', async ({ page }) => {
  // Navigate to the app to set localStorage
  await page.goto('/');

  // Wait for the page to load
  await page.waitForLoadState('domcontentloaded');

  // Set localStorage values for authenticated state
  await page.evaluate(() => {
    // Admin mode enabled for full access
    localStorage.setItem('recruitos_admin_mode', 'true');

    // Set credits (10000 credits for testing all AI operations)
    localStorage.setItem('apex_credits', '10000');

    // Initialize search count
    localStorage.setItem('recruitos_search_count', '0');

    // Initialize empty audit logs
    localStorage.setItem('apex_logs', JSON.stringify([]));

    // Mock a basic job context for tests that need it
    localStorage.setItem(
      'apex_job_context',
      JSON.stringify({
        title: 'Senior Software Engineer',
        company: 'Test Company',
        description: 'Looking for experienced developers',
        requiredSkills: ['TypeScript', 'React', 'Node.js'],
        preferredSkills: ['GraphQL', 'PostgreSQL'],
      })
    );
  });

  // Reload to apply localStorage
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  // Verify localStorage was set correctly
  const credits = await page.evaluate(() => localStorage.getItem('apex_credits'));
  expect(credits).toBe('10000');

  // Save the storage state
  await page.context().storageState({ path: authFile });
});
