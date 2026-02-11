import { test, expect } from '@playwright/test';
import { ProfilePage } from './pages';
import { mockGitHubAPI, mockGeminiAPI, mockBrightDataAPI } from './utils/apiMocks';

test.describe('Profile Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all APIs
    await mockGitHubAPI(page);
    await mockGeminiAPI(page);
    await mockBrightDataAPI(page);

    // Set up localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('recruitos_admin_mode', 'true');
      localStorage.setItem('apex_credits', '10000');
      localStorage.setItem('recruitos_lang', 'en');
      localStorage.setItem('skillsync_onboarding_completed', 'true');
    });
    await page.reload();
  });

  test('displays developer stats and skills', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto('johndoe');

    // Wait for profile to load
    await profilePage.waitForProfile();

    // Verify developer name is displayed
    await expect(profilePage.developerName).toBeVisible();

    // Verify stats labels are displayed
    await expect(page.getByText('Repos').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Stars').first()).toBeVisible({ timeout: 5000 });

    // Verify skills section is displayed (on overview tab)
    const skillsSection = page.locator('text=Skills & Technologies');
    await expect(skillsSection).toBeVisible({ timeout: 5000 });
  });

  test('shows psychometric profile tab', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto('johndoe');

    // Wait for profile to load
    await profilePage.waitForProfile();

    // Click on Psychometric tab
    await profilePage.psychometricTab.click();

    // Verify tab is active
    await expect(profilePage.psychometricTab).toHaveAttribute('data-state', 'active');

    // Look for archetype-related content in the page
    const archetypeContent = page.locator('text=/architect|pioneer|craftsman|collaborator/i');
    await expect(archetypeContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('shows repository list', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto('johndoe');

    // Wait for profile to load
    await profilePage.waitForProfile();

    // Verify "Top Repositories" section is displayed
    const reposSection = page.locator('text=Top Repositories');
    await expect(reposSection).toBeVisible({ timeout: 5000 });

    // Verify at least one repo card is shown
    const repoCards = page.locator('a[aria-label*="repository on GitHub"]');
    const repoCount = await repoCards.count();
    expect(repoCount).toBeGreaterThan(0);
  });

  test('switches between tabs', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto('johndoe');

    // Wait for profile to load
    await profilePage.waitForProfile();

    // Test Overview tab (default)
    await expect(profilePage.overviewTab).toHaveAttribute('data-state', 'active');

    // Switch to Psychometric tab
    await profilePage.psychometricTab.click();
    await expect(profilePage.psychometricTab).toHaveAttribute('data-state', 'active');

    // Switch to Connection tab
    await profilePage.connectionTab.click();
    await expect(profilePage.connectionTab).toHaveAttribute('data-state', 'active');

    // Switch to Outreach tab
    await profilePage.outreachTab.click();
    await expect(profilePage.outreachTab).toHaveAttribute('data-state', 'active');

    // Switch back to Overview
    await profilePage.overviewTab.click();
    await expect(profilePage.overviewTab).toHaveAttribute('data-state', 'active');
  });
});
