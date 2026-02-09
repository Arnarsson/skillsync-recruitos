# Button Sizing Inconsistency Audit - RecruitOS

## Executive Summary
Found multiple button inconsistencies:
1. Two button components exist (shadcn Button + unused primitives Button)
2. Custom height overrides in several places
3. Raw `<button>` elements without design system styling
4. Inconsistent size usage

## Design System Components

### Current Button Components

#### 1. `/components/ui/button.tsx` (PRIMARY - shadcn/ui based)
**Sizes:**
- `sm`: h-8, px-3
- `default`: h-9, px-4
- `lg`: h-10, px-6
- `icon-sm`: size-8
- `icon`: size-9
- `icon-lg`: size-10

#### 2. `/components/ui/primitives/Button.tsx` (UNUSED - should be removed)
**Sizes:**
- `sm`: h-8, px-3
- `md`: h-9, px-4
- `lg`: h-10, px-5

**STATUS:** Not imported anywhere. Safe to remove.

## Issues Found

### 1. Custom Height Overrides
app/pipeline/page.tsx:976:                        <Button size="sm" variant="outline" className="w-full text-xs h-8">
app/profile/[username]/deep/page.tsx:1010:              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">

### 2. Raw Button Elements (No Design System)
39
 instances found
