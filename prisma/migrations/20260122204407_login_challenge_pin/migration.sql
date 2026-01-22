-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "pinVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LoginChallenge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tabletId" TEXT,
    "pinHash" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginChallenge_organizationId_expiresAt_idx" ON "LoginChallenge"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "LoginChallenge_tokenHash_idx" ON "LoginChallenge"("tokenHash");

-- AddForeignKey
ALTER TABLE "LoginChallenge" ADD CONSTRAINT "LoginChallenge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginChallenge" ADD CONSTRAINT "LoginChallenge_tabletId_fkey" FOREIGN KEY ("tabletId") REFERENCES "Tablet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
