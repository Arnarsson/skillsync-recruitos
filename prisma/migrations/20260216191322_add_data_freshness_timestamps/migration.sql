-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "githubFetchedAt" TIMESTAMP(3),
ADD COLUMN     "linkedinFetchedAt" TIMESTAMP(3);
