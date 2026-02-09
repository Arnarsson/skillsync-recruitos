# Database Verification Report

**Date:** 2026-02-09
**Verified by:** db-verifier agent
**Database:** Supabase PostgreSQL (nwzhfziwxkelfirasfvy.supabase.co)

---

## 1. Connection Status

| Check | Result |
|-------|--------|
| PostgreSQL Version | 17.6 (aarch64-unknown-linux-gnu) |
| Connection via psql | PASS |
| Prisma migrate status | PASS - "Database schema is up to date!" |
| Connection endpoint | aws-1-eu-central-1.pooler.supabase.com |

**Connection:** Successful to Supabase PostgreSQL 17.6.

---

## 2. Schema Compliance

| Check | Result |
|-------|--------|
| `prisma db pull --force --print` matches `schema.prisma` | PASS |
| All 9 models present | PASS |
| All 3 enums present | PASS |
| Migration SQL matches schema | PASS |

**Models verified (9):** User, ProfileView, Search, Payment, SharedProfile, Candidate, CandidateNote, CreditLedger, StripeEvent

**Enums verified (3):** Plan (FREE/PRO/ENTERPRISE/ANNUAL), SourceType (GITHUB/LINKEDIN/MANUAL), CreditReason (CONSUMPTION/PURCHASE/SUBSCRIPTION/SIGNUP_BONUS/REFUND/ADMIN)

**Table column counts:**
| Table | Columns |
|-------|---------|
| Candidate | 46 |
| CandidateNote | 7 |
| CreditLedger | 7 |
| Payment | 10 |
| ProfileView | 5 |
| Search | 5 |
| SharedProfile | 20 |
| StripeEvent | 5 |
| User | 13 |

---

## 3. Migration Status

- **1 migration found:** `0_init`
- **Status:** Database schema is up to date
- **No pending migrations**

---

## 4. Data Types Verification

### Candidate Table - Key Fields

| Column | DB Type | UDT Name | Expected | Status |
|--------|---------|----------|----------|--------|
| scoreDrivers | ARRAY | _text | text[] | PASS |
| scoreDrags | ARRAY | _text | text[] | PASS |
| unlockedSteps | ARRAY | _int4 | integer[] | PASS |
| keyEvidence | jsonb | jsonb | Json (jsonb) | PASS |
| risks | jsonb | jsonb | Json (jsonb) | PASS |
| alignmentScore | double precision | float8 | Float | PASS |
| skills | jsonb | jsonb | Json (jsonb) | PASS |
| experience | jsonb | jsonb | Json (jsonb) | PASS |
| persona | jsonb | jsonb | Json (jsonb) | PASS |
| scoreBreakdown | jsonb | jsonb | Json (jsonb) | PASS |
| pipelineStage | text | text | String | PASS |
| name | text | text | String | PASS |

**Note:** `keyEvidence` and `risks` in the Candidate model are `Json?` (jsonb), not `String[]`. This is intentional for SQLite compat (see schema comment). The `SharedProfile` model uses native `String[]` for its `keyEvidence` and `risks` fields.

---

## 5. Index Verification

### Candidate Table Indexes (9 total)

| Index | Type | Status |
|-------|------|--------|
| Candidate_pkey (id) | PRIMARY KEY | PASS |
| Candidate_alignmentScore_idx | btree | PASS |
| Candidate_createdAt_idx | btree | PASS |
| Candidate_name_idx | btree | PASS |
| Candidate_pipelineStage_idx | btree | PASS |
| Candidate_sourceType_idx | btree | PASS |
| Candidate_userId_idx | btree | PASS |
| Candidate_githubUsername_userId_key | UNIQUE | PASS |
| Candidate_linkedinId_userId_key | UNIQUE | PASS |

### All Tables - Complete Index Summary (35 indexes)

| Table | Index Count | All Verified |
|-------|-------------|-------------|
| Candidate | 9 | PASS |
| CandidateNote | 2 | PASS |
| CreditLedger | 4 | PASS |
| Payment | 3 | PASS |
| ProfileView | 3 | PASS |
| Search | 2 | PASS |
| SharedProfile | 4 | PASS |
| StripeEvent | 3 | PASS |
| User | 4 | PASS |

---

## 6. Foreign Key Verification

| Constraint | Table | References | Status |
|-----------|-------|------------|--------|
| Candidate_userId_fkey | Candidate | User | PASS (CASCADE) |
| CandidateNote_candidateId_fkey | CandidateNote | Candidate | PASS (CASCADE) |
| CreditLedger_userId_fkey | CreditLedger | User | PASS (CASCADE) |
| Payment_userId_fkey | Payment | User | PASS (CASCADE) |
| ProfileView_userId_fkey | ProfileView | User | PASS (CASCADE) |
| Search_userId_fkey | Search | User | PASS (CASCADE) |

All foreign keys use `ON DELETE CASCADE` as specified in schema.

---

## 7. CRUD Operations Test

| Operation | Result |
|-----------|--------|
| CREATE candidate | PASS - Created with all field types |
| READ candidate | PASS - All fields returned correctly |
| Array field verification (scoreDrivers) | PASS - Returns as JS Array |
| Array field verification (scoreDrags) | PASS - Returns as JS Array |
| Array field verification (unlockedSteps) | PASS - Returns as Int Array [1,2,3] |
| Json field verification (keyEvidence) | PASS - Returns as JS object |
| Json field verification (risks) | PASS - Returns as JS object |
| Float field verification (alignmentScore) | PASS - 85.5 stored/retrieved correctly |
| UPDATE candidate (stage, score, arrays) | PASS - All fields updated |
| QUERY with filters (gte, orderBy, take) | PASS - Filtered results returned |
| RELATION test (CandidateNote) | PASS - Note created, relation query works |
| DELETE candidate | PASS - Deleted and verified gone |
| Cascade delete (note with candidate) | PASS |

---

## 8. Connection Pooling Configuration

### Schema (`prisma/schema.prisma`)
```
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")    // Pooled (port 6543, pgbouncer=true)
  directUrl = env("POSTGRES_URL_NON_POOLING") // Direct (port 5432)
}
```
**Status:** PASS - Schema correctly configured with pooled URL for queries and direct URL for migrations.

### Environment Variables
| Variable | Port | PgBouncer | Purpose |
|----------|------|-----------|---------|
| POSTGRES_PRISMA_URL | 6543 | Yes (`pgbouncer=true`) | Runtime queries |
| POSTGRES_URL_NON_POOLING | 5432 | No | Migrations |

**Status:** PASS - Both URLs properly configured.

---

## 9. Issues Found

### ISSUE 1: `lib/db.ts` uses wrong env var (MEDIUM)

**File:** `lib/db.ts:9`

```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasourceUrl: process.env.DATABASE_URL,  // <-- WRONG
})
```

**Problem:** `lib/db.ts` overrides the Prisma datasource URL with `process.env.DATABASE_URL`, but `.env` does not define `DATABASE_URL`. The env file defines `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`.

**Impact:** When `DATABASE_URL` is undefined, the `datasourceUrl` override is `undefined`, and Prisma falls back to the schema-defined `POSTGRES_PRISMA_URL` — so **it works by accident**. However, this is fragile and confusing.

**Recommendation:** Either:
- (a) Remove the `datasourceUrl` override from `lib/db.ts` entirely (let schema handle it), OR
- (b) Change it to `process.env.POSTGRES_PRISMA_URL`, OR
- (c) Add `DATABASE_URL` to `.env` aliasing `POSTGRES_PRISMA_URL`

### ISSUE 2: `envSchema` requires `DATABASE_URL` (LOW)

**File:** `lib/validation/apiSchemas.ts:292`

```typescript
DATABASE_URL: z.string().min(1),
```

The Zod env validation schema requires `DATABASE_URL` but this var is not in `.env`. If this schema is validated at startup, it would fail. Currently it appears to not be enforced at runtime (app starts fine), but it's an inconsistency.

### ISSUE 3: Empty database (INFO)

All tables have 0 records. This is expected for a fresh PostgreSQL migration from SQLite, but confirms that **no data migration was performed**. If there was data in the old SQLite database, it was not transferred.

---

## 10. Existing Data Summary

| Model | Records |
|-------|---------|
| User | 0 |
| Candidate | 0 |
| CandidateNote | 0 |
| Payment | 0 |
| ProfileView | 0 |
| Search | 0 |
| SharedProfile | 0 |
| CreditLedger | 0 |
| StripeEvent | 0 |

---

## Summary

| Category | Status |
|----------|--------|
| Connection | PASS |
| Schema compliance | PASS |
| Migration status | PASS |
| Data types (arrays) | PASS |
| Data types (JSON) | PASS |
| Data types (enums) | PASS |
| Indexes | PASS (35 indexes verified) |
| Foreign keys | PASS (6 CASCADE constraints) |
| CRUD operations | PASS (all 7 operations) |
| Connection pooling config | PASS |
| `lib/db.ts` config | WARN - uses wrong env var name |
| `envSchema` validation | WARN - requires undefined `DATABASE_URL` |

**Overall: PASS with 2 warnings**

The PostgreSQL migration to Supabase is functionally complete. The database schema, types, indexes, constraints, and CRUD operations all work correctly. Two configuration inconsistencies were found regarding the `DATABASE_URL` env var naming that should be cleaned up.
