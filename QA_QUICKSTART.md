# QA Quick Start Guide

**For developers:** How to test your features before creating a PR

---

## 🎯 The Golden Rule

**If any QA checklist item is unchecked → NOT ready to ship.**

---

## 🚀 Quick QA Workflow (5 minutes)

### Step 1: Run Automated Checks
```bash
npm run qa:check
```

This runs:
- ✅ TypeScript type checking
- ✅ ESLint linting
- ✅ Production build test
- ✅ Playwright E2E tests

**If this fails, fix errors before proceeding.**

---

### Step 2: Visual Testing with DevToolbar

The DevToolbar appears automatically in development mode (bottom-right corner).

1. **Theme Testing:**
   - Click Sun/Moon icon to toggle light/dark mode
   - Verify your feature looks good in both themes

2. **Responsive Testing:**
   - Click Smartphone icon (375px mobile)
   - Click Tablet icon (768px tablet)
   - Click Monitor icon (full desktop)
   - Verify layout adapts properly

3. **Console Error Check:**
   - Look at the error counter
   - Should show "✅ No console errors"
   - If errors appear, fix them!

---

### Step 3: Manual Feature Testing

Test your feature's core functionality:

- [ ] **Happy path works** - Basic usage flows smoothly
- [ ] **Empty states** - What happens with no data?
- [ ] **Error states** - What happens when something fails?
- [ ] **Loading states** - Are loaders shown during async operations?
- [ ] **Navigation** - Can you get to the feature? Can you get back?

---

### Step 4: Export Testing (if applicable)

If your feature involves exports:

1. **PDF Export:**
   ```
   - Click export button
   - Check print preview (Cmd/Ctrl+P)
   - Verify both light and dark mode
   - Ensure no broken CSS
   ```

2. **CSV Export:**
   ```
   - Download CSV
   - Open in spreadsheet
   - Verify data format
   ```

---

### Step 5: Create PR with Template

1. Push your branch
2. Create PR on GitHub
3. Template will auto-load
4. **Complete every checkbox**
5. Add screenshots (light mode, dark mode, mobile)
6. Request review

---

## 🛠️ Development Tools

### DevToolbar (`components/DevToolbar.tsx`)

**Features:**
- Theme toggle (Light/Dark)
- Viewport presets (Mobile/Tablet/Desktop)
- Console error counter
- Auto-hides in production

**Usage:** Already included in development builds.

---

### Demo Reset (`npm run demo:reset`)

**When to use:**
- Testing with clean slate
- QA needs fresh demo data
- After messing up local state

**What it does:**
- Clears localStorage
- Resets demo credentials
- Generates sample data
- Creates .env.demo config

**Usage:**
```bash
npm run demo:reset
# Then visit: http://localhost:3000?demo=true
# Login: demo@recruitos.com / demo123
```

---

### Demo Reset Button (`components/DemoResetButton.tsx`)

**In-app demo reset:**
```tsx
import { DemoResetButton } from "@/components/DemoResetButton";

<DemoResetButton />
```

Click the button → instant demo reset → redirects to login.

---

## 📋 Full QA Checklist (Copy-Paste)

Before creating your PR, verify:

### Visual
- [ ] ✅ Light mode works
- [ ] ✅ Dark mode works
- [ ] ✅ Mobile viewport (375px) works
- [ ] ✅ Tablet viewport (768px) works

### Functional
- [ ] ✅ Happy path works
- [ ] ✅ Empty states handled
- [ ] ✅ Error states handled
- [ ] ✅ Loading states shown
- [ ] ✅ Navigation works (to/from feature)

### Technical
- [ ] ✅ No console errors
- [ ] ✅ TypeScript passes (`npm run type-check`)
- [ ] ✅ Linting passes (`npm run lint`)
- [ ] ✅ Build succeeds (`npm run build`)
- [ ] ✅ E2E tests pass (`npm run test:e2e`)

### Exports (if applicable)
- [ ] ✅ PDF exports correctly (print preview checked)
- [ ] ✅ CSV exports correctly (opened in spreadsheet)

### Documentation
- [ ] ✅ Screenshots added to PR
- [ ] ✅ README updated if needed
- [ ] ✅ Inline comments for complex logic

---

## 🎬 Video Tutorial (Coming Soon)

We'll record a 5-minute walkthrough showing:
1. Running qa:check
2. Using DevToolbar
3. Filling out PR template
4. Getting PR approved

---

## 🐛 Common Issues

### "Console errors but I can't find them"
- Open DevTools (F12)
- Go to Console tab
- Filter by Errors (red button)
- Fix each error

### "Dark mode looks broken"
- Check Tailwind classes use `dark:` prefix
- Verify no hardcoded colors
- Test with DevToolbar toggle

### "Mobile layout is squished"
- Use responsive Tailwind classes (`sm:`, `md:`, `lg:`)
- Test with DevToolbar viewport presets
- Check padding/margins

### "Build fails but dev works"
- Likely TypeScript error
- Run `npm run type-check` to see specific errors
- Fix type issues

### "E2E tests fail locally"
- Ensure dev server is running
- Check test environment variables
- Review Playwright logs

---

## 📚 Learn More

- **Full QA Strategy:** `docs/QA_STRATEGY.md`
- **PR Template:** `.github/pull_request_template.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Playwright Docs:** https://playwright.dev

---

## ✅ Remember

**Quality is everyone's responsibility.**

Taking 5 minutes to run QA checks saves hours of bug fixing and user frustration later.

**Ship fast. Ship quality. 🚀**
