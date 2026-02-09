# SkillSync-RecruitOS

AI-powered recruiting platform with personality profiling, intelligent candidate matching, and seamless ATS integration for the Danish market.

---

## Features

### 🧠 AI-Powered Candidate Analysis
- **Personality Profiling**: Deep psychological assessment using Google Gemini AI
- **Skill Extraction**: Automatic skill mapping from resumes and profiles
- **Cultural Fit Scoring**: Match candidates to company culture and values
- **Career Trajectory Analysis**: Predict candidate growth potential

### 📊 Intelligent Pipeline Management
- **Drag & Drop Kanban Board**: Visual pipeline with customizable stages
- **Automated Stage Transitions**: Smart workflows based on candidate actions
- **Bulk Operations**: Process multiple candidates simultaneously
- **Custom Filters & Views**: Create saved views for different hiring scenarios

### 🔗 Team Tailor Integration
- **Two-Way Sync**: Seamless integration with Denmark's leading ATS
- **Job Import**: Pull job listings directly from Team Tailor
- **Candidate Sync**: Push/pull candidate data bidirectionally
- **Application Tracking**: Monitor candidates across both platforms

### 💰 Flexible Pricing Models
- **Pay-Per-Profile**: 2,000 DKK for personality assessment only
- **Success-Based**: 5,000 DKK per successful hire (no upfront cost)
- **Credit System**: Purchase credits for on-demand analysis
- **Stripe Integration**: Secure payment processing

### 📈 Analytics & Reporting
- **Hiring Metrics**: Time-to-hire, pipeline conversion rates, source effectiveness
- **Candidate Insights**: Skill distribution, experience levels, cultural fit scores
- **Team Performance**: Recruiter activity, candidate engagement metrics
- **Custom Reports**: Export data for external analysis

### 🔍 Advanced Search & Filtering
- **Boolean Search**: Complex queries for precise candidate matching
- **Skill-Based Filters**: Find candidates by specific competencies
- **Location & Remote Preferences**: Filter by geography and work arrangement
- **Experience Ranges**: Target candidates at specific career stages

### 🤖 Automated Workflows
- **Email Templates**: Personalized outreach campaigns
- **Interview Scheduling**: Calendar integration and automated reminders
- **Follow-Up Automation**: Never miss a candidate touchpoint
- **Rejection Templates**: Compassionate, branded rejection emails

### 🔐 Enterprise Security
- **SSO Integration**: GitHub OAuth (expandable to SAML/OIDC)
- **Role-Based Access Control**: Team, manager, admin permissions
- **Audit Logs**: Track all user actions for compliance
- **Data Encryption**: At-rest and in-transit encryption

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + Shadcn/UI
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: Google Gemini API
- **Payments**: Stripe
- **ATS Integration**: Team Tailor API
- **Deployment**: Vercel (recommended)

---

## Quick Start

### Prerequisites
- Node.js 22.x
- PostgreSQL 14+
- Stripe account (for payments)
- Google Gemini API key
- Team Tailor API token (optional)

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd skillsync-recruitos

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see docs/DEPLOYMENT.md)

# 4. Set up database
npx prisma generate
npx prisma db push

# 5. Seed sample data (optional)
npm run db:seed

# 6. Start development server
npm run dev
```

**Access**: http://localhost:3000

---

## Project Structure

```
skillsync-recruitos/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── analyse/       # AI analysis endpoints
│   │   ├── auth/          # NextAuth handlers
│   │   ├── credits/       # Credit management
│   │   ├── pipeline/      # Pipeline CRUD
│   │   └── webhooks/      # Stripe webhooks
│   ├── dashboard/         # Main dashboard
│   ├── pipeline/          # Kanban board
│   ├── analyse/           # Candidate analysis
│   ├── pricing/           # Pricing plans
│   └── login/             # Authentication
├── components/            # React components
│   ├── ui/               # Shadcn/UI primitives
│   ├── pipeline/         # Pipeline-specific
│   └── analyse/          # Analysis views
├── lib/                   # Utilities
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # NextAuth config
│   └── stripe.ts         # Stripe helpers
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── docs/                 # Documentation
```

---

## Configuration

### Environment Variables

See `.env.example` for all required variables. Key configurations:

**Authentication:**
```bash
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
```

**AI Services:**
```bash
GEMINI_API_KEY=your_gemini_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

**Database:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/recruitos
```

**Payments:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
Stripe webhook endpoint (canonical): `/api/webhooks/stripe`
Legacy compatibility endpoint: `/api/stripe/webhook` (deprecated, sunset December 31, 2026)

**Full documentation**: See `docs/DEPLOYMENT.md`

---

## API Reference

### Authentication
```typescript
POST /api/auth/signin      # Sign in with provider
POST /api/auth/signout     # Sign out
GET  /api/auth/session     # Get current session
```

### Candidate Analysis
```typescript
POST /api/analyse/linkedin    # Analyze LinkedIn profile
POST /api/analyse/cv          # Analyze uploaded CV
GET  /api/analyse/[id]        # Get analysis results
```

### Pipeline Management
```typescript
GET    /api/pipeline                    # List all candidates
POST   /api/pipeline                    # Add candidate
PUT    /api/pipeline/[id]               # Update candidate
DELETE /api/pipeline/[id]               # Remove candidate
POST   /api/pipeline/[id]/move          # Move to stage
POST   /api/pipeline/batch              # Bulk operations
```

### Credits
```typescript
GET  /api/credits              # Get user balance
POST /api/credits/purchase     # Create Stripe checkout
POST /api/credits/spend        # Deduct credits
```

### Team Tailor Integration
```typescript
GET  /api/integrations/teamtailor/jobs         # Fetch jobs
POST /api/integrations/teamtailor/candidates   # Push candidate
GET  /api/integrations/teamtailor/sync         # Two-way sync
```

**Full API docs**: See `/docs/api.md`

---

## Development

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui      # Interactive mode
```

### Database Management

```bash
# Create migration
npx prisma migrate dev --name add_feature

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed data
npm run db:seed
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Docker

```bash
# Build and run
docker-compose up --build -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

### VPS

See `docs/DEPLOYMENT.md` for detailed VPS deployment instructions with PM2 and Nginx.

**Full deployment guide**: See `docs/DEPLOYMENT.md`

---

## Features Roadmap

### Current (v0.2.0)
- ✅ AI personality profiling
- ✅ Pipeline management
- ✅ Team Tailor integration
- ✅ Stripe payments
- ✅ Credit system

### Planned (v0.3.0)
- 🔄 Advanced analytics dashboard
- 🔄 Email automation
- 🔄 Interview scheduling
- 🔄 Multi-language support
- 🔄 Mobile app (React Native)

### Future
- 📋 Chrome extension for LinkedIn
- 📋 Slack/Teams integration
- 📋 Custom AI model fine-tuning
- 📋 White-label solution
- 📋 API marketplace

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

**Code standards:**
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Test coverage > 80%

---

## License

Private - © 2025

---

## Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@yourdomain.com
- **Slack**: [Join our community](#)

---

**Version**: 0.2.0  
**Last Updated**: 2025-02-03  
**Maintainer**: Your Team
