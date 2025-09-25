-- Add agencyFormLogoId column to AgencyForm table
ALTER TABLE "AgencyForm" ADD COLUMN "agencyFormLogoId" TEXT;

-- Add unique constraint
ALTER TABLE "AgencyForm" ADD CONSTRAINT "AgencyForm_agencyFormLogoId_key" UNIQUE ("agencyFormLogoId");

-- Add index
CREATE INDEX "AgencyForm_agencyFormLogoId_idx" ON "AgencyForm"("agencyFormLogoId");
