# SkillSync-RecruitOS - Deployment Guide

AI-powered recruiting platform with personality profiling, pipeline management, and Team Tailor integration.

---

## Prerequisites

- **Node.js**: 22.x (specified in package.json)
- **npm**: 10.x or higher
- **PostgreSQL**: 14+ (via Supabase or self-hosted)
- **Vercel account** (recommended) or Docker

---

## Environment Variables

### Required Variables

Create `.env.local` file in project root:

```bash
# ============================================
# AUTHENTICATION (NextAuth.js)
# ============================================

# Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com

# GitHub OAuth (user authentication)
# Create at: https://github.com/settings/developers
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret

# For backward compatibility
GITHUB_CLIENT_ID=$GITHUB_ID
GITHUB_CLIENT_SECRET=$GITHUB_SECRET

# ============================================
# AI SERVICES (Required)
# ============================================

# Google Gemini API (personality analysis)
# Get key: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Firecrawl API (job description scraping)
# Get key: https://firecrawl.dev
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# ============================================
# DATABASE
# ============================================

# PostgreSQL connection
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/recruitos

# Supabase (optional, for managed database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# ============================================
# PAYMENTS (Stripe)
# ============================================

# Get keys: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Webhook secret (for payment confirmations)
# Get from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Pricing plan IDs (create in Stripe dashboard)
STRIPE_PERSONALITY_PRICE_ID=price_personality_profile_id
STRIPE_RECRUITING_PRICE_ID=price_recruiting_id

# ============================================
# INTEGRATIONS
# ============================================

# Team Tailor ATS (Danish market)
# Get token: https://www.teamtailor.com/en/settings/api
TEAMTAILOR_API_TOKEN=your_teamtailor_api_token
# TEAMTAILOR_API_URL=https://api.teamtailor.com (optional)

# BrightData (LinkedIn profile extraction, optional)
BRIGHTDATA_API_KEY=your_brightdata_api_key

# OpenRouter (alternative AI inference, optional)
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Optional Variables

```bash
# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

---

## Local Development

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Set up database
npx prisma generate
npx prisma db push
# Or run migrations:
npx prisma migrate dev

# 4. Seed database (optional)
npx prisma db seed

# 5. Start development server
npm run dev
```

**Access:** http://localhost:3000

### Database Setup

**Using Prisma:**

```bash
# Generate Prisma Client
npx prisma generate

# Create/update database schema
npx prisma db push

# Or run migrations (recommended for production)
npx prisma migrate dev --name init

# Open Prisma Studio (database GUI)
npx prisma studio
```

**Using Supabase:**

1. Create project at https://supabase.com
2. Copy database URL from Settings → Database
3. Update `DATABASE_URL` in `.env.local`
4. Run migrations: `npx prisma db push`

---

## Production Deployment

### Option 1: Vercel (Recommended)

**Deploy via CLI:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

**Deploy via GitHub:**

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. Add environment variables in Vercel dashboard (Settings → Environment Variables)
5. Deploy

**Post-Deployment:**

```bash
# Run database migrations on production database
npx prisma migrate deploy

# Or if using db push:
npx prisma db push
```

**Custom Domain:**

1. Go to Vercel dashboard → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Configure DNS:
   - **A Record**: Point to Vercel IP
   - **Or CNAME**: Point to `cname.vercel-dns.com`
4. Update `NEXTAUTH_URL` in environment variables

---

### Option 2: Docker Deployment

**Create `Dockerfile`:**

```dockerfile
FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Update `next.config.js`:**

```javascript
module.exports = {
  output: 'standalone',
  // ... other config
}
```

**Create `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=recruitos
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=recruitos
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy with Docker:**

```bash
# 1. Build image
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Run migrations
docker-compose exec app npx prisma migrate deploy

# 4. Check logs
docker-compose logs -f app
```

---

### Option 3: VPS Deployment (Ubuntu)

**Prerequisites:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2
sudo npm install -g pm2
```

**Deployment Steps:**

```bash
# 1. Clone repository
git clone <repo-url> /opt/skillsync-recruitos
cd /opt/skillsync-recruitos

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
nano .env.local  # Edit with production values

# 4. Generate Prisma Client
npx prisma generate

# 5. Run migrations
npx prisma migrate deploy

# 6. Build application
npm run build

# 7. Start with PM2
pm2 start npm --name "recruitos" -- start

# 8. Configure PM2 to start on boot
pm2 startup
pm2 save

# 9. Set up Nginx reverse proxy
sudo nano /etc/nginx/sites-available/recruitos
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/recruitos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Database Migrations

### Development

```bash
# Create new migration
npx prisma migrate dev --name add_feature

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Production

```bash
# Deploy migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Rollback

```bash
# Revert last migration (manual process)
# 1. Identify migration to rollback
ls prisma/migrations/

# 2. Manually run down migration SQL
# 3. Remove migration folder
rm -rf prisma/migrations/YYYYMMDDHHMMSS_migration_name/

# 4. Re-run migrations
npx prisma migrate deploy
```

---

## API Integrations Setup

### Stripe Payment Setup

1. **Create Stripe Account**: https://dashboard.stripe.com
2. **Create Products:**
   - Personality Profile: 2,000 DKK (one-time)
   - Full Recruiting: 5,000 DKK per hire
3. **Get Price IDs** from Stripe dashboard
4. **Set up Webhook:**
   ```bash
   # Endpoint: https://your-domain.com/api/webhooks/stripe
   # Canonical endpoint: /api/webhooks/stripe
   # Legacy endpoint: /api/stripe/webhook (deprecated, sunset December 31, 2026)
   # Events to listen:
   - checkout.session.completed
   - payment_intent.succeeded
   - payment_intent.payment_failed
   ```
5. **Copy Webhook Secret** to `STRIPE_WEBHOOK_SECRET`

### Team Tailor Integration

1. **Get API Token**: https://www.teamtailor.com/en/settings/api
2. **Add to environment:** `TEAMTAILOR_API_TOKEN=your_token`
3. **Test connection:**
   ```bash
   curl -H "Authorization: Token token=YOUR_TOKEN" \
        https://api.teamtailor.com/v1/jobs
   ```

### Google Gemini Setup

1. **Get API Key**: https://aistudio.google.com/apikey
2. **Add to environment:** `GEMINI_API_KEY=your_key`
3. **Test:**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
   ```

---

## Common Issues & Troubleshooting

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
npm run build
```

### Issue: Database connection failed

**Solution:**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/database

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: NextAuth session not persisting

**Solution:**
```bash
# Verify NEXTAUTH_URL matches your domain
echo $NEXTAUTH_URL

# Verify NEXTAUTH_SECRET is set
echo $NEXTAUTH_SECRET | wc -c  # Should be > 32 characters

# Check cookies in browser DevTools
```

### Issue: Stripe webhook not working

**Solution:**
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Deprecated compatibility endpoint (avoid for new setups)
# stripe listen --forward-to localhost:3000/api/stripe/webhook

# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Check webhook logs in Stripe dashboard
```

### Issue: Build fails with "Module not found"

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

---

## Monitoring & Maintenance

### Health Checks

**Application Health:**
```bash
curl https://your-domain.com/api/health
# Expected: {"status": "ok"}
```

**Database Health:**
```bash
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Logs

**Vercel Logs:**
```bash
vercel logs --follow
```

**PM2 Logs:**
```bash
pm2 logs recruitos
pm2 monit  # Real-time monitoring
```

**Docker Logs:**
```bash
docker-compose logs -f app
```

### Updates

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run migrations
npx prisma migrate deploy

# 4. Rebuild
npm run build

# 5. Restart
# Vercel: Automatic on git push
# PM2: pm2 restart recruitos
# Docker: docker-compose restart app
```

---

## Backup & Restore

### Database Backup

**PostgreSQL:**
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250203.sql
```

**Automated Backup (cron):**
```bash
# Add to crontab
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/recruitos-$(date +\%Y\%m\%d).sql.gz
```

### Application Backup

```bash
# Backup environment
cp .env.local .env.local.backup

# Backup uploaded files (if any)
tar -czf uploads-backup.tar.gz public/uploads/

# Backup database
pg_dump $DATABASE_URL | gzip > db-backup.sql.gz
```

---

## Security Best Practices

1. **Environment Variables**:
   - Never commit `.env` files
   - Use Vercel environment variables for secrets
   - Rotate API keys quarterly

2. **Database**:
   - Use strong passwords
   - Enable SSL for database connections
   - Implement row-level security (RLS) if using Supabase

3. **Authentication**:
   - Use HTTPS only in production
   - Set secure cookie flags in NextAuth
   - Implement rate limiting on auth endpoints

4. **API Security**:
   - Validate all inputs with Zod schemas
   - Implement CSRF protection
   - Use API rate limiting

5. **Stripe**:
   - Always verify webhook signatures
   - Never trust client-side payment amounts
   - Log all payment events

---

## Performance Optimization

### Next.js Optimization

```javascript
// next.config.js
module.exports = {
  // Enable SWC minification
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable compression
  compress: true,
  
  // Production source maps (disable for speed)
  productionBrowserSourceMaps: false,
}
```

### Database Optimization

```bash
# Add database indexes
npx prisma studio
# Or add to schema.prisma:

model Candidate {
  @@index([email])
  @@index([status])
  @@index([createdAt])
}
```

### Caching

```javascript
// Enable Next.js ISR (Incremental Static Regeneration)
export async function getStaticProps() {
  return {
    props: { ... },
    revalidate: 60, // Revalidate every 60 seconds
  }
}
```

---

## Support & Resources

- **API Documentation**: `/api` folder
- **Prisma Schema**: `prisma/schema.prisma`
- **Component Library**: Shadcn/UI documentation
- **Team Tailor API**: https://docs.teamtailor.com

---

**Last Updated**: 2025-02-03  
**Version**: 0.2.0
