# QA Testing Strategy

**Status:** ✅ Implemented  
**Owner:** Engineering Team  
**Last Updated:** 2026-01-29

---

## 🎯 TL;DR

Features ship tested, not "working but obviously broken."

**Rule:** If any QA checklist item is unchecked → NOT ready to ship.

---

## 🐛 Problem Statement

Features were shipping with obvious bugs that should have been caught before deployment:
- PDF exports with broken CSS
- Button sizing issues
- Dark mode rendering problems
- Mobile viewport breaking
- Console errors in production

**Root Cause:** No systematic pre-ship quality checks.

---

## ✅ Definition of "Tested"

A feature is **NOT ready to ship** unless:

### Visual Quality
- [x] ✅ Light mode works (all elements visible, properly styled)
- [x] ✅ Dark mode works (all elements visible, properly styled)
- [x] ✅ Mobile viewport works (responsive, 375px+)
- [x] ✅ Tablet viewport works (layout adapts, 768px+)

### Export Quality
- [x] ✅ PDF exports render correctly (no broken CSS, proper styling)
- [x] ✅ CSV exports work (proper formatting)
- [x] ✅ Print preview matches expected output

### Navigation & UX
- [x] ✅ Navigation works (can get to feature, can get back)
- [x] ✅ Empty states handled (appropriate messages shown)
- [x] ✅ Error states handled (user-friendly error messages)
- [x] ✅ Loading states shown (indicators during async operations)

### Technical Quality
- [x] ✅ No console errors (browser console clean)
- [x] ✅ No console warnings (dev warnings resolved)
- [x] ✅ TypeScript passes (`npm run type-check`)
- [x] ✅ Linting passes (`npm run lint`)
- [x] ✅ Build succeeds (`npm run build`)

---

## 🛠️ Tools Implemented

### 1. PR Template with Mandatory Checklist
**Location:** `.github/pull_request_template.md`

Every PR now includes a comprehensive QA checklist that MUST be completed before merging.

**Usage:**
1. Create PR on GitHub
2. Template auto-loads
3. Complete all checklist items
4. Provide screenshots
5. Request review only when all items checked

### 2. Development Toolbar
**Location:** `components/DevToolbar.tsx`

Provides instant access to QA tools:
- **Theme toggle:** Switch between light/dark mode
- **Viewport presets:** Mobile (375px), Tablet (768px), Desktop
- **Console error counter:** Real-time error tracking
- **Auto-hide in production**

**Usage:**
```tsx
import { DevToolbar } from "@/components/DevToolbar";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <DevToolbar />
      </body>
    </html>
  );
}
```

### 3. Demo Reset System
**Components:**
- `scripts/reset-demo.ts` - CLI script
- `components/DemoResetButton.tsx` - UI component

**CLI Usage:**
```bash
npm run demo:reset
```

**UI Usage:**
```tsx
import { DemoResetButton } from "@/components/DemoResetButton";

<DemoResetButton />
```

### 4. Playwright E2E Tests
**Location:** `tests/`

Run with:
```bash
npm run test:e2e           # Headless
npm run test:e2e:ui        # Interactive UI
npm run test:e2e:headed    # Headed mode
```

---

## 📋 Pre-Ship Checklist (Quick Reference)

Before marking a task as "Done" in Linear:

1. **Run QA checks:**
   ```bash
   npm run type-check    # TypeScript
   npm run lint          # ESLint
   npm run build         # Production build
   npm run test:e2e      # E2E tests
   ```

2. **Visual checks:**
   - Open DevToolbar
   - Toggle light/dark mode
   - Test mobile/tablet/desktop viewports
   - Check console error counter (should be 0)

3. **Manual testing:**
   - Navigate to the feature
   - Test happy path
   - Test error states
   - Test empty states
   - Try on real mobile device (if possible)

4. **Documentation:**
   - Take screenshots (light/dark mode)
   - Update README if needed
   - Add inline code comments for complex logic

5. **PR process:**
   - Fill out PR template completely
   - All QA checklist items checked
   - Screenshots attached
   - Tests pass in CI

---

## 🚀 Quick Wins

### PDF Preview Before Export
```tsx
// Add preview button before export
<Button onClick={() => window.print()}>
  Preview PDF
</Button>
```

### Mobile Viewport Toggle (DevToolbar)
Use the DevToolbar smartphone icon to instantly test mobile layout.

### Visual Diff for Exports
Use Playwright to capture snapshots:
```typescript
await page.screenshot({ path: 'before.png' });
// Make changes
await page.screenshot({ path: 'after.png' });
```

---

## 🎯 Future: Automated Visual Testing

### Playwright Visual Regression
```typescript
import { test, expect } from '@playwright/test';

test('profile page visual regression', async ({ page }) => {
  await page.goto('/profile/test-user');
  
  // Light mode snapshot
  await expect(page).toHaveScreenshot('profile-light.png');
  
  // Dark mode snapshot
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page).toHaveScreenshot('profile-dark.png');
});
```

### PDF Visual Testing
```typescript
test('PDF export visual test', async ({ page }) => {
  await page.goto('/report/testpdf001');
  
  const pdf = await page.pdf({
    format: 'Letter',
    printBackground: true,
  });
  
  // Compare against baseline
  expect(pdf).toMatchSnapshot('report-export.pdf');
});
```

---

## 📊 Metrics

Track these metrics over time:

- **Bug escape rate:** Bugs found in production vs caught in QA
- **PR cycle time:** Time from PR open to merge
- **Test coverage:** % of code covered by tests
- **Console error rate:** Errors per 1000 page views

**Goal:** <5% bug escape rate, <24hr PR cycle time.

---

## 🔄 Process Integration

### Developer Workflow
1. **Before starting:** Pull latest, run `npm install`
2. **During development:** Use DevToolbar for real-time checks
3. **Before PR:** Complete local QA checklist
4. **Create PR:** Use template, fill all sections
5. **After review:** Address feedback, re-check QA items
6. **Before merge:** Ensure CI passes, all checks green

### Reviewer Workflow
1. **Check PR template:** All QA items checked?
2. **Pull branch:** Test locally
3. **Verify claims:** Screenshots match actual behavior?
4. **Test edge cases:** Try to break it
5. **Approve or request changes:** Be specific

---

## 🎓 Training & Onboarding

New team members should:
1. Read this document
2. Review PR template
3. Install and use DevToolbar
4. Run demo reset to see sample data
5. Practice QA checklist on a small feature
6. Pair with experienced developer on first PR

---

## 📖 Reference Links

- **PR Template:** `.github/pull_request_template.md`
- **DevToolbar:** `components/DevToolbar.tsx`
- **Demo Reset:** `scripts/reset-demo.ts`
- **Playwright Docs:** https://playwright.dev
- **Testing Guide:** `TESTING_GUIDE.md`

---

## ✅ Sign-off

**Implementation Status:**
- [x] PR template created
- [x] DevToolbar implemented
- [x] Demo reset system created
- [x] Documentation complete
- [x] Team acknowledged process

**Team Acknowledgment:**
- [ ] Engineering lead reviewed _(pending)_
- [ ] Team demo scheduled _(pending)_
- [ ] Process adopted in sprint _(pending)_

---

## 📞 Questions?

Contact the engineering lead or open a discussion in Linear.

**Remember:** Shipping fast is good. Shipping broken is not. This process helps us do both: ship fast AND ship quality. 🚀
