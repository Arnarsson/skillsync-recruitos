# i18n Language Toggle Design

## Overview

Add Danish/English language toggle to RecruitOS. Default language is Danish, with manual toggle in header persisted to localStorage.

## Requirements

- Manual toggle only (no browser detection)
- Default: Danish
- Persist preference in localStorage
- Toggle in header navigation
- Remove Y Combinator badge

## Implementation

### Approach: Simple Context + JSON files

Lightweight solution with no external dependencies.

### File Structure

```
locales/
├── da.json    # Danish (default)
└── en.json    # English

lib/i18n/
├── LanguageContext.tsx   # React Context + Provider
├── translations.ts       # Type definitions
└── index.ts             # Exports
```

### Translation JSON Structure

```json
{
  "common": {
    "bookDemo": "Book en demo",
    "signIn": "Log ind",
    "getStarted": "Kom i gang",
    "tryFreeSearch": "prøv gratis søgning"
  },
  "home": {
    "headline": "Find ingeniører og forskere der former dit felt",
    "searchPlaceholder": "Hvem leder du efter?",
    "searchHint": "enter for at søge, shift + enter for ny linje",
    "quickSearches": [
      "Kernel-modul udviklere",
      "Binær instrumenteringseksperter",
      "Signalbehandlingsforskere",
      "Database query optimizer eksperter",
      "Virtuel maskine implementører"
    ]
  },
  "features": {
    "searchByCapabilities": { "title": "...", "description": "..." },
    "discoverExperts": { "title": "...", "description": "..." },
    "hireFaster": { "title": "...", "description": "..." }
  },
  "pricing": { ... },
  "onboarding": { ... },
  "search": { ... },
  "intake": { ... },
  "pipeline": { ... }
}
```

### LanguageContext API

```typescript
interface LanguageContextType {
  lang: 'da' | 'en';
  setLang: (lang: 'da' | 'en') => void;
  t: (key: string) => string;
}

// Usage in components:
const { t, lang, setLang } = useLanguage();
<h1>{t('home.headline')}</h1>
```

### Header Toggle

```
[recruitos]                    [EN | DA]  [BOOK A DEMO]  [LOG IND]
```

- Simple text toggle: `EN | DA`
- Current language highlighted with primary color
- Click non-active language to switch

### localStorage Key

- Key: `recruitos_lang`
- Values: `'da'` | `'en'`
- Default if not set: `'da'`

## Files to Update

1. `app/layout.tsx` - Wrap with LanguageProvider
2. `components/Header.tsx` - Add toggle, use t() for nav
3. `components/Footer.tsx` - Use t() for links
4. `app/page.tsx` - Hero, search, features, pricing
5. `components/Onboarding.tsx` - All 6 steps
6. `app/search/page.tsx` - Search UI
7. `app/intake/page.tsx` - Intake form
8. `app/pipeline/page.tsx` - Pipeline UI

## Other Changes

- Remove Y Combinator badge from homepage
