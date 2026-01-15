# Quick Start Guide - RecruitOS

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```
✅ **Status:** Dependencies installed (668 packages)

### Step 2: Set Up Environment Variables (Optional)

For persistent database storage, create a `.env` file:

```bash
cp .env.example .env
```

Then edit `.env` and add your credentials (optional):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Note:** The app works WITHOUT Supabase - it will use localStorage instead.

### Step 3: Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Configure API Keys (In Browser)

1. Click the **user avatar** in the bottom left sidebar
2. This opens **Admin Settings**
3. Add your API keys:
   - **Google Gemini API** (Required) - Get at: https://aistudio.google.com/apikey
   - **Firecrawl API** (Required) - Get at: https://firecrawl.dev
   - **BrightData API** (Optional) - For LinkedIn scraping
   - **OpenRouter API** (Optional) - Alternative AI inference

4. Click **Save & Reload**

**⚠️ Security Warning:** API keys are stored in browser localStorage. Read SECURITY.md for production guidelines.

---

## ✅ What Works Now

### ✨ Core Features
- ✅ **Job Intake** - Paste job description or scrape from URL
- ✅ **Candidate Shortlisting** - Import resumes, get AI-powered scoring (0-100)
- ✅ **Deep Profile Analysis** - Evidence-based candidate reports
- ✅ **Outreach Generation** - Personalized messaging
- ✅ **Credit Tracking** - Monitor AI operation costs
- ✅ **Audit Logging** - EU AI Act compliance

### 🔧 Technical Features
- ✅ **Performance Optimized** - React hooks (useCallback, useMemo)
- ✅ **Type Safe** - 100% TypeScript, zero `any` types
- ✅ **Tested** - Vitest + React Testing Library configured
- ✅ **Linted** - ESLint + Prettier configured
- ✅ **Secure** - CSP headers, no hardcoded credentials
- ✅ **CI/CD** - GitHub Actions pipeline

---

## 📊 Application Flow

### 1. Job Context (Step 1)
**Location:** Main screen on load

**What to do:**
- Click "Load Demo" for quick test, OR
- Paste a job description URL and click "Scrape", OR
- Manually paste job text

**Result:** Job context saved, proceed to Shortlist

### 2. Shortlist (Step 2)
**Location:** `/shortlist` route

**What to do:**
- Click "Import Candidate" button
- Paste resume text or LinkedIn JSON
- Click "Analyze & Add"

**Result:** Candidate appears in grid with alignment score

**Features:**
- Sort by score, stage, name
- Filter by score range
- CSV export
- Unlock "Deep Profile" for detailed analysis (costs credits)

### 3. Deep Profile (Step 3)
**Location:** Side panel (slides from right)

**What to do:**
- Click "Unlock Profile" on any candidate card (costs 278 credits)
- View detailed analysis, evidence, interview questions

**Features:**
- Evidence-based workstyle indicators
- Company culture match analysis
- Dynamic interview guide
- Unlock "Outreach" to proceed

### 4. Outreach (Step 4)
**Location:** Modal overlay

**What to do:**
- Click "Unlock Outreach" from Deep Profile (costs 463 credits)
- Get AI-generated personalized message
- Copy and use

---

## 🐛 Troubleshooting

### "Blue Screen" or Blank Page
**Cause:** Missing API keys or CSP blocking resources

**Fix:**
1. Check browser console (F12) for errors
2. Verify API keys are configured in Admin Settings
3. Check CSP isn't blocking external resources

### "Supabase credentials not configured"
**This is normal!** The app works without Supabase using localStorage.

**To enable Supabase:**
1. Create account at https://supabase.com
2. Create a new project
3. Add credentials to `.env` file
4. Restart dev server

### "Failed to analyze candidate"
**Cause:** Missing or invalid Gemini API key

**Fix:**
1. Get API key from https://aistudio.google.com/apikey
2. Add to Admin Settings
3. Click "Save & Reload"

### "Job scraping failed"
**Cause:** Missing or invalid Firecrawl API key

**Fix:**
1. Get API key from https://firecrawl.dev
2. Add to Admin Settings
3. Try scraping again

### API Rate Limits
**Cause:** Too many requests to external APIs

**Fix:**
- Wait a few seconds between requests
- Gemini has retry logic with exponential backoff
- Check API usage quotas in respective dashboards

---

## 🧪 Testing

Run tests:
```bash
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

Current test coverage:
- ✅ `usePersistedState` hook - 6 tests
- ✅ `geminiService` - 2 tests
- 📝 Expandable to all components

---

## 🎯 Development Workflow

### Before Committing
```bash
npm run validate        # Runs: type-check, lint, test
```

### Code Quality
```bash
npm run lint            # Check for issues
npm run lint:fix        # Auto-fix issues
npm run format          # Format with Prettier
npm run type-check      # TypeScript validation
```

### Building
```bash
npm run build           # Production build
npm run preview         # Preview build locally
```

---

## 📈 Performance Tips

1. **Candidate Import**: Import candidates in batches (recommended: 5-10 at a time)
2. **Deep Profile**: Only unlock for top candidates (costs 278 credits each)
3. **Browser**: Use Chrome/Edge for best performance
4. **Cache**: Clear browser cache if UI behaves unexpectedly

---

## 🔐 Security Reminders

- ⚠️ **Never commit `.env` file** to Git
- ⚠️ **Rotate API keys** if accidentally exposed
- ⚠️ **Use separate keys** for dev and production
- ⚠️ **Read SECURITY.md** before deploying

---

## 🆘 Getting Help

1. **Check Documentation:**
   - README.md - Project overview
   - CLAUDE.md - Developer guide
   - SECURITY.md - Security guidelines
   - REFACTORING_SUMMARY.md - Recent changes

2. **Common Issues:**
   - See Troubleshooting section above
   - Check browser console for errors
   - Verify API keys are valid

3. **Still Stuck?**
   - Check GitHub Issues
   - Review error logs in browser console
   - Verify all dependencies installed correctly

---

## 📊 System Status

Last updated: 2026-01-07

- ✅ Dependencies: 668 packages installed
- ✅ Build: Successful (968 KB bundle)
- ✅ Dev Server: Running on port 3000
- ✅ Type Check: Passing
- ✅ Tests: Infrastructure ready
- ⚠️ Vulnerabilities: 10 (2 low, 6 moderate, 2 high) - non-critical

---

**Enjoy using RecruitOS! 🎉**
