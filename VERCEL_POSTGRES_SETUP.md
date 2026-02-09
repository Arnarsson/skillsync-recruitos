# Vercel Postgres Setup Instructions

## Step 1: Create Database (Web Dashboard)
1. Go to: https://vercel.com/arnarssons-projects/skillsync-recruitos/stores
2. Click "Create Database" → "Postgres"
3. Name: `recruitos-db`
4. Region: Select closest to Denmark (Frankfurt)
5. Click "Create"

## Step 2: Verify Environment Variables
Vercel automatically adds:
- `POSTGRES_URL` - Pooled connection
- `POSTGRES_URL_NON_POOLING` - Direct connection
- `POSTGRES_PRISMA_URL` - For Prisma (with pgbouncer=true)

## Step 3: Configure Prisma to Use Vercel Postgres

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL") // Uses connection pooling
  directUrl = env("POSTGRES_URL_NON_POOLING") // Uses direct connection
}
```

## Step 4: Convert Array Fields Back to PostgreSQL Types

Change these 9 fields from `Json?` to proper arrays:

**In Candidate model:**
- `scoreDrivers: Json?` → `scoreDrivers: String[]`
- `scoreDrags: Json?` → `scoreDrags: String[]`
- `unlockedSteps: Json?` → `unlockedSteps: Int[]`
- `keyEvidence: Json?` → `keyEvidence: String[]`
- `risks: Json?` → `risks: String[]`

**In SharedProfile model:**
- `skills: Json?` → `skills: String[]`
- `keyEvidence: Json?` → `keyEvidence: String[]`
- `risks: Json?` → `risks: String[]`

**In CandidateNote model:**
- `tags: Json?` → `tags: String[]`

## Step 5: Pull Environment Variables Locally

```bash
vercel env pull .env.production
```

## Step 6: Generate Migration

```bash
# Generate Prisma client with PostgreSQL types
npx prisma generate

# Create migration
npx prisma migrate dev --name vercel_postgres_migration
```

## Step 7: Deploy Migration to Vercel

```bash
# Push migration to git
git add prisma/
git commit -m "[db] Migrate to Vercel Postgres"
git push

# The migration will run automatically on Vercel deploy
# Or run manually:
vercel env pull
npx prisma migrate deploy
```

## Step 8: Verify Deployment

Check deployment logs:
```bash
vercel logs
```

Test the deployed app works with the new database.

---

## Rollback (if needed)

If something goes wrong, revert to SQLite:
```prisma
provider = "sqlite"
url = env("DATABASE_URL")
```

And revert the array fields back to `Json?`.
