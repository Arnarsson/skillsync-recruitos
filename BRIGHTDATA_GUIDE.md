# BrightData LinkedIn Scraping Guide

## Current Status

**Dataset ID:** `gd_l1viktl72bvl7bjuj0`

**What Works:**
- ✅ Basic profile info (name, location)
- ✅ Education summary
- ✅ Certifications (2+ items)
- ✅ Courses (1+ items)
- ✅ Professional network context ("People Also Viewed")
- ✅ Avatar and LinkedIn ID
- ✅ Character extraction: ~1073 characters

**What's Missing (Critical for Technical Recruiting):**
- ❌ Work experience (returns `null`)
- ❌ Skills (returns `null`)
- ❌ About/summary section (returns `null`)
- ❌ Position/headline (returns `null`)

**Impact:**
- Match scores: 10-20% instead of 50-80%
- AI analysis: "no professional experience provided"
- Persona: "Unknown - Insufficient Data"
- **Result:** Dataset is insufficient for technical recruiting needs

---

## Understanding the Problem

The current dataset `gd_l1viktl72bvl7bjuj0` appears to be a **"lite" or "basic" LinkedIn dataset** that only extracts:
- Public profile metadata
- Educational background
- Certifications and courses
- Network suggestions

It **does NOT extract:**
- Full work experience history (job titles, companies, dates, descriptions)
- Skills list
- About/summary sections
- Current position/headline

For technical recruiting, these missing fields are **critical** because:
1. **Experience** - Validates years of experience, seniority level, tech stack exposure
2. **Skills** - Confirms technical proficiency (React, TypeScript, AWS, etc.)
3. **About** - Reveals communication style, values, career goals

Without these fields, the AI cannot:
- Assess technical fit for roles
- Verify experience requirements
- Match skills to job requirements
- Generate accurate psychographic personas

---

## Step 1: Access BrightData Dashboard

### Login to BrightData
1. Go to [https://brightdata.com](https://brightdata.com)
2. Click "Sign In" (top-right)
3. Enter your account credentials
4. Navigate to **Datasets** section in the left sidebar

### Locate Your Dataset
1. In the Datasets dashboard, find dataset ID: `gd_l1viktl72bvl7bjuj0`
2. Click on the dataset to view its configuration
3. Look for **"Dataset Schema"** or **"Available Fields"** section

---

## Step 2: Verify Current Dataset Capabilities

### Check Dataset Schema
In your dataset configuration, verify if the following fields are **included** or **excluded**:

**Critical Fields (Currently Missing):**
```
experience / positions          ❌ Currently: null
  ├─ title
  ├─ company
  ├─ start_date / started_on
  ├─ end_date / ended_on
  └─ description

skills / skill_list             ❌ Currently: null

about / summary / bio           ❌ Currently: null

position / headline / title     ❌ Currently: null
```

**Available Fields (Currently Working):**
```
name / full_name                ✅ Working
location / city / country       ✅ Working
education                       ✅ Working
certifications                  ✅ Working
courses                         ✅ Working
people_also_viewed              ✅ Working
avatar                          ✅ Working
```

### Dataset Type Identification

**If your dataset is labeled as:**
- "LinkedIn Public Profile Lite"
- "LinkedIn Basic Info"
- "LinkedIn Metadata Only"
- Or any name suggesting "lite" or "basic"

**Then:** Your dataset is fundamentally limited and cannot extract experience/skills data.

**If your dataset is labeled as:**
- "LinkedIn People Profile"
- "LinkedIn Full Profile"
- "LinkedIn Professional Data"

**Then:** Your dataset SHOULD extract full data, and there may be a configuration issue.

---

## Step 3: Upgrade or Switch Dataset

### Option A: Upgrade Current Dataset

If your dashboard shows an **"Upgrade"** or **"Enable Full Fields"** option:

1. Click **"Edit Dataset"** or **"Dataset Settings"**
2. Look for **"Field Selection"** or **"Data Depth"** options
3. Enable the following fields if available:
   - `experience` or `positions`
   - `skills` or `skill_list`
   - `about` or `summary`
   - `headline` or `position`
4. Save changes and test with a new scrape

**Expected Cost Impact:** Full LinkedIn datasets typically cost more per extraction
- Lite: $0.001 - $0.01 per profile
- Full: $0.02 - $0.05 per profile

### Option B: Create New Full LinkedIn Dataset

If upgrading isn't possible, create a new dataset:

1. In BrightData dashboard, click **"Create Dataset"**
2. Select **"LinkedIn People Profile"** (NOT "LinkedIn Lite")
3. Configure with these settings:
   ```
   Dataset Type: LinkedIn People Profile
   Data Collection: Full Profile

   Required Fields:
   ✓ Basic Info (name, location, headline)
   ✓ Work Experience (full history)
   ✓ Education (detailed)
   ✓ Skills (all skills)
   ✓ About Section
   ✓ Certifications
   ✓ Courses
   ✓ Professional Network

   Output Format: JSON
   ```
4. Note the new **Dataset ID** (format: `gd_XXXXXXXXXXXXX`)
5. Update RecruitOS configuration (see Step 4)

### Option C: Check Alternative BrightData Datasets

Common BrightData LinkedIn dataset types:

| Dataset Type | Dataset ID Pattern | Experience | Skills | About | Cost |
|--------------|-------------------|------------|--------|-------|------|
| Public Profile Lite | `gd_l1viktl...` | ❌ | ❌ | ❌ | $ |
| People Profile Basic | `gd_l7wqp5...` | ✅ (limited) | ✅ | ❌ | $$ |
| People Profile Full | `gd_lwyzr3...` | ✅ | ✅ | ✅ | $$$ |
| Professional Data | `gd_lxkpm8...` | ✅ | ✅ | ✅ | $$$ |

**Note:** Exact dataset IDs vary by account. Check your BrightData dashboard for available options.

---

## Step 4: Update RecruitOS Configuration

Once you have a new Dataset ID:

### Update Backend Configuration

**File: `/api/brightdata.ts`**

```typescript
// Line 4: Update dataset ID
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0'; // OLD
const DATASET_ID = 'gd_XXXXXXXXXXXXX';      // NEW - Replace with your full dataset ID
```

**File: `/vite.config.ts`**

```typescript
// Line 28: Update dataset ID
const datasetId = 'gd_l1viktl72bvl7bjuj0'; // OLD
const datasetId = 'gd_XXXXXXXXXXXXX';      // NEW - Replace with your full dataset ID
```

### Rebuild and Deploy

```bash
# Rebuild the application
npm run build

# Test locally first
npm run dev

# Deploy to Vercel
git add .
git commit -m "feat: upgrade BrightData to full LinkedIn dataset"
git push

# Vercel will auto-deploy
```

### Test the New Dataset

1. Open RecruitOS at http://localhost:3000 (or your production URL)
2. Navigate to **Shortlist → Auto-Sourcing**
3. Enter a **public** LinkedIn profile URL (e.g., a CEO or founder with complete profile)
4. Click **"Run Analysis"**
5. Open browser console (F12) and check:
   ```
   [BrightData] ===== RAW PROFILE ANALYSIS =====
   [BrightData] Available keys: [...]
   [BrightData] Field presence: {
     hasExperience: true,        ← Should be TRUE now
     experienceCount: 5,         ← Should show 3-10 positions
     hasSkills: true,            ← Should be TRUE now
     skillsCount: 15,            ← Should show 10-50 skills
     ...
   }
   [BrightData] Data richness score: 8 / 10 fields  ← Should be 7-9 now
   [BrightData] Markdown length: 2500+ characters    ← Should be 2000-5000
   ```
6. Verify candidate shows **high match score** (50-80%) and accurate persona

---

## Step 5: Troubleshooting

### Issue: "Still no experience/skills after upgrade"

**Possible Causes:**
1. **Dataset not fully configured** - Go back to Step 3 and verify all fields are enabled
2. **Old cache** - Clear browser cache and test with a new profile URL
3. **Profile is private** - Test with a public profile (e.g., company founder, influencer)
4. **API key mismatch** - Verify `BRIGHTDATA_API_KEY` in Settings matches your dashboard

**Diagnostic Steps:**
```javascript
// In browser console after scrape:
console.log('[Debug] Check if experience data exists:')
console.log(profileData.experience)  // Should show array, not null
console.log(profileData.skills)      // Should show array, not null
```

### Issue: "New dataset costs too much"

**Alternative Solutions:**

1. **Use Quick Paste (Recommended)**
   - Free, 100% accurate
   - User copies LinkedIn profile text
   - AI extracts all relevant info
   - Already implemented and working

2. **Limit BrightData Usage**
   - Use Quick Paste for most candidates
   - Reserve BrightData for bulk imports
   - Set monthly budget limit in BrightData dashboard

3. **Use Manual Entry**
   - For high-value candidates, manually enter data
   - Most accurate and cost-free

### Issue: "Dataset upgrade not available"

If BrightData doesn't offer a full LinkedIn dataset in your plan:

**Contact BrightData Support:**
1. Go to [https://brightdata.com/support](https://brightdata.com/support)
2. Open a ticket with:
   ```
   Subject: Request Full LinkedIn People Profile Dataset

   Current Dataset: gd_l1viktl72bvl7bjuj0
   Issue: Dataset only returns basic info (name, education)
   Missing: Work experience, skills, about section

   Request: Access to full LinkedIn People Profile dataset
   Use Case: Technical recruiting - need experience and skills data

   Expected Fields:
   - experience[] (job history)
   - skills[] (technical skills)
   - about (summary section)
   - headline (current position)
   ```
3. They typically respond in 24-48 hours with upgrade options

---

## Expected Results After Upgrade

**Before (Current Dataset):**
```
Character count: 1073
Data richness: 6 / 10 fields
Match score: 10-20%
Persona: "Unknown - Insufficient Data"
Missing: experience, skills, about
```

**After (Full Dataset):**
```
Character count: 2500-4000
Data richness: 9 / 10 fields
Match score: 50-80%
Persona: "The Strategic Leader" / "The Technical Expert"
Includes: 5+ experience entries, 15+ skills, full about section
```

**Console Output After Upgrade:**
```
[BrightData] ===== RAW PROFILE ANALYSIS =====
[BrightData] Available keys: [
  "name", "headline", "about", "location",
  "experience", "skills", "education", "certifications"
]
[BrightData] Field presence: {
  hasName: true,
  hasPosition: true,           ← ✅ NEW
  hasAbout: true,              ← ✅ NEW
  hasExperience: true,         ← ✅ NEW
  experienceCount: 7,          ← ✅ NEW
  hasSkills: true,             ← ✅ NEW
  skillsCount: 23,             ← ✅ NEW
  hasCertifications: true,
  certificationsCount: 3,
  hasCourses: true,
  coursesCount: 2,
  hasProfessionalNetwork: true,
  networkCount: 5
}
[BrightData] Data richness score: 9 / 10 fields
[BrightData] ✅ HIGH DATA RICHNESS - Good dataset configuration
[BrightData] Total field types: 9
[BrightData] Markdown length: 3247 characters
```

---

## Summary

**Current Problem:** Dataset `gd_l1viktl72bvl7bjuj0` is a "lite" version that cannot extract experience, skills, or about sections.

**Solution Path:**
1. ✅ Access BrightData dashboard
2. ✅ Verify current dataset is "lite" or "basic"
3. ✅ Upgrade to "LinkedIn People Profile Full" dataset
4. ✅ Update dataset ID in RecruitOS code
5. ✅ Test and verify full data extraction

**Alternative:** Continue using **Quick Paste** (free, 100% accurate, already implemented)

**Timeline:** 30-60 minutes for dataset upgrade + testing

---

## Quick Reference

### Files to Update
```
/api/brightdata.ts          → Line 4: DATASET_ID
/vite.config.ts             → Line 28: datasetId
```

### Console Commands
```bash
# Check current extraction
# (In browser console after scrape)
console.log(profileData.experience)  # Should be array, not null
console.log(profileData.skills)      # Should be array, not null

# Rebuild after changes
npm run build

# Deploy
git add . && git commit -m "feat: upgrade BrightData dataset" && git push
```

### Support Resources
- BrightData Dashboard: [https://brightdata.com/dashboard](https://brightdata.com/dashboard)
- BrightData Support: [https://brightdata.com/support](https://brightdata.com/support)
- BrightData Datasets API Docs: [https://docs.brightdata.com/api-reference/datasets/v3](https://docs.brightdata.com/api-reference/datasets/v3)

---

**Last Updated:** 2026-01-08
**RecruitOS Version:** 1.0
**BrightData API Version:** Datasets v3
