# Changelog

## 2026-02-09

### Changed
- Consolidated pricing constants into shared catalogs in `lib/pricing-catalog.ts`, with `lib/pricing.ts` and `lib/credit-packages.ts` now deriving from one source.
- Consolidated Stripe webhook verification/dispatch into shared utilities in `lib/stripe-webhook.ts`.
- Updated both webhook routes to use shared processing while preserving route behavior:
  - `app/api/webhooks/stripe/route.ts`
  - `app/api/stripe/webhook/route.ts`

### Deprecated
- Marked `/api/stripe/webhook` as deprecated in favor of `/api/webhooks/stripe`.
- Added deprecation response headers on `/api/stripe/webhook`, including replacement endpoint and sunset date (`2026-12-31`).

### Removed
- Deleted redundant route variants:
  - `app/api/search/route.validated.ts`
  - `app/api/credits/route.validated.ts`

### Tests
- Added consistency coverage to prevent pricing drift:
  - `tests/lib/pricing-catalog-consistency.test.ts`
- Added webhook utility coverage:
  - `tests/lib/stripe-webhook.test.ts`
