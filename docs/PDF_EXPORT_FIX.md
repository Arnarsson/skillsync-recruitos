# PDF Export CSS Fix - Task 7-276

## Problem Statement
PDF export functionality was working but had layout issues due to dark/light mode conflicts. The PDF would render with dark backgrounds and light text, making it unreadable when printed.

## Root Cause
The application has two theme modes (light and dark) controlled by a `.dark` class. The report pages were styled primarily for dark mode with:
- Dark backgrounds (`bg-[#0a0a0f]`, `bg-zinc-900/40`)
- Light text (`text-zinc-100`, `text-zinc-200`)
- Dark borders (`border-zinc-800`)

The existing print media queries only targeted specific class names (`.rp-card`, `.rp-header`) but did not comprehensively override the Tailwind utility classes used throughout the components.

## Solution

### Files Modified
1. **`app/report/[id]/page.tsx`** - Shared personality profile report
2. **`app/profile/[username]/report/page.tsx`** - User profile report

### Changes Implemented

#### 1. Comprehensive Print Stylesheet (`app/report/[id]/page.tsx`)
- **Force Light Mode**: Override ALL background colors to white/light gray
- **Text Contrast**: Ensure all text is dark (#1f2937) for readability
- **Preserve Brand Colors**: Maintain color-coded elements (score rings, badges) with print-safe colors
- **Remove Shadows**: Eliminate all box-shadows and text-shadows
- **Hide Screen Elements**: Hide toolbar and interactive elements with `.no-print`
- **SVG Optimization**: Ensure charts and icons render properly in print
- **Page Breaks**: Control pagination with `.print-break` and `.print-avoid` classes

Key improvements:
```css
/* Force all backgrounds to white/light */
.report-page,
.report-page * {
  background: #fff !important;
}

/* Override ALL text to dark */
.report-page h1, h2, h3, h4, h5, h6, p, span, div, li, a {
  color: #1f2937 !important;
}

/* Preserve semantic colors for scores */
.text-emerald-400, .text-emerald-500 {
  color: #10b981 !important;
}
```

#### 2. Print Optimization (`app/profile/[username]/report/page.tsx`)
This page was already light-themed but lacked print optimization:
- Added comprehensive print media queries
- Optimized grayscale handling for images
- Ensured proper page breaks
- Standardized colors for print output

### Testing Instructions

#### Test Profile Created
A test profile has been created at: `.data/shared-profiles/testpdf001.json`

Access it at: `http://localhost:3000/report/testpdf001`

#### Manual Test Steps

1. **Start Dev Server**
   ```bash
   cd ~/Documents/skillsync-recruitos
   npm run dev
   ```

2. **Test Light Mode**
   - Open: http://localhost:3000/report/testpdf001
   - Ensure browser is in light mode
   - Click "Export PDF" or Ctrl/Cmd+P
   - **Expected Result**: Clean, readable PDF with:
     - White background
     - Dark text
     - Proper colors for score rings and badges
     - No toolbar or interactive elements

3. **Test Dark Mode**
   - Enable dark mode in your browser/OS
   - Refresh the page
   - Click "Export PDF" or Ctrl/Cmd+P
   - **Expected Result**: Identical to light mode test
     - PDF should ignore user theme
     - Always render with print-friendly styling
     - White background regardless of screen theme

4. **Test Profile Report (Alternative Page)**
   - This requires a profile in localStorage
   - Access through the main app workflow
   - Test print functionality similarly

#### Automated Verification (Future)
Consider adding Playwright tests for PDF generation:
```typescript
test('PDF export renders correctly in light mode', async ({ page }) => {
  await page.goto('http://localhost:3000/report/testpdf001');
  const pdf = await page.pdf({ format: 'Letter' });
  // Verify PDF content...
});
```

## Definition of Done Checklist

- [x] Fix CSS for PDF export in both themes
- [x] Ensure PDF always uses print-friendly styling (light background)
- [x] Create test profile for verification
- [ ] Test PDF export in light mode - document issues
- [ ] Test PDF export in dark mode - document issues
- [ ] Capture before/after screenshots
- [ ] Commit changes with PR

## Verification Results

### Before Fix
*(To be documented with screenshots)*
- Dark background visible in PDF
- Light text hard to read on print
- Inconsistent rendering between themes

### After Fix
*(To be documented with screenshots)*
- Clean white background
- Dark, readable text
- Consistent output regardless of user theme
- Professional print layout

## Technical Details

### CSS Specificity Strategy
Used `!important` declarations to override:
- Tailwind utility classes (high specificity)
- Inline styles
- Theme-based CSS variables

### Print Media Query Structure
```css
@media print {
  /* Page setup */
  @page { margin: 0.75in; size: letter; }
  
  /* Force light mode */
  html, body { background: #fff !important; }
  
  /* Hide screen elements */
  .no-print { display: none !important; }
  
  /* Optimize content */
  /* ... comprehensive color/layout rules */
}
```

### Color Palette for Print
- Background: `#fff` (pure white)
- Cards: `#f9fafb` (light gray)
- Text: `#1f2937` (dark gray)
- Muted Text: `#6b7280` (medium gray)
- Borders: `#e5e7eb` (light gray)
- Preserve: Brand colors (emerald, blue, yellow, etc.)

## Next Steps

1. **Manual Testing**: Follow test instructions above
2. **Screenshots**: Capture before/after in both themes
3. **PR Creation**: Commit changes with documentation
4. **Future Enhancement**: Add automated PDF testing

## Notes

- The `print-color-adjust: exact` property ensures colors are preserved in the PDF
- SVG charts (radar charts) are optimized to render correctly in print
- Page breaks are strategically placed to avoid splitting important sections
- The test profile includes all possible fields to ensure comprehensive coverage

## Files Changed
- `app/report/[id]/page.tsx` - +164 lines (comprehensive print CSS)
- `app/profile/[username]/report/page.tsx` - +107 lines (print optimization)
- `.data/shared-profiles/testpdf001.json` - +168 lines (test data)
