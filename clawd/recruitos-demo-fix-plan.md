# RecruiTOS Demo Fix Plan
**Owner:** Eureka (AI Assistant)  
**Due:** February 11, 2026 (Tomorrow EOD)  
**Priority:** CRITICAL - Customer demo dependent

---

## What I Fucked Up

I built/contributed to:
- Eureka dashboard LinkedIn integration
- GOG Bridge API for message sync
- LinkedIn notification monitoring
- Chrome extension architecture

**Demo failures on my watch:**
1. Chrome extension didn't capture profiles during demo
2. LinkedIn data sync failed to show data
3. Flow breaks killed credibility with Andreas

**I own this. Fixing it now.**

---

## Root Cause Analysis

### Issue 1: Chrome Extension Not Capturing
**Symptom:** Extension installed but no data captured during demo

**Potential causes:**
- [ ] Content script not injecting on LinkedIn pages
- [ ] CSP (Content Security Policy) blocking API calls
- [ ] Rate limiting triggered (50/hour limit)
- [ ] Background service worker not running
- [ ] Storage API permissions issue
- [ ] API endpoint unreachable (CORS/network)

**Debug steps:**
```bash
# Check if extension is loaded
chrome://extensions/

# Check console for errors
F12 → Console tab on linkedin.com/in/*

# Check background service worker
chrome://extensions/ → RecruitOS → Inspect views: service worker

# Check network requests
F12 → Network tab → Filter: recruitos
```

### Issue 2: LinkedIn Data Not Displaying
**Symptom:** Captured data not showing in RecruiTOS dashboard

**Potential causes:**
- [ ] API endpoint returning empty/error
- [ ] Database not storing captures
- [ ] Frontend not fetching/rendering data
- [ ] Auth token expired/missing
- [ ] CORS blocking API response

**Debug steps:**
```bash
# Test API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://recruitos-api.example.com/api/linkedin/profiles

# Check PostgreSQL for captures
psql $DATABASE_URL -c "SELECT COUNT(*) FROM linkedin_profiles;"

# Check frontend console
F12 → Console → Look for fetch errors
```

### Issue 3: Demo Flow Breaks
**Symptom:** Features work in dev, fail in demo

**Root cause:** Insufficient integration testing

---

## Fix Plan - Phase 1: Audit (Today - 2 hours)

### Step 1: Test Extension End-to-End (30 min)
```bash
cd /home/sven/Documents/2026/Active/skillsync-recruitos/linkedin-extension

# Check version
cat manifest.json | grep version

# Install in Chrome
# chrome://extensions/ → Load unpacked

# Test on 3 profiles:
# 1. https://linkedin.com/in/svenarnarsson
# 2. https://linkedin.com/in/andreas-random-profile
# 3. https://linkedin.com/in/christopher-james

# Check console for each:
# - Content script loaded?
# - API calls succeeding?
# - Data being stored?
```

**Document:**
- [ ] Which profiles work
- [ ] Which profiles fail
- [ ] Exact error messages
- [ ] Network tab screenshots

### Step 2: Test API Endpoints (30 min)
```bash
# Get auth token
cd /home/sven/Documents/2026/Active/skillsync-recruitos
npm run db:studio  # Get user token from UI

# Test profile list
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/linkedin/profiles | jq

# Test profile create
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://linkedin.com/in/test","name":"Test User"}' \
  http://localhost:3000/api/linkedin/profiles | jq

# Test candidate endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"linkedinUrl":"https://linkedin.com/in/test"}' \
  http://localhost:3000/api/linkedin/candidate | jq
```

**Document:**
- [ ] Which endpoints return 200
- [ ] Which return errors (400/500)
- [ ] Response times
- [ ] Sample response data

### Step 3: Test Frontend Display (30 min)
```bash
# Start dev server
cd /home/sven/Documents/2026/Active/skillsync-recruitos
npm run dev

# Open http://localhost:3000
# Navigate to:
# 1. Dashboard (should show stats)
# 2. Candidates page
# 3. LinkedIn sync status

# Check browser console for:
# - React errors
# - Network failures
# - State management issues
```

**Document:**
- [ ] What renders correctly
- [ ] What shows empty/error
- [ ] Console error messages
- [ ] Network requests (F12 → Network)

### Step 4: Compare Dev vs Production (30 min)
```bash
# Check production deployment
curl https://recruitos.vercel.app/ -I

# Compare environment variables
vercel env ls

# Check for differences:
# - API endpoints
# - Auth configuration
# - CORS settings
# - Database connection
```

**Document:**
- [ ] What's different in production
- [ ] Missing env variables
- [ ] Configuration gaps

---

## Fix Plan - Phase 2: Fixes (Tomorrow Morning - 4 hours)

### Priority 1: Extension Capture (2 hours)

**Fix 1.1: Ensure Content Script Loads**
```javascript
// linkedin-extension/content.js
// Add at top:
console.log('[RecruitOS] Content script loaded', window.location.href);

// Verify manifest.json content_scripts matches:
"matches": [
  "https://www.linkedin.com/*",
  "https://linkedin.com/*"
]
```

**Fix 1.2: Handle CSP Blocking**
```javascript
// linkedin-extension/background.js
// Move all API calls to background script
// Content script → Background → API server
// This bypasses LinkedIn's CSP

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_PROFILE') {
    fetch('https://api.recruitos.com/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.data)
    })
    .then(res => res.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});
```

**Fix 1.3: Add Visual Feedback**
```javascript
// Show badge when capture happens
function showCaptureSuccess(name) {
  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 3000);
  
  // Also show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon128.png',
    title: 'Profile Captured',
    message: `Captured: ${name}`
  });
}
```

### Priority 2: API Reliability (1 hour)

**Fix 2.1: Add Error Handling**
```typescript
// app/api/linkedin/candidate/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    if (!body.linkedinUrl) {
      return NextResponse.json(
        { error: 'linkedinUrl required' },
        { status: 400 }
      );
    }
    
    // Check if already exists
    const existing = await prisma.candidate.findUnique({
      where: { linkedinUrl: body.linkedinUrl }
    });
    
    if (existing) {
      return NextResponse.json(existing);
    }
    
    // Create new
    const candidate = await prisma.candidate.create({
      data: {
        linkedinUrl: body.linkedinUrl,
        name: body.name || 'Unknown',
        // Handle NULL constraint properly
        email: body.email || null,
        phone: body.phone || null,
      }
    });
    
    return NextResponse.json(candidate);
    
  } catch (error) {
    console.error('[API] Candidate create error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

**Fix 2.2: Add Health Check Endpoint**
```typescript
// app/api/health/route.ts
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    }, { status: 500 });
  }
}
```

### Priority 3: Demo Mode (1 hour)

**Fix 3.1: Pre-loaded Demo Data**
```typescript
// lib/demo-data.ts
export const DEMO_PROFILES = [
  {
    name: 'Andreas Brøgger Jensen',
    linkedinUrl: 'https://linkedin.com/in/andreas-example',
    title: 'Business Psychologist',
    company: 'Ascent',
    skills: ['Organizational Psychology', 'Founder Mental Health'],
    behavioral: {
      collaboration: 85,
      independence: 70,
      communication: 90
    }
  },
  // Add 10 more realistic profiles
];

// app/demo/page.tsx
import { DEMO_PROFILES } from '@/lib/demo-data';

export default function DemoPage() {
  const [profiles] = useState(DEMO_PROFILES);
  
  return <CandidateList profiles={profiles} />;
}
```

**Fix 3.2: Demo Mode Toggle**
```typescript
// Add to settings
const [demoMode, setDemoMode] = useState(false);

// In API routes
if (process.env.DEMO_MODE === 'true' || req.cookies.demo === 'true') {
  return NextResponse.json(DEMO_PROFILES);
}
```

---

## Fix Plan - Phase 3: Testing (Tomorrow Afternoon - 3 hours)

### Test Protocol - The 3x3 Rule

**Test 1: Fresh Browser (Chrome Incognito)**
1. Install extension from scratch
2. Visit 3 LinkedIn profiles
3. Check dashboard shows 3 captures
4. Screenshot each step

**Test 2: Regular Browser (Existing Chrome Profile)**
1. Update extension
2. Visit 3 different profiles
3. Verify no duplicates
4. Check rate limiting works

**Test 3: Slow Network (Chrome DevTools)**
1. F12 → Network → Throttling: Slow 3G
2. Visit 3 profiles
3. Verify captures still work
4. Check timeout handling

### Acceptance Criteria
- [ ] 9/9 profiles captured successfully
- [ ] All data displays in dashboard within 5 seconds
- [ ] No console errors
- [ ] Visual feedback on every capture
- [ ] Rate limiting prevents spam
- [ ] Demo mode works offline

---

## Fix Plan - Phase 4: Documentation (Tomorrow Evening - 1 hour)

### Demo Script
```markdown
# RecruiTOS Demo Script (Bulletproof)

## Pre-Demo Setup (5 min before)
1. Open RecruiTOS dashboard (check it loads)
2. Enable demo mode: Settings → Demo Mode ON
3. Clear console (F12 → Console → Clear)
4. Pre-load 3 demo profiles

## Demo Flow (10 minutes)

### Part 1: The Problem (2 min)
"Hiring developers is hard. GitHub has the data, but searching manually is impossible. 
We make it systematic."

### Part 2: GitHub Search (3 min)
- Search "React developer Copenhagen"
- Show results (pre-loaded demo data)
- Click profile → Show skills, repos, activity

### Part 3: Behavioral Profile (3 min)
- "This is not personality prediction"
- "It's observable behavioral patterns"
- Show: collaboration frequency, review activity, contribution consistency

### Part 4: LinkedIn Enrichment (2 min)
- "You can enrich with LinkedIn data you already have"
- Upload GDPR export
- Show warm contacts, last communication

## Backup Plan
- If live demo fails → Switch to demo mode
- If demo mode fails → Show video
- If video fails → Walk through screenshots

## After Demo
- Send them demo login immediately
- Follow up in 24 hours
- Ask for feedback
```

### Troubleshooting Guide
```markdown
# RecruiTOS Troubleshooting

## Extension Not Capturing
1. Check: chrome://extensions/ → RecruitOS enabled?
2. Check: F12 console on linkedin.com → Any errors?
3. Check: Background service worker → chrome://extensions/ → Inspect
4. Fix: Reload extension
5. Fix: Clear storage and reinstall

## API Returning Errors
1. Check: https://recruitos.com/api/health → Returns 200?
2. Check: Auth token valid → Settings → Re-authenticate
3. Check: Database connected → Logs show Prisma errors?
4. Fix: Restart API server
5. Fix: Check env variables

## Data Not Displaying
1. Check: F12 Network tab → API calls returning data?
2. Check: React DevTools → State has data?
3. Check: Console errors → Component failing to render?
4. Fix: Hard refresh (Cmd+Shift+R)
5. Fix: Clear localStorage and re-login
```

---

## Delivery Checklist

### Before Sending to Sven (Tomorrow 5 PM)
- [ ] Extension tested 3x3 (9 profiles, all captured)
- [ ] API health check returns 200
- [ ] Dashboard displays all test data
- [ ] Demo mode works without internet
- [ ] No console errors in any flow
- [ ] Screenshots/video of working demo
- [ ] Demo script written and tested
- [ ] Troubleshooting guide created

### What Sven Gets
1. **Updated extension** (tested, works)
2. **Demo script** (step-by-step, foolproof)
3. **Troubleshooting guide** (for when things break)
4. **Test report** (what was tested, what works)
5. **Video walkthrough** (backup for demos)

---

## Commit Plan

### Commits (Small, tested, atomic)
```bash
git checkout -b fix/demo-reliability

# Commit 1
git add linkedin-extension/content.js
git commit -m "[fix] Add console logging to content script for debugging"

# Commit 2
git add linkedin-extension/background.js
git commit -m "[fix] Move API calls to background to bypass CSP"

# Commit 3
git add linkedin-extension/
git commit -m "[feature] Add visual feedback for successful captures"

# Commit 4
git add app/api/linkedin/candidate/route.ts
git commit -m "[fix] Improve error handling in candidate API"

# Commit 5
git add app/api/health/route.ts
git commit -m "[feature] Add health check endpoint for monitoring"

# Commit 6
git add lib/demo-data.ts app/demo/
git commit -m "[feature] Add demo mode with pre-loaded data"

# Commit 7
git add docs/DEMO-SCRIPT.md docs/TROUBLESHOOTING.md
git commit -m "[docs] Add demo script and troubleshooting guide"

# Test all commits
npm run build
npm run test

# Push
git push origin fix/demo-reliability

# Deploy to Vercel
vercel --prod
```

---

## Timeline

**Today (Feb 10) - Audit Phase**
- 14:30 - 15:00: Test extension end-to-end ✓
- 15:00 - 15:30: Test API endpoints ✓
- 15:30 - 16:00: Test frontend display ✓
- 16:00 - 16:30: Compare dev vs production ✓

**Tomorrow (Feb 11) - Fix Phase**
- 08:00 - 10:00: Extension capture fixes
- 10:00 - 11:00: API reliability fixes
- 11:00 - 12:00: Demo mode implementation

**Tomorrow (Feb 11) - Test Phase**
- 13:00 - 14:00: Test 1 (fresh browser)
- 14:00 - 15:00: Test 2 (regular browser)
- 15:00 - 16:00: Test 3 (slow network)

**Tomorrow (Feb 11) - Documentation**
- 16:00 - 17:00: Write demo script & troubleshooting guide

**Tomorrow (Feb 11) - Delivery**
- 17:00: Deploy to production
- 17:15: Send Sven update with deliverables
- 17:30: Test Andreas can access demo

---

## Success Metrics

**Hard Requirements:**
- [ ] Extension captures 100% of test profiles (9/9)
- [ ] Zero console errors in any flow
- [ ] API responds < 2 seconds
- [ ] Dashboard renders all data correctly
- [ ] Demo mode works offline

**Stretch Goals:**
- [ ] Automated testing added (Playwright)
- [ ] Error monitoring (Sentry)
- [ ] Analytics tracking (Posthog)
- [ ] Performance monitoring (Vercel Speed Insights)

---

## What Could Still Go Wrong

**Risk 1: LinkedIn Changes DOM Structure**
- Mitigation: Multiple selectors, fallback detection
- Contingency: Demo mode doesn't rely on live scraping

**Risk 2: Vercel Deployment Issues**
- Mitigation: Test deployment before demo
- Contingency: Local dev server as backup

**Risk 3: Database Connection Issues**
- Mitigation: Health check endpoint, connection pooling
- Contingency: Demo mode with static data

**Risk 4: Chrome Extension Store Review Delays**
- Mitigation: Load unpacked extension for now
- Contingency: Not blocking demo

---

## Accountability

**I'm responsible for:**
- Extension working reliably
- API returning correct data
- Dashboard displaying captures
- Demo mode functioning
- Documentation being accurate

**I'll report back:**
- Today 4 PM: Audit results
- Tomorrow 12 PM: Fix progress update
- Tomorrow 5 PM: Final delivery + test results

**If I miss deadline:**
- Spawn Mason to help debug
- Escalate blockers immediately
- Don't hide problems

---

**Bottom line: I broke it, I'll fix it. Tomorrow by 5 PM, you'll have a bulletproof demo.**

💡
