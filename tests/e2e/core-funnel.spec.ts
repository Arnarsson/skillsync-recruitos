import { test, expect } from '@playwright/test';

test('Core Funnel: Intake -> Shortlist -> Deep Profile', async ({ page }) => {
    // 1. Visit Home Page & Clean Slate
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page).toHaveTitle(/Apex OS/);

    // 2. Job Intake
    // Use the "Load Demo" button
    const loadDemoButton = page.getByRole('button', { name: /Load Demo/i });
    await loadDemoButton.click();

    // Click "Initialize Shortlist"
    const initializeButton = page.getByRole('button', { name: /Initialize Shortlist/i });
    await initializeButton.click();

    // 3. Queue up matching
    // Wait for the Shortlist page to load (indicated by "Talent Engine" header)
    await expect(page.getByText('Talent Engine')).toBeVisible({ timeout: 10000 });

    // The list is initially empty. We need to add a demo candidate.
    // Click the "Demo" button in the header (ensure viewport is wide enough)
    await page.setViewportSize({ width: 1280, height: 800 });
    const demoButton = page.getByRole('button', { name: /Demo/i });
    await demoButton.click();

    // Now wait for the candidate to appear (Pipeline Intelligence section triggers when candidates exist)
    await expect(page.getByText('Pipeline Intelligence')).toBeVisible({ timeout: 15000 });

    // Verify "Match Score" is visible on the card
    await expect(page.getByText('Match Score').first()).toBeVisible();

    // 4. Open Deep Profile
    // The candidate is initially locked. Click "Unlock".
    // Wait for at least one candidate card to appear
    const firstCard = page.locator('[data-testid^="candidate-card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    console.log('Candidate card found. Finding Unlock button...');
    const textContent = await firstCard.textContent();
    console.log('Card Text Content:', textContent);

    // Conditionally handle "Unlock" or "View Report"
    const unlockButton = firstCard.getByRole('button', { name: /Unlock/i });
    if (await unlockButton.isVisible()) {
        console.log('Candidate is locked. Unlocking...');
        await unlockButton.click();
        // Wait for it to become "View Report"
        await expect(firstCard.getByRole('button', { name: /View Report/i })).toBeVisible({ timeout: 20000 });
    } else {
        console.log('Candidate is already unlocked.');
    }

    // Now open the profile
    const viewReportButton = firstCard.getByRole('button', { name: /View Report/i });
    await expect(viewReportButton).toBeVisible();

    console.log('Opening Deep Profile...');
    await viewReportButton.click();

    // 5. Verify Deep Profile (Glass UI)
    console.log('Waiting for Deep Profile slide-over...');
    // Check for unique text inside Deep Profile "Match Alignment" (always present)
    await expect(page.getByText('Match Alignment')).toBeVisible({ timeout: 20000 });

    // Check for the slide-over panel container
    await expect(page.locator('.fixed.inset-y-0.right-0')).toBeVisible({ timeout: 5000 });

    // Check for Tabs (Evidence, Persona, etc.)
    await expect(page.getByRole('button', { name: 'Evidence' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Persona' })).toBeVisible();

    console.log('Core Funnel Test Completed Successfully');
});
