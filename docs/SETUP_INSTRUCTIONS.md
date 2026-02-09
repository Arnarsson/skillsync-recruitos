# Setup Instructions - RecruitOS

## Current Status

✅ **BrightData LinkedIn Scraping** - WORKING
❌ **Gemini AI Analysis** - NEEDS API KEY
❌ **Full Candidate Workflow** - BLOCKED by missing Gemini API key

## What Just Happened

You tried to source a candidate from LinkedIn:
1. **BrightData scrape succeeded** ✅ - Your LinkedIn profile was extracted in ~14 seconds
2. **Persona generation failed** ❌ - "API Key missing" error because Gemini API key not configured
3. **Candidate was NOT added** - The workflow stopped at step 2

## Required: Configure Gemini API Key

The app **REQUIRES** a Google Gemini API key for AI-powered candidate analysis. Without it, the sourcing workflow cannot complete.

### Option 1: Environment Variable (Recommended for Development)

1. Open the `.env` file in the project root:
   ```bash
   nano /home/sven/Documents/RecruitOS-main/.env
   ```

2. Get a free Gemini API key from: https://aistudio.google.com/apikey

3. Replace the placeholder with your actual key:
   ```bash
   GEMINI_API_KEY=AIzaSyC_your_actual_key_here
   ```

4. Restart the dev server:
   ```bash
   # Kill the current server (Ctrl+C in terminal or find PID)
   # Then restart:
   npm run dev
   ```

### Option 2: Admin Settings UI (Runtime Configuration)

1. Open http://localhost:3001 in your browser
2. Click the **user avatar** in the bottom left sidebar
3. This opens **Admin Settings**
4. Add your **Google Gemini API Key**
5. Click **Save & Reload**

**Note:** This stores the key in browser localStorage (less secure than .env for development).

## Optional: Other API Keys

### Firecrawl API Key (for job description scraping)
- Get at: https://firecrawl.dev
- Add to `.env` as `FIRECRAWL_API_KEY=your_key_here`

### Supabase (for persistent database storage)
- Get at: https://supabase.com
- Add to `.env`:
  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your_anon_key_here
  ```
- **Without Supabase:** App works fine using localStorage

### BrightData API Key
- You already have this configured! ✅
- Shows in console: "API Key present: Yes (length: 36)"
- If you want to add it to `.env` as well: `BRIGHTDATA_API_KEY=your_key_here`

## Testing the Full Workflow

Once you've added the Gemini API key:

1. Make sure dev server is running: `npm run dev`
2. Open http://localhost:3001 or http://localhost:3000
3. Navigate to the main screen
4. Try sourcing a LinkedIn profile again
5. Watch the console logs to see the full workflow:
   ```
   [BrightData] Starting scrape for: ...
   [BrightData] Successfully extracted profile for: ...
   Step 2: Constructing Psychometric Persona...
   ✓ Persona Identified: The Strategic Scaler
   Step 3: Calculating Job Fit & Scoring...
   ✓ Candidate Added to Pipeline.
   ```

## Common Issues

### "API Key missing" error
**Cause:** Gemini API key not configured
**Fix:** Add `GEMINI_API_KEY` to `.env` file and restart server

### BrightData still timing out
**Cause:** LinkedIn profile is private or rate limiting
**Fix:** Use the "Quick Paste" feature to manually enter profile data

### "Firecrawl API Key is missing"
**Cause:** Trying to scrape job descriptions without Firecrawl key
**Fix:** Add `FIRECRAWL_API_KEY` to `.env` file or manually paste job descriptions

## Security Reminders

- ✅ `.env` file is in `.gitignore` - won't be committed to Git
- ⚠️ Never share your API keys publicly
- ⚠️ For production use, implement a backend proxy for API calls
- ⚠️ Rotate keys regularly

## Need Help?

Check these files for more information:
- `QUICK_START.md` - Quick start guide
- `STATUS.md` - Current application status
- `SECURITY.md` - Security best practices
- `README.md` - Project overview
