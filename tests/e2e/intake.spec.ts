import { test, expect } from '@playwright/test';
import { IntakePage } from './pages';
import { mockGeminiAPI } from './utils/apiMocks';
import { mockCalibrationResult } from './fixtures/mockGeminiResponse';

test.describe('Intake Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the calibration API to avoid real Gemini calls
    await mockGeminiAPI(page);

    // Clear localStorage before each test and set language to English
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('recruitos_admin_mode', 'true');
      localStorage.setItem('apex_credits', '10000');
      localStorage.setItem('recruitos_lang', 'en'); // Set English for consistent selectors
      localStorage.setItem('skillsync_onboarding_completed', 'true'); // Skip onboarding modal
    });
    // Reload to apply settings
    await page.reload();
  });

  test('loads demo job context', async ({ page }) => {
    const intakePage = new IntakePage(page);
    await intakePage.goto();

    // Click Load Demo button
    await intakePage.loadDemo();

    // Verify calibration card appears with job details
    await expect(intakePage.calibrationCard).toBeVisible({ timeout: 10000 });

    // Verify job title and company are displayed
    const result = await intakePage.getCalibrationResult();
    expect(result.title).toContain('Senior Full-Stack Engineer');
    expect(result.company).toContain('FinTech Startup');

    // Verify required skills are displayed
    const skillBadges = page.locator('.bg-primary\\/20.text-primary');
    await expect(skillBadges.first()).toBeVisible();
    const skillCount = await skillBadges.count();
    expect(skillCount).toBeGreaterThan(0);
  });

  test('analyzes job from pasted text', async ({ page }) => {
    const intakePage = new IntakePage(page);
    await intakePage.goto();

    // Switch to text tab and paste job description
    const jobText = `
      Role: Frontend Developer
      Location: Copenhagen, Denmark

      Requirements:
      - 3+ years of experience with React
      - Strong TypeScript skills
      - Experience with Next.js
      - Good communication skills
    `;

    await intakePage.submitJobText(jobText);

    // Wait for calibration results to appear (API is mocked)
    await expect(intakePage.calibrationCard).toBeVisible({ timeout: 15000 });

    // Verify skills were extracted (mocked response has these skills)
    const result = await intakePage.getCalibrationResult();
    expect(result.skills.length).toBeGreaterThan(0);
  });

  test('validates LinkedIn URLs', async ({ page }) => {
    const intakePage = new IntakePage(page);
    await intakePage.goto();

    // Enter an invalid LinkedIn URL
    await intakePage.companyLinkedInInput.fill('not-a-valid-url');
    await intakePage.companyLinkedInInput.blur();

    // Wait for validation to trigger
    await page.waitForTimeout(600); // Validation has 500ms delay

    // Check for validation error indicator (red X icon appears)
    const errorIcon = intakePage.companyLinkedInInput.locator('..').locator('.text-red-500');
    await expect(errorIcon).toBeVisible({ timeout: 3000 });

    // Enter a valid LinkedIn company URL
    await intakePage.setCompanyLinkedIn('https://linkedin.com/company/stripe');
    await intakePage.companyLinkedInInput.blur();

    // Wait for validation
    await page.waitForTimeout(600);

    // Check for valid indicator (green check icon in parent container)
    const validCheck = intakePage.companyLinkedInInput.locator('..').locator('.text-green-500');
    await expect(validCheck).toBeVisible({ timeout: 5000 });
  });

  test('navigates to skills review after initialization', async ({ page }) => {
    const intakePage = new IntakePage(page);
    await intakePage.goto();

    // Load demo to get calibration
    await intakePage.loadDemo();
    await expect(intakePage.calibrationCard).toBeVisible({ timeout: 10000 });

    // The demo auto-navigates after 1.5 seconds
    // Wait for navigation to skills-review
    await expect(page).toHaveURL(/\/skills-review/, { timeout: 5000 });
  });

  test('persists job context in localStorage', async ({ page }) => {
    const intakePage = new IntakePage(page);
    await intakePage.goto();

    // Load demo to trigger calibration save
    await intakePage.loadDemo();
    await expect(intakePage.calibrationCard).toBeVisible({ timeout: 10000 });

    // Wait for navigation (which triggers localStorage save)
    await expect(page).toHaveURL(/\/skills-review/, { timeout: 5000 });

    // Verify localStorage has job context
    const jobContext = await page.evaluate(() => {
      return localStorage.getItem('apex_job_context');
    });

    expect(jobContext).not.toBeNull();
    const parsed = JSON.parse(jobContext as string);
    expect(parsed.title).toBeDefined();
    expect(parsed.requiredSkills).toBeDefined();
    expect(Array.isArray(parsed.requiredSkills)).toBe(true);
  });
});
