# Button Sizing Consistency Fix - Issue 7-277

## Audit Results

### Issues Identified

1. **Duplicate Button Components**
   - `components/ui/button.tsx` (PRIMARY - in use)
   - `components/ui/primitives/Button.tsx` (UNUSED - should be removed)

2. **Custom Height Overrides** (2 instances)
   - `app/pipeline/page.tsx:976` - `h-8` override (redundant with size="sm")
   - `app/profile/[username]/deep/page.tsx:1010` - `h-7` override (non-standard size)

3. **Raw Button Elements** (39 instances)
   - Should use design system Button component where appropriate
   - Key files: login, signup, various components

## Design System Standard

### Button Sizes (from `components/ui/button.tsx`)
- **sm**: h-8 (32px) - Small actions, compact UIs
- **default**: h-9 (36px) - Standard actions
- **lg**: h-10 (40px) - Primary CTAs, important actions
- **icon-sm**: 8x8 (32px) - Small icon buttons
- **icon**: 9x9 (36px) - Standard icon buttons  
- **icon-lg**: 10x10 (40px) - Large icon buttons

### Variants
- `default`: Primary actions (blue background)
- `outline`: Secondary actions (border, transparent bg)
- `ghost`: Tertiary actions (transparent, hover state)
- `destructive`: Dangerous actions (red)
- `secondary`: Alternative secondary (gray bg)
- `link`: Text links styled as buttons

## Fix Plan

### Phase 1: Remove Unused Component
- [x] Delete `components/ui/primitives/Button.tsx`

### Phase 2: Fix Custom Height Overrides
- [x] `app/pipeline/page.tsx:976` - Remove redundant `h-8` (2 instances)
- [x] `app/profile/[username]/deep/page.tsx:1010` - Change to standard `sm` size

### Phase 3: Convert Raw Buttons to Design System
Priority files (user-facing):
- [x] `app/login/page.tsx` - Auth buttons (2 converted)
- [x] `app/signup/page.tsx` - Auth buttons (1 converted)
- [x] `components/pipeline/CandidatePipelineItem.tsx` - Action buttons (4 converted)
- [ ] `components/ScoreLegend.tsx` - Interactive elements

### Phase 4: Button Group Alignment
- [ ] Review all button groups for consistent spacing
- [ ] Ensure flex gap consistency (gap-2 standard)

### Phase 5: Verification
- [ ] Visual regression testing
- [ ] Screenshot comparison
- [ ] Accessibility audit (button focus states)

## Implementation Notes

### Conversion Guidelines

**Icon-only buttons:**
```tsx
// Before
<button onClick={handler} className="...">
  <Icon className="w-4 h-4" />
</button>

// After
<Button variant="ghost" size="icon-sm" onClick={handler}>
  <Icon className="w-4 h-4" />
</Button>
```

**Text buttons:**
```tsx
// Before
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Click Me
</button>

// After
<Button>Click Me</Button>
```

**Custom styling preservation:**
```tsx
// Keep necessary custom classes (width, specific colors)
<Button className="w-full">Full Width Button</Button>
```

## Success Metrics

- [ ] Zero custom height overrides on Button components
- [ ] All user-facing buttons use design system
- [ ] Consistent spacing in button groups
- [ ] All buttons pass accessibility audit
- [ ] Visual consistency across all pages

## Commit Strategy

1. Remove unused component
2. Fix height overrides
3. Convert auth pages (login/signup)
4. Convert pipeline components
5. Convert remaining components
6. Final cleanup and documentation
