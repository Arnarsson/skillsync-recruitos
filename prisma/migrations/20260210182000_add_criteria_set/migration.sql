-- CreateTable
CREATE TABLE "CriteriaSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriteriaSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CriteriaSet_userId_idx" ON "CriteriaSet"("userId");

-- CreateIndex
CREATE INDEX "CriteriaSet_createdAt_idx" ON "CriteriaSet"("createdAt");

-- AddForeignKey
ALTER TABLE "CriteriaSet" ADD CONSTRAINT "CriteriaSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
