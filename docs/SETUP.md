# SkillSync Clone - Setup Guide

## Prerequisites

- Node.js 20+
- npm or yarn
- GitHub OAuth application (for authentication)

## Quick Start

### 1. Install Dependencies

```bash
cd skillsync-clone
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-key

# Create at: https://github.com/settings/developers
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

### 3. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name:** SkillSync Clone
   - **Homepage URL:** http://localhost:3000
   - **Authorization callback URL:** http://localhost:3000/api/auth/callback/github
4. Copy the Client ID and generate a Client Secret
5. Add to your `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Docker Deployment

### Build and run with Docker Compose:

```bash
# Create .env file with your secrets
cp .env.example .env

# Build and start
docker-compose up --build
```

### Manual Docker build:

```bash
docker build -t skillsync-clone .
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=your-secret \
  -e GITHUB_CLIENT_ID=your-id \
  -e GITHUB_CLIENT_SECRET=your-secret \
  skillsync-clone
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
skillsync-clone/
├── app/                    # Next.js App Router pages
│   ├── api/auth/           # NextAuth API routes
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── search/             # Search results page
│   └── profile/[username]/ # Profile page
├── components/             # React components
├── lib/                    # Utilities and config
├── docs/                   # Documentation
└── public/                 # Static assets
```
