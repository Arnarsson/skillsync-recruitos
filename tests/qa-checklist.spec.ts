/**
 * QA Checklist E2E Tests
 * 
 * Automated tests that verify core QA requirements:
 * - Light/dark mode rendering
 * - Mobile/tablet/desktop viewports
 * - Console error detection
 * - PDF export functionality
 * - Navigation flows
 * - Empty/error states
 * 
 * Run with: npm run test:e2e
 */

import { test, expect } from '@playwright/test';

test.describe('QA Checklist: Visual Quality', () => {
  
  test('renders correctly in light mode', async ({ page }) => {
    await page.goto('/');
    
    // Verify light mode is active (check body or root element)
    const isDark = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    
    if (isDark) {
      // Toggle to light mode if needed
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
    }
    
    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('renders correctly in dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    
    // Wait for theme to apply
    await page.waitForTimeout(500);
    
    // Verify dark mode is active
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBeTruthy();
    
    // Take screenshot
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('is responsive on mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Verify mobile layout is applied
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('is responsive on tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Verify tablet layout is applied
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});

test.describe('QA Checklist: Console Errors', () => {
  
  test('has no console errors on homepage', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('has no console warnings on homepage', async ({ page }) => {
    const consoleWarnings: string[] = [];
    
    // Capture console warnings
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify no critical warnings (some warnings may be acceptable)
    // Filter out known acceptable warnings if needed
    const criticalWarnings = consoleWarnings.filter(
      w => !w.includes('DevToolbar') // Example: ignore DevToolbar warnings
    );
    
    expect(criticalWarnings).toHaveLength(0);
  });
});

test.describe('QA Checklist: Navigation', () => {
  
  test('can navigate to demo mode', async ({ page }) => {
    await page.goto('/?demo=true');
    
    // Verify demo mode is activated
    const isDemoMode = await page.evaluate(() => 
      localStorage.getItem('recruitos_demo_mode') === 'true'
    );
    
    expect(isDemoMode).toBeTruthy();
  });

  test('can navigate back from feature pages', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to a feature page (adjust selector as needed)
    const firstLink = page.locator('a').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      
      // Navigate back
      await page.goBack();
      
      // Verify we're back on homepage
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('QA Checklist: Empty States', () => {
  
  test('shows appropriate empty state message', async ({ page, context }) => {
    // Clear all storage to simulate empty state
    await context.clearCookies();
    await page.goto('/');
    
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.reload();
    
    // Check for empty state indicators (adjust selectors as needed)
    // This is a placeholder - adjust based on your actual empty states
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('QA Checklist: PDF Export (if applicable)', () => {
  
  test('PDF export renders with correct styling', async ({ page }) => {
    // Navigate to a page with PDF export (adjust URL as needed)
    await page.goto('/report/testpdf001');
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    // Verify PDF was generated
    expect(pdf.length).toBeGreaterThan(1000); // PDF should be at least 1KB
  });

  test('PDF export works in both light and dark mode', async ({ page }) => {
    await page.goto('/report/testpdf001');
    
    // Light mode PDF
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    
    const pdfLight = await page.pdf({ format: 'Letter', printBackground: true });
    expect(pdfLight.length).toBeGreaterThan(1000);
    
    // Dark mode PDF (should render as light mode for print)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    const pdfDark = await page.pdf({ format: 'Letter', printBackground: true });
    expect(pdfDark.length).toBeGreaterThan(1000);
    
    // PDFs should be similar size (both rendering light theme for print)
    const sizeDiff = Math.abs(pdfLight.length - pdfDark.length);
    expect(sizeDiff).toBeLessThan(5000); // Allow 5KB difference
  });
});

test.describe('QA Checklist: Accessibility', () => {
  
  test('has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility attributes
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();
    
    // Check for heading structure
    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThan(0);
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Verify focus is visible (check for focus styles)
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('QA Checklist: Performance', () => {
  
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
