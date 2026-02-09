# PDF Export Testing Guide - Task 7-276

## Quick Test

### Setup
```bash
cd ~/Documents/skillsync-recruitos
npm run dev
```

### Test URLs
- **Shared Profile Report**: http://localhost:3000/report/testpdf001
- **User Profile Report**: Requires navigating through the app

## Manual Testing Checklist

### 1. Light Mode PDF Export

**Steps:**
1. Ensure your browser/system is in **light mode**
2. Navigate to: http://localhost:3000/report/testpdf001
3. Click "Export PDF" button (or Ctrl/Cmd+P)
4. Review the print preview

**Expected Results:**
- ✅ White background throughout
- ✅ Dark text (#1f2937) clearly readable
- ✅ Light gray cards (#f9fafb) with subtle borders
- ✅ Score ring shows colored score (87 in blue)
- ✅ Green flags section: light green background (#ecfdf5)
- ✅ Red flags section: light red background (#fef2f2)
- ✅ Charts (radar) render with proper colors
- ✅ No toolbar or "Export PDF" button visible
- ✅ Icons and badges clearly visible
- ✅ No shadows or transparency effects

**Common Issues to Check:**
- ❌ Dark background bleeding through
- ❌ Light text on white background (unreadable)
- ❌ Missing or invisible borders
- ❌ Charts with wrong colors
- ❌ Toolbar still visible

---

### 2. Dark Mode PDF Export

**Steps:**
1. Enable **dark mode** in your browser/OS
   - Chrome: `chrome://settings/appearance`
   - macOS: System Preferences > General > Appearance
   - Windows: Settings > Personalization > Colors
2. Refresh the page: http://localhost:3000/report/testpdf001
3. Verify the **screen** shows dark theme (dark background, light text)
4. Click "Export PDF" button (or Ctrl/Cmd+P)
5. Review the print preview

**Expected Results:**
- ✅ **Screen shows dark theme** (bg-[#0a0a0f], light text)
- ✅ **Print preview shows LIGHT theme** (white background, dark text)
- ✅ PDF output is **identical** to light mode test
- ✅ No dark theme bleeding into print

**This is the critical test:** The PDF must ignore the user's theme preference.

---

### 3. Profile Report Page (Alternative Test)

This page requires a candidate in localStorage (accessed through the main app flow).

**Steps:**
1. Navigate through the app to create/view a candidate
2. Go to the profile report page
3. Test print functionality in both themes
4. Verify similar print optimization as the shared report

---

## Screenshot Checklist

For documentation, capture the following:

### Before Fix (if available from git history)
- [ ] Light mode: Screen view
- [ ] Light mode: PDF preview showing dark background issue
- [ ] Dark mode: Screen view
- [ ] Dark mode: PDF preview showing dark background issue

### After Fix
- [ ] Light mode: Screen view
- [ ] Light mode: PDF preview (clean, white background)
- [ ] Dark mode: Screen view
- [ ] Dark mode: PDF preview (clean, white background, identical to light)

### Screenshot Tips
- Use browser's Print Preview (Ctrl/Cmd+P)
- Capture full page or key sections
- Show the contrast between screen and print views
- Highlight the score ring, green/red flags sections

---

## Automated Testing (Future)

### Playwright Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('PDF Export', () => {
  test('renders correctly in light mode', async ({ page }) => {
    await page.goto('http://localhost:3000/report/testpdf001');
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
    });
    
    // Verify PDF was generated
    expect(pdf.length).toBeGreaterThan(0);
    
    // Additional assertions...
  });

  test('renders correctly in dark mode', async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('http://localhost:3000/report/testpdf001');
    
    // Verify screen shows dark theme
    const bgColor = await page.evaluate(() => {
      const el = document.querySelector('.report-page');
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toContain('10, 10, 15'); // bg-[#0a0a0f]
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
    });
    
    // PDF should be identical to light mode
    expect(pdf.length).toBeGreaterThan(0);
  });

  test('hides toolbar in print view', async ({ page }) => {
    await page.goto('http://localhost:3000/report/testpdf001');
    
    // Check that toolbar is visible on screen
    const toolbar = page.locator('.no-print');
    await expect(toolbar).toBeVisible();
    
    // In print media, it should be hidden
    await page.emulateMedia({ media: 'print' });
    await expect(toolbar).toBeHidden();
  });
});
```

---

## Browser Compatibility

Test in the following browsers:

- [ ] **Chrome/Edge** (Chromium) - Primary target
- [ ] **Firefox** - Print CSS may render slightly differently
- [ ] **Safari** - macOS specific print behavior

### Known Differences
- Some browsers may handle `print-color-adjust: exact` differently
- SVG rendering in PDFs can vary
- Shadow and gradient removal is handled differently

---

## Common Issues & Troubleshooting

### Issue: Dark background still visible in PDF
**Solution:**
- Check that `!important` is used in all CSS overrides
- Verify `print-color-adjust: exact` is set
- Ensure no inline styles are overriding the print CSS

### Issue: Charts not rendering correctly
**Solution:**
- SVG elements need explicit fill/stroke colors
- Check Recharts configuration for print media

### Issue: Page breaks in wrong places
**Solution:**
- Use `.print-avoid` class on sections that shouldn't be split
- Use `.print-break` for explicit page breaks

### Issue: Images missing or broken
**Solution:**
- Ensure images have proper paths
- Check that images aren't hidden by CSS filters
- Verify `page-break-inside: avoid` on image containers

---

## Performance Considerations

- PDF generation should be < 3 seconds for typical reports
- Large reports (>10 pages) may take longer
- Print CSS is only parsed when needed (no performance impact on screen view)

---

## Documentation

After testing, update:
- [ ] PDF_EXPORT_FIX.md with test results
- [ ] Add screenshots to docs folder
- [ ] Update Linear issue 7-276 with findings
- [ ] Create PR description with before/after examples

---

## Sign-off

Once all tests pass:

**Tested by:** _____________  
**Date:** _____________  
**Browser(s):** _____________  
**Result:** ✅ Pass / ❌ Fail  
**Notes:** _____________
