# Credits & Payments — Module Context

> Owner: lib/credits.ts + lib/credit-packages.ts | Routes: app/api/checkout/, app/api/credits/
> Purpose: Metered access to deep profile reports via credit economy

## What This Module Does

Manages the credit system: users buy credit packages (DKK), spend 1 credit per deep profile analysis. Tracks every transaction in an immutable ledger. Annual plan = unlimited credits.

## Architecture

```
lib/credits.ts           — business logic: balance, consume, add, upgrade, history
lib/credit-packages.ts   — package definitions: pricing, tiers, Stripe mapping
lib/pricing-catalog.ts   — canonical pricing source (CREDIT_BUNDLE_PACKAGES)
lib/pricing.ts           — legacy pricing constants (PRICING_PLANS, CREDIT_PACKAGES)
lib/stripe.ts            — Stripe client, checkout helpers, customer management
lib/useCredits.ts        — React hook: balance state + purchasePackage()
```

### API Routes

```
app/api/checkout/credits/route.ts  — POST: create Stripe checkout for credit package
                                      GET: list available packages
app/api/checkout/route.ts          — POST: create Stripe checkout for subscription plans
app/api/credits/balance/route.ts   — GET: current user balance
app/api/credits/consume/route.ts   — POST: spend 1 credit
app/api/credits/route.ts           — GET: credit history
app/api/webhooks/stripe/route.ts   — Stripe webhook: payment confirmation → addCredits()
```

## Data Model (Prisma)

```prisma
model User {
  credits              Int      @default(0)
  plan                 String   @default("FREE")
  stripeCustomerId     String?
  stripeSubscriptionId String?
}

model CreditLedger {
  userId    String
  delta     Int          // +N for purchase, -1 for consumption, 0 for plan changes
  reason    CreditReason // PURCHASE | CONSUMPTION | SIGNUP_BONUS | SUBSCRIPTION
  balance   Int          // balance AFTER this transaction
  metadata  Json         // packageId, paymentId, candidateUsername, etc.
}

model Payment {
  stripePaymentId  String  @unique
  amount           Int     // in DKK cents
  credits          Int
  packageId        String
  status           String
}

model ProfileView {
  userId      String
  username    String    // candidate username
  creditUsed  Boolean   // false for unlimited plan
}
```

## Credit Packages

| Package | Credits | Price (DKK) | Per Credit |
|---------|---------|-------------|------------|
| Starter | 10 | 5,000 | 500 kr |
| Growth | 25 | 10,000 | 400 kr |
| Scale | 60 | 20,000 | 333 kr |
| Annual | Unlimited | 30,000/yr | - |

## Key Functions

```typescript
// lib/credits.ts
getCreditBalance(userId)     → { credits, plan, unlimited, profilesViewed }
canConsumeCredit(userId)     → boolean
consumeCredit(userId, candidateUsername)  → { newBalance, ledgerEntryId }
addCredits(userId, credits, packageId, paymentId)  → { newBalance }
upgradeToAnnual(userId, stripeSubscriptionId, paymentId)  → void
recordPayment(data)          → paymentId
getOrCreateUser(data)        → { id, credits, plan }
getCreditHistory(userId)     → ledger entries

// lib/credit-packages.ts
getCreditPackage(id)         → CreditPackage | undefined
getCostPerCredit(pkg)        → number
formatDKK(amount)            → "5.000 kr."
validatePackagePurchase(amountInCents)  → { valid, package, credits }
```

## Flow: Purchase Credits

```
1. User clicks "Buy 10 credits" → useCredits().purchasePackage('starter')
2. POST /api/checkout/credits { packageId: 'starter' }
3. Route creates Stripe checkout session with package metadata
4. User completes payment on Stripe
5. Stripe webhook fires → POST /api/webhooks/stripe
6. Webhook calls addCredits(userId, 10, 'starter', paymentId)
7. Prisma transaction: increment user.credits + create ledger entry
```

## Flow: Consume Credit

```
1. User views deep profile → POST /api/credits/consume { candidateUsername }
2. Route calls consumeCredit(userId, candidateUsername)
3. Prisma transaction:
   - Check user.credits > 0 (or plan === 'ANNUAL')
   - Decrement credits
   - Create ledger entry (delta: -1)
   - Create ProfileView record
4. Return new balance
```

## Rules

- All credit mutations happen in Prisma transactions (atomicity)
- Ledger is append-only — no updates or deletes
- Annual plan: credits not decremented, but usage still logged (delta: 0)
- Signup bonus: 5 free credits on account creation
- Stripe amounts in DKK cents (5000 DKK = 500000 cents)

## Consumers

- `app/credits/page.tsx` — purchase UI
- `app/pricing/page.tsx` — plan selection
- `components/pipeline/CandidatePipelineItem.tsx` — credit gate before deep profile
- `app/api/webhooks/stripe/route.ts` — payment confirmation
- `lib/useCredits.ts` — React hook (balance + purchase)
