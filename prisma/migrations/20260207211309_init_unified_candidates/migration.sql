-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "githubId" TEXT NOT NULL,
    "githubToken" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "creditUsed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentRole" TEXT,
    "company" TEXT,
    "location" TEXT,
    "avatar" TEXT,
    "skills" JSONB,
    "yearsExperience" INTEGER,
    "persona" JSONB,
    "scoreBreakdown" JSONB,
    "keyEvidence" JSONB,
    "risks" JSONB,
    "alignmentScore" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "headline" TEXT,
    "currentRole" TEXT,
    "company" TEXT,
    "location" TEXT,
    "avatar" TEXT,
    "sourceType" TEXT NOT NULL,
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
    "alignmentScore" REAL,
    "scoreBreakdown" JSONB,
    "scoreConfidence" TEXT,
    "scoreDrivers" JSONB,
    "scoreDrags" JSONB,
    "persona" JSONB,
    "deepAnalysis" TEXT,
    "companyMatch" JSONB,
    "indicators" JSONB,
    "interviewGuide" JSONB,
    "networkDossier" JSONB,
    "advancedProfile" JSONB,
    "buildprint" JSONB,
    "pipelineStage" TEXT NOT NULL DEFAULT 'sourced',
    "unlockedSteps" JSONB,
    "shortlistSummary" TEXT,
    "keyEvidence" JSONB,
    "risks" JSONB,
    "connectionDegree" TEXT,
    "mutualConnections" TEXT,
    "openToWork" BOOLEAN,
    "isPremium" BOOLEAN,
    "rawProfileText" TEXT,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CandidateNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "Candidate_githubUsername_userId_key" ON "Candidate"("githubUsername", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_linkedinId_userId_key" ON "Candidate"("linkedinId", "userId");

-- CreateIndex
CREATE INDEX "CandidateNote_candidateId_idx" ON "CandidateNote"("candidateId");
