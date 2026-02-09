-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('GITHUB', 'LINKEDIN', 'MANUAL');

-- CreateEnum
CREATE TYPE "CreditReason" AS ENUM ('CONSUMPTION', 'PURCHASE', 'SUBSCRIPTION', 'SIGNUP_BONUS', 'REFUND', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "githubId" TEXT,
    "githubToken" TEXT,
    "passwordHash" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "creditUsed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'dkk',
    "credits" INTEGER NOT NULL,
    "packageId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedProfile" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentRole" TEXT,
    "company" TEXT,
    "location" TEXT,
    "avatar" TEXT,
    "skills" TEXT[],
    "yearsExperience" INTEGER,
    "persona" JSONB,
    "scoreBreakdown" JSONB,
    "keyEvidence" TEXT[],
    "risks" TEXT[],
    "alignmentScore" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "headline" TEXT,
    "currentRole" TEXT,
    "company" TEXT,
    "location" TEXT,
    "avatar" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "githubUsername" TEXT,
    "linkedinId" TEXT,
    "linkedinUrl" TEXT,
    "sourceUrl" TEXT,
    "yearsExperience" INTEGER,
    "experience" JSONB,
    "education" JSONB,
    "certifications" JSONB,
    "spokenLanguages" JSONB,
    "skills" JSONB,
    "codingLanguages" JSONB,
    "alignmentScore" DOUBLE PRECISION,
    "scoreBreakdown" JSONB,
    "scoreConfidence" TEXT,
    "scoreDrivers" TEXT[],
    "scoreDrags" TEXT[],
    "persona" JSONB,
    "deepAnalysis" TEXT,
    "companyMatch" JSONB,
    "indicators" JSONB,
    "interviewGuide" JSONB,
    "networkDossier" JSONB,
    "advancedProfile" JSONB,
    "buildprint" JSONB,
    "pipelineStage" TEXT NOT NULL DEFAULT 'sourced',
    "unlockedSteps" INTEGER[],
    "shortlistSummary" TEXT,
    "keyEvidence" JSONB,
    "risks" JSONB,
    "connectionDegree" TEXT,
    "mutualConnections" TEXT,
    "openToWork" BOOLEAN,
    "isPremium" BOOLEAN,
    "rawProfileText" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateNote" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "CreditReason" NOT NULL,
    "balance" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "ProfileView_userId_idx" ON "ProfileView"("userId");

-- CreateIndex
CREATE INDEX "ProfileView_username_idx" ON "ProfileView"("username");

-- CreateIndex
CREATE INDEX "Search_userId_idx" ON "Search"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "SharedProfile_candidateId_idx" ON "SharedProfile"("candidateId");

-- CreateIndex
CREATE INDEX "SharedProfile_createdBy_idx" ON "SharedProfile"("createdBy");

-- CreateIndex
CREATE INDEX "SharedProfile_isActive_idx" ON "SharedProfile"("isActive");

-- CreateIndex
CREATE INDEX "Candidate_userId_idx" ON "Candidate"("userId");

-- CreateIndex
CREATE INDEX "Candidate_pipelineStage_idx" ON "Candidate"("pipelineStage");

-- CreateIndex
CREATE INDEX "Candidate_alignmentScore_idx" ON "Candidate"("alignmentScore");

-- CreateIndex
CREATE INDEX "Candidate_sourceType_idx" ON "Candidate"("sourceType");

-- CreateIndex
CREATE INDEX "Candidate_createdAt_idx" ON "Candidate"("createdAt");

-- CreateIndex
CREATE INDEX "Candidate_name_idx" ON "Candidate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_githubUsername_userId_key" ON "Candidate"("githubUsername", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_linkedinId_userId_key" ON "Candidate"("linkedinId", "userId");

-- CreateIndex
CREATE INDEX "CandidateNote_candidateId_idx" ON "CandidateNote"("candidateId");

-- CreateIndex
CREATE INDEX "CreditLedger_userId_idx" ON "CreditLedger"("userId");

-- CreateIndex
CREATE INDEX "CreditLedger_createdAt_idx" ON "CreditLedger"("createdAt");

-- CreateIndex
CREATE INDEX "CreditLedger_reason_idx" ON "CreditLedger"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "StripeEvent_eventId_key" ON "StripeEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeEvent_createdAt_idx" ON "StripeEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Search" ADD CONSTRAINT "Search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

