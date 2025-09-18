-- First, update all existing records to use a temporary value
UPDATE "User" SET "businessType" = 'AGENCY' WHERE "businessType" = 'TREKKING_MYLES';
UPDATE "User" SET "userType" = 'AGENCY' WHERE "userType" = 'TREKKING_MYLES';

-- Now drop and recreate the enums with the correct values
DROP TYPE IF EXISTS "BusinessType" CASCADE;
CREATE TYPE "BusinessType" AS ENUM ('TREKKING_MYLES', 'AGENCY', 'DMC');

-- Update the columns to use the correct values
UPDATE "User" SET "businessType" = 'TREKKING_MYLES' WHERE "businessType" = 'AGENCY' AND "email" LIKE '%trekking%';

-- Repeat for UserType
DROP TYPE IF EXISTS "UserType" CASCADE;
CREATE TYPE "UserType" AS ENUM ('TREKKING_MYLES', 'AGENCY', 'DMC');

-- Update the columns to use the correct values
UPDATE "User" SET "userType" = 'TREKKING_MYLES' WHERE "userType" = 'AGENCY' AND "email" LIKE '%trekking%';
