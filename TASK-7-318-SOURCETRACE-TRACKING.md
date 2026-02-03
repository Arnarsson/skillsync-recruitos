# Task 7-318: Source Trace Tracking Implementation

## Issue
**Linear Issue:** 7-318  
**Title:** Add tracking to RecruitOS  
**Description:** Install Source Trace snippet on RecruitOS landing/app

## Implementation

### Changes Made
**File Modified:** `app/layout.tsx`

1. **Added Import:**
   ```typescript
   import Script from "next/script";
   ```

2. **Added Tracking Script:**
   ```typescript
   <head>
     <Script
       src="https://sourcetrace.vercel.app/t.js"
       strategy="afterInteractive"
     />
   </head>
   ```

### Technical Details
- **Location:** Root layout file (`app/layout.tsx`)
- **Scope:** Tracking will be active on all pages (landing and app)
- **Loading Strategy:** `afterInteractive` - loads after the page becomes interactive for optimal performance
- **Next.js Component:** Using Next.js `Script` component for optimized script loading

### Verification
✅ **ESLint:** No errors  
✅ **Syntax:** Valid Next.js Script component usage  
✅ **Scope:** Applied to root layout (covers all pages)  
✅ **Git Diff:** Changes tracked and ready for commit

### Next Steps
1. Commit the changes to git
2. Deploy to preview/production environment
3. Verify tracking is working by checking Source Trace dashboard
4. Test on both landing page and authenticated app pages

### Files Changed
- `app/layout.tsx` (+7 lines)

### Completion Status
✅ Code changes complete  
✅ Documentation added  
⏳ Awaiting deployment and verification

## Date
**Completed:** January 29, 2025
