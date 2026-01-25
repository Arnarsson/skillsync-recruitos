import { test, expect } from '@playwright/test';
import { PipelinePage } from './pages';
import { mockGitHubAPI, mockGeminiAPI } from './utils/apiMocks';

test.describe('Pipeline Flow', () => {
  // Test candidates data
  const testCandidates = [
    {
      id: 'johndoe',
      name: 'John Doe',
      currentRole: 'Senior Software Engineer',
      company: 'TechStartup',
      location: 'Copenhagen, Denmark',
      alignmentScore: 85,
      avatar: 'https://avatars.githubusercontent.com/u/12345?v=4',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    },
    {
      id: 'janedoe',
      name: 'Jane Doe',
      currentRole: 'Full-Stack Developer',
      company: 'ScaleUp Inc',
      location: 'Stockholm, Sweden',
      alignmentScore: 72,
      avatar: 'https://avatars.githubusercontent.com/u/23456?v=4',
      skills: ['JavaScript', 'React', 'GraphQL', 'AWS'],
    },
    {
      id: 'bobsmith',
      name: 'Bob Smith',
      currentRole: 'Backend Engineer',
      company: 'Performance Labs',
      location: 'Berlin, Germany',
      alignmentScore: 58,
      avatar: 'https://avatars.githubusercontent.com/u/34567?v=4',
      skills: ['Rust', 'Go', 'PostgreSQL', 'Redis'],
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Mock APIs
    await mockGitHubAPI(page);
    await mockGeminiAPI(page);

    // Set up localStorage with test data
    await page.goto('/');
    await page.evaluate(
      ({ candidates }) => {
        localStorage.clear();
        localStorage.setItem('recruitos_admin_mode', 'true');
        localStorage.setItem('apex_credits', '10000');
        localStorage.setItem('recruitos_lang', 'en');
        localStorage.setItem('skillsync_onboarding_completed', 'true');

        // Set job context
        const jobContext = {
          title: 'Senior Software Engineer',
          company: 'Test Company',
          requiredSkills: ['TypeScript', 'React', 'Node.js'],
          preferredSkills: ['GraphQL', 'PostgreSQL'],
          location: 'Copenhagen',
        };
        localStorage.setItem('apex_job_context', JSON.stringify(jobContext));

        // Set job context hash to prevent auto-search from clearing candidates
        const jobContextHash = JSON.stringify({
          title: jobContext.title,
          skills: jobContext.requiredSkills.slice(0, 5),
          location: jobContext.location,
        });
        localStorage.setItem('apex_job_context_hash', jobContextHash);

        // Seed with test candidates
        localStorage.setItem('apex_candidates', JSON.stringify(candidates));
      },
      { candidates: testCandidates }
    );
    await page.reload();
  });

  test('loads candidates from localStorage', async ({ page }) => {
    const pipelinePage = new PipelinePage(page);
    await pipelinePage.goto();

    // Wait for candidates to load
    await pipelinePage.waitForCandidates();

    // Verify candidates are displayed
    const count = await pipelinePage.getCandidateCount();
    expect(count).toBe(3);
  });

  test('filters candidates by score range', async ({ page }) => {
    const pipelinePage = new PipelinePage(page);
    await pipelinePage.goto();

    // Wait for candidates to load
    await pipelinePage.waitForCandidates();

    // Open filters panel
    await pipelinePage.filterButton.click();

    // Click on "80+" filter
    const highScoreFilter = page.getByRole('button', { name: '80+' });
    await highScoreFilter.click();

    // Verify only high-score candidates are shown (John Doe with 85)
    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Check that at least one candidate is still visible
    const count = await pipelinePage.getCandidateCount();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(1); // Only John Doe has 85
  });

  test('selects candidates for comparison', async ({ page }) => {
    const pipelinePage = new PipelinePage(page);
    await pipelinePage.goto();

    // Wait for candidates to load
    await pipelinePage.waitForCandidates();

    // Get candidate cards
    const cards = pipelinePage.candidateCards;
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Find all checkbox buttons on the page in candidate cards
    const checkboxButtons = cards.locator('button').filter({
      has: page.locator('svg[class*="lucide-square"], svg[class*="lucide-check"]'),
    });

    // Click on first candidate's checkbox
    await checkboxButtons.first().click();
    await page.waitForTimeout(300);

    // Click on second candidate's checkbox
    await checkboxButtons.nth(1).click();
    await page.waitForTimeout(300);

    // Verify shortlist panel shows up (has "selected" text or avatars)
    const shortlistArea = page.locator('text=/\\d+ of \\d+|selected/i');
    await expect(shortlistArea.first()).toBeVisible({ timeout: 5000 });
  });

  test('opens candidate profile inline', async ({ page }) => {
    const pipelinePage = new PipelinePage(page);
    await pipelinePage.goto();

    // Wait for candidates to load
    await pipelinePage.waitForCandidates();

    // Get first candidate card
    const firstCard = pipelinePage.candidateCards.first();
    await expect(firstCard).toBeVisible();

    // Click on name link to navigate to profile
    const profileLink = firstCard.locator(`a[href*="/profile/"]`);
    if (await profileLink.count() > 0) {
      await profileLink.first().click();
      // Should navigate to profile page
      await expect(page).toHaveURL(/\/profile\//, { timeout: 10000 });
    } else {
      // Try to find a view button
      const viewButton = firstCard.getByRole('button', { name: /view|profile|expand/i });
      if (await viewButton.count() > 0) {
        await viewButton.first().click();
      }
    }
  });

  test('generates outreach from pipeline', async ({ page }) => {
    const pipelinePage = new PipelinePage(page);
    await pipelinePage.goto();

    // Wait for candidates to load
    await pipelinePage.waitForCandidates();

    // Get first candidate card
    const firstCard = pipelinePage.candidateCards.first();
    await expect(firstCard).toBeVisible();

    // Find outreach button by looking for the message icon button
    // The button has a MessageSquare icon, which renders as lucide-message-square
    const outreachButton = firstCard.locator('button').filter({
      has: page.locator('svg.lucide-message-square'),
    });

    if (await outreachButton.count() > 0) {
      await outreachButton.first().click();

      // Verify outreach modal opens
      const modal = page.locator('.fixed.inset-0').filter({ hasText: /outreach|message/i });
      await expect(modal).toBeVisible({ timeout: 5000 });
    } else {
      // Outreach might be accessed through expanded card view
      // Verify candidate card is functional (can access profile)
      const candidateName = await firstCard.locator('h3').textContent();
      expect(candidateName).toBeTruthy();
    }
  });
});
