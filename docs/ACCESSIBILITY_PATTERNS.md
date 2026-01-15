# Accessibility (ARIA) Patterns Guide

## Overview

This guide documents WCAG 2.1 Level AA accessibility patterns implemented in the 6Degrees codebase, focusing on ARIA attributes and keyboard navigation.

## Why Accessibility Matters

### Legal & Ethical

- **ADA Compliance** (US): Americans with Disabilities Act requires accessible web applications
- **EAA Compliance** (EU): European Accessibility Act mandates digital accessibility
- **WCAG 2.1 Level AA**: Industry standard for web accessibility
- **Ethical Responsibility**: 15% of global population has some form of disability

### Business Benefits

- **Wider Audience**: Accessible apps reach more users
- **Better UX**: Accessibility improvements benefit all users
- **SEO**: Screen-reader-friendly content improves search rankings
- **Reduced Risk**: Avoid costly accessibility lawsuits

---

## ARIA Basics

### What is ARIA?

**ARIA** (Accessible Rich Internet Applications) is a set of attributes that make web content more accessible to assistive technologies like screen readers.

### Three Types of ARIA Attributes

1. **Roles**: Define what an element is (`role="dialog"`, `role="button"`)
2. **Properties**: Describe characteristics (`aria-label`, `aria-required`)
3. **States**: Describe current condition (`aria-expanded`, `aria-selected`)

---

## Modal Dialog Pattern

### Implementation

```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <div className="bg-white rounded-lg p-6">
    <h2 id="modal-title">Admin Settings</h2>
    <p id="modal-description" className="sr-only">
      Configure API keys and application settings
    </p>

    {/* Modal content */}

    <button
      onClick={onClose}
      aria-label="Close admin settings"
    >
      <i className="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  </div>
</div>
```

### Key Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `role="dialog"` | Identifies element as modal dialog | Required for screen readers |
| `aria-modal="true"` | Indicates dialog is modal (blocks background) | Prevents background interaction |
| `aria-labelledby` | References element that labels the dialog | Links to heading ID |
| `aria-describedby` | References element describing the dialog | Links to description ID |
| `aria-label` | Provides accessible name when no visible text | For icon buttons |

### WCAG Criteria Met

- **1.3.1 Info and Relationships** (Level A): Semantic structure conveyed
- **2.4.6 Headings and Labels** (Level AA): Clear labels provided
- **4.1.2 Name, Role, Value** (Level A): All interactive elements have names

---

## Form Input Pattern

### Implementation

```tsx
<div>
  <label htmlFor="api-key" className="text-sm font-bold">
    API Key
  </label>
  <input
    id="api-key"
    type="password"
    aria-label="Gemini API key input"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "api-key-error" : "api-key-help"}
  />

  {/* Help text */}
  <p id="api-key-help" className="text-xs text-slate-500">
    Get your key from Google AI Studio
  </p>

  {/* Error message */}
  {hasError && (
    <div id="api-key-error" role="alert" aria-live="polite">
      Please enter a valid API key
    </div>
  )}
</div>
```

### Key Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `htmlFor` + `id` | Links label to input | Essential for screen readers |
| `aria-label` | Provides additional context | When label text isn't enough |
| `aria-required` | Indicates required field | Announced to screen readers |
| `aria-invalid` | Marks field as having error | Triggered on validation |
| `aria-describedby` | Links to help text or error | Provides context |
| `role="alert"` | Announces errors immediately | For critical feedback |

### WCAG Criteria Met

- **3.3.1 Error Identification** (Level A): Errors clearly identified
- **3.3.2 Labels or Instructions** (Level A): Clear labels provided
- **3.3.3 Error Suggestion** (Level AA): Error messages provide guidance

---

## Tab Interface Pattern

### Implementation

```tsx
<div>
  {/* Tab list */}
  <div role="tablist" aria-label="Wallet sections">
    <button
      role="tab"
      id="credits-tab"
      aria-selected={activeTab === 'credits'}
      aria-controls="credits-panel"
      onClick={() => setActiveTab('credits')}
    >
      Credits
    </button>
    <button
      role="tab"
      id="logs-tab"
      aria-selected={activeTab === 'logs'}
      aria-controls="logs-panel"
      onClick={() => setActiveTab('logs')}
    >
      Audit Logs
    </button>
  </div>

  {/* Tab panels */}
  <div
    role="tabpanel"
    id="credits-panel"
    aria-labelledby="credits-tab"
    hidden={activeTab !== 'credits'}
  >
    {/* Credits content */}
  </div>

  <div
    role="tabpanel"
    id="logs-panel"
    aria-labelledby="logs-tab"
    hidden={activeTab !== 'logs'}
  >
    {/* Logs content */}
  </div>
</div>
```

### Key Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `role="tablist"` | Container for tabs | Parent element |
| `aria-label` | Describes purpose of tabs | "Wallet sections" |
| `role="tab"` | Individual tab button | Each tab |
| `aria-selected` | Indicates active tab | true/false |
| `aria-controls` | Links tab to panel | References panel ID |
| `role="tabpanel"` | Content container | Linked to tab |
| `aria-labelledby` | Links panel to tab | References tab ID |

### Keyboard Navigation

- **Tab**: Move focus between tabs
- **Enter/Space**: Activate selected tab
- **Arrow Left/Right**: Navigate between tabs

### WCAG Criteria Met

- **2.1.1 Keyboard** (Level A): Fully keyboard accessible
- **2.4.3 Focus Order** (Level A): Logical focus progression
- **WAI-ARIA Authoring Practices**: Follows tablist pattern

---

## Status Indicator Pattern

### Implementation

```tsx
{/* Loading state */}
<div role="status" aria-live="polite">
  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
  <span>Generating profile...</span>
</div>

{/* Success state */}
<div role="status">
  <i className="fa-solid fa-check text-emerald-500" aria-hidden="true"></i>
  <span>Profile generated successfully</span>
</div>

{/* Alert (urgent) */}
<div role="alert" aria-live="assertive">
  <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
  <span>Action required: Review security notice</span>
</div>
```

### Key Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `role="status"` | Non-critical status update | Loading, success |
| `role="alert"` | Critical notification | Errors, warnings |
| `aria-live="polite"` | Announces when convenient | Status updates |
| `aria-live="assertive"` | Interrupts to announce | Critical alerts |
| `aria-hidden="true"` | Hides decorative elements | Icons |

### When to Use

- **`role="status"`**: Loading states, progress indicators, non-urgent updates
- **`role="alert"`**: Errors, warnings, critical notifications
- **`aria-live="polite"`**: Status updates that can wait
- **`aria-live="assertive"`**: Urgent alerts that should interrupt

---

## Expandable Content Pattern

### Implementation

```tsx
<div>
  <button
    onClick={() => setExpanded(!expanded)}
    aria-expanded={expanded}
    aria-controls="compliance-details"
  >
    <span>EU AI Act Compliance</span>
    <i
      className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`}
      aria-hidden="true"
    ></i>
  </button>

  <div
    id="compliance-details"
    role="region"
    aria-label="Compliance log details"
    hidden={!expanded}
  >
    {/* Expandable content */}
  </div>
</div>
```

### Key Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `aria-expanded` | Indicates expand/collapse state | true/false |
| `aria-controls` | Links button to content | References content ID |
| `role="region"` | Identifies landmark | For expanded content |
| `hidden` | Hides content from all users | Use instead of CSS display |

### WCAG Criteria Met

- **4.1.2 Name, Role, Value** (Level A): State conveyed to AT
- **1.3.1 Info and Relationships** (Level A): Relationships programmatically determined

---

## Icon Accessibility

### Decorative Icons (Hidden)

```tsx
{/* Icon with adjacent text - hide from screen readers */}
<button>
  <i className="fa-solid fa-download" aria-hidden="true"></i>
  <span>Download</span>
</button>
```

### Standalone Icons (Labeled)

```tsx
{/* Icon without text - provide label */}
<button aria-label="Close modal">
  <i className="fa-solid fa-xmark"></i>
</button>

{/* Alternative: Use visually-hidden text */}
<button>
  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
  <span className="sr-only">Close modal</span>
</button>
```

### Rule of Thumb

- **Icon + Text visible**: Add `aria-hidden="true"` to icon
- **Icon only**: Add `aria-label` to button OR visually-hidden text

---

## Screen Reader Only Text

### Implementation

```tsx
/* CSS */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Usage */
<p id="modal-description" className="sr-only">
  This dialog allows you to configure API keys for external services
</p>
```

### When to Use

- Providing context for screen readers without cluttering UI
- Adding descriptions to `aria-describedby` references
- Supplementing visual-only indicators

---

## Testing Accessibility

### Automated Testing

```bash
# Install testing tools
npm install --save-dev @axe-core/react eslint-plugin-jsx-a11y

# Run accessibility checks
npm run lint:a11y
```

### Manual Testing

1. **Keyboard Navigation**
   - Can you reach all interactive elements with Tab?
   - Can you activate buttons with Enter/Space?
   - Is focus visible?

2. **Screen Reader Testing**
   - **Windows**: NVDA (free)
   - **Mac**: VoiceOver (built-in, Cmd+F5)
   - **Linux**: Orca

3. **Browser DevTools**
   - Chrome DevTools → Lighthouse → Accessibility audit
   - Firefox DevTools → Accessibility inspector

---

## ARIA Attributes Reference

### Common Roles

| Role | Usage | Example |
|------|-------|---------|
| `dialog` | Modal dialogs | Settings modal |
| `alert` | Important announcements | Error messages |
| `status` | Status updates | Loading states |
| `button` | Clickable actions | Icon buttons |
| `tab`, `tablist`, `tabpanel` | Tab interfaces | Wallet tabs |
| `region` | Landmark areas | Expandable sections |

### Common Properties

| Property | Usage | Example |
|----------|-------|---------|
| `aria-label` | Accessible name | "Close button" |
| `aria-labelledby` | References label element | Links to heading |
| `aria-describedby` | References description | Links to help text |
| `aria-required` | Required form field | Input validation |
| `aria-invalid` | Invalid field | Error state |
| `aria-hidden` | Hide from AT | Decorative icons |

### Common States

| State | Usage | Example |
|-------|-------|---------|
| `aria-expanded` | Expand/collapse | Disclosure widgets |
| `aria-selected` | Selected state | Active tab |
| `aria-checked` | Checkbox state | Toggle switches |
| `aria-disabled` | Disabled state | Inactive buttons |
| `aria-live` | Dynamic content | Status updates |

---

## Migration Statistics

### Files Updated (as of 2026-01-08)

| Component | ARIA Attributes Added | Status |
|-----------|----------------------|--------|
| `AdminSettingsModal.tsx` | 19 | ✅ Complete |
| `AuditLogModal.tsx` | 31 | ✅ Complete |
| `NetworkPathfinder.tsx` | 25 | ✅ Complete |
| **TOTAL** | **75** | **3/12 components** |

### Remaining Work

- `BattleCardCockpit.tsx` - Side panel navigation
- `TalentHeatMap.tsx` - Grid with interactive cards
- `CalibrationEngine.tsx` - Form inputs
- `ToastNotification.tsx` - Alert notifications
- Other components - ~TBD

---

## Best Practices

### ✅ DO

- **Use semantic HTML first**: Prefer `<button>` over `<div onClick>`
- **Provide text alternatives**: Always label icon buttons
- **Test with keyboard**: Ensure full keyboard accessibility
- **Use ARIA landmarks**: Help navigation with screen readers
- **Add focus indicators**: Make focus visible
- **Provide context**: Use `aria-label` and `aria-describedby`

### ❌ DON'T

- **Don't use ARIA when HTML works**: Native elements are better
- **Don't hide content with CSS only**: Use `aria-hidden` + `hidden`
- **Don't use positive tabindex**: Let natural tab order work
- **Don't omit keyboard support**: All mouse actions need keyboard equivalent
- **Don't forget error states**: Mark invalid fields with `aria-invalid`

---

## Resources

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **MDN ARIA Guide**: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
- **WebAIM**: https://webaim.org/
- **a11y Project**: https://www.a11yproject.com/

---

**Accessibility Progress:** 75 attributes / 12 components complete (25%)
**Target:** WCAG 2.1 Level AA compliance across entire application

**Last Updated:** 2026-01-08
