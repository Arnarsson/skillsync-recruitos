-- CreateTable
CREATE TABLE "LinkedinMessage" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'linkedin',
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TEXT,
    "conversationWith" TEXT,
    "threadUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'linkedin_extension',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinMessage_dedupeKey_key" ON "LinkedinMessage"("dedupeKey");

-- CreateIndex
CREATE INDEX "LinkedinMessage_sender_idx" ON "LinkedinMessage"("sender");

-- CreateIndex
CREATE INDEX "LinkedinMessage_conversationWith_idx" ON "LinkedinMessage"("conversationWith");

-- CreateIndex
CREATE INDEX "LinkedinMessage_threadUrl_idx" ON "LinkedinMessage"("threadUrl");

-- CreateIndex
CREATE INDEX "LinkedinMessage_createdAt_idx" ON "LinkedinMessage"("createdAt");
