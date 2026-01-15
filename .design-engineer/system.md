# Design System

## Direction

**Personality:** Precision & Density
**Foundation:** Cool (slate)
**Depth:** Borders-only
**Theme:** Dark mode

This is a data-heavy recruitment platform. Users are power users who need to scan, compare, and act quickly. The design prioritizes clarity and information density over visual flourish.

---

## Tokens

### Spacing

**Base:** 4px
**Scale:** 4, 8, 12, 16, 24, 32, 48

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon gaps, micro spacing |
| `space-2` | 8px | Within components, tight groups |
| `space-3` | 12px | Between related elements |
| `space-4` | 16px | Component padding (standard) |
| `space-6` | 24px | Between sections |
| `space-8` | 32px | Major separation |
| `space-12` | 48px | Page margins |

**Rules:**
- All spacing must be multiples of 4px
- No arbitrary values like 14px, 17px, 22px
- Padding should be symmetrical (16px all sides, not 24px 16px 12px 16px)

### Typography

**Font Family:**
- Body: `Inter, system-ui, sans-serif`
- Mono: `ui-monospace, SFMono-Regular, Menlo, monospace`

**Scale:**

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 12px | 400-500 | Labels, metadata, badges |
| `text-sm` | 14px | 400 | Body text (base) |
| `text-base` | 16px | 500-600 | Section headers, emphasis |
| `text-lg` | 18px | 600 | Card titles |
| `text-xl` | 20px | 600 | Page titles |
| `text-2xl` | 24px | 700 | Hero numbers, scores |

**Rules:**
- Never use `text-[10px]` - minimum is 12px
- Limit uppercase to single-word labels only
- Use `tracking-tight` for headings, normal tracking for body
- Monospace for: numbers, IDs, codes, timestamps
- Always use `tabular-nums` for columnar number alignment

**Hierarchy:**
- `text-white` - Primary content, headings
- `text-slate-300` - Secondary content, descriptions
- `text-slate-400` - Tertiary content, metadata
- `text-slate-500` - Muted, placeholders

### Colors

**Neutral Palette (Slate):**
```
--background: #0f172a (slate-900)
--surface: #1e293b (slate-800)
--surface-elevated: #334155 (slate-700)
--border: rgba(255, 255, 255, 0.08)
--border-subtle: rgba(255, 255, 255, 0.05)
```

**Semantic Colors:**
```
--accent: #3b82f6 (blue-500) - Primary actions, links
--success: #10b981 (emerald-500) - Success states, high scores
--warning: #f59e0b (amber-500) - Warnings, medium scores
--danger: #ef4444 (red-500) - Errors, risks, low scores
```

**Rules:**
- Gray builds structure - use slate for 90% of the UI
- Color only for meaning: status, actions, feedback
- No decorative color (gradients, glows, tinted backgrounds)
- Accent (blue) for interactive elements only
- Success (emerald) for positive outcomes only - not as general accent

### Radius

**Scale:** 4, 6, 8, 12

| Token | Value | Usage |
|-------|-------|-------|
| `rounded` | 4px | Badges, small elements |
| `rounded-md` | 6px | Buttons, inputs |
| `rounded-lg` | 8px | Cards, modals |
| `rounded-xl` | 12px | Large containers only |

**Rules:**
- No `rounded-full` except for avatars and status dots
- No `rounded-2xl` or larger
- Consistency: all cards use `rounded-lg` (8px)

### Shadows & Depth

**Strategy:** Borders-only

This system uses borders for depth, not shadows. This creates a cleaner, more technical aesthetic appropriate for data-heavy interfaces.

**Allowed:**
```css
border: 1px solid rgba(255, 255, 255, 0.08);
border: 1px solid rgba(255, 255, 255, 0.05); /* subtle */
```

**Forbidden:**
- `shadow-xl`, `shadow-2xl` on cards
- Glow effects: `shadow-[0_0_Xpx_rgba(...)]`
- Drop shadows for elevation
- Gradient overlays for "depth"

**Exception:** Focus rings for accessibility
```css
ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-900
```

---

## Patterns

### Card Default
- Background: `bg-slate-800/50`
- Border: `border border-white/[0.08]`
- Radius: `rounded-lg` (8px)
- Padding: `p-4` (16px)
- No shadows, no gradients

```tsx
<div className="bg-slate-800/50 border border-white/[0.08] rounded-lg p-4">
  {children}
</div>
```

### Button Primary
- Height: 36px
- Padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Background: `bg-blue-600 hover:bg-blue-500`
- Text: `text-sm font-medium text-white`
- Radius: `rounded-md` (6px)
- Transition: `transition-colors`

```tsx
<button className="h-9 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white rounded-md transition-colors">
  Button Text
</button>
```

### Button Secondary
- Height: 36px
- Padding: `px-4 py-2`
- Background: `bg-white/5 hover:bg-white/10`
- Border: `border border-white/[0.08]`
- Text: `text-sm font-medium text-slate-300`
- Radius: `rounded-md`

### Button Ghost
- Height: 36px
- Padding: `px-4 py-2`
- Background: `transparent hover:bg-white/5`
- Text: `text-sm font-medium text-slate-400 hover:text-white`
- No border

### Input Default
- Height: 36px
- Padding: `px-3 py-2`
- Background: `bg-slate-900/50`
- Border: `border border-white/[0.08] focus:border-blue-500/50`
- Text: `text-sm text-white placeholder:text-slate-500`
- Radius: `rounded-md`
- Focus: `focus:outline-none focus:ring-2 focus:ring-blue-500/20`

### Badge
- Padding: `px-2 py-0.5`
- Text: `text-xs font-medium`
- Radius: `rounded`
- Variants:
  - Default: `bg-slate-700 text-slate-300`
  - Success: `bg-emerald-500/10 text-emerald-400`
  - Warning: `bg-amber-500/10 text-amber-400`
  - Danger: `bg-red-500/10 text-red-400`

### Score Display
- Use `text-2xl font-bold tabular-nums`
- Color based on value:
  - 80-100: `text-emerald-400`
  - 50-79: `text-amber-400`
  - 0-49: `text-red-400`

### Empty State
- Container: Card with `p-12` padding, centered content
- Icon: `w-12 h-12` in muted container `bg-slate-700/50 rounded-lg`
- Heading: `text-lg font-semibold text-white mt-4`
- Description: `text-sm text-slate-400 mt-2 max-w-sm text-center`
- Action: Primary button `mt-6`

### Table Header
- Background: transparent
- Border: `border-b border-white/[0.05]`
- Text: `text-xs font-medium text-slate-500 uppercase tracking-wide`
- Padding: `px-4 py-3`

### List Item
- Padding: `p-4`
- Border: `border-b border-white/[0.05]` (last:border-0)
- Hover: `hover:bg-white/[0.02]`
- Transition: `transition-colors`

---

## Anti-Patterns

### Never Do
- Glow effects (`shadow-[0_0_Xpx_rgba(...)]`)
- Gradient overlays on cards
- `text-[10px]` or smaller
- Multiple shadow layers
- Colored backgrounds for cards (use borders)
- `uppercase tracking-widest` on body text
- Spring/bouncy animations
- Emerald as general accent (reserve for success)

### Always Question
- "Is this shadow necessary?" → Probably not, use border
- "Does this color communicate meaning?" → If not, use gray
- "Is this spacing on the 4px grid?" → Must be
- "Can I remove this gradient?" → Yes

---

## Animation

**Timing:**
- Micro-interactions: 150ms
- State changes: 200ms
- Modals/overlays: 250ms

**Easing:**
- Default: `ease-out`
- Enter: `cubic-bezier(0.16, 1, 0.3, 1)`
- Exit: `ease-in`

**Rules:**
- No bounce/spring effects
- No scale transforms on hover (use color/opacity)
- Prefer opacity transitions over transform
- Motion should be subtle and purposeful

---

## Iconography

**Library:** Phosphor Icons (`@phosphor-icons/react`) or Lucide (`lucide-react`)

**Sizes:**
- Inline with text: 16px (`w-4 h-4`)
- Standalone small: 20px (`w-5 h-5`)
- Standalone large: 24px (`w-6 h-6`)
- Empty state: 32-48px

**Rules:**
- Icons clarify, not decorate
- If removing an icon loses no meaning, remove it
- Use consistent weight (regular, not bold or light)
- Color inherits from text (`currentColor`)

---

## Accessibility

- Minimum touch target: 36px
- Minimum text size: 12px
- Color contrast: 4.5:1 for body text
- Focus states: visible ring on all interactive elements
- Don't rely on color alone for meaning (use icons/text too)
