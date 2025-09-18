-- First, update all existing records to use 'TREKKING_MYLES' instead of 'TREKKING_MYLES'
UPDATE "User" SET "businessType" = 'TREKKING_MYLES' WHERE "businessType" = 'TREKKING_MYLES';
UPDATE "User" SET "userType" = 'TREKKING_MYLES' WHERE "userType" = 'TREKKING_MYLES';

-- Now, drop and recreate the enums with the correct values
-- First, drop any constraints that might be using these enums
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_businessType_fkey";

-- Create a new enum type with the correct spelling
CREATE TYPE "BusinessType_new" AS ENUM ('TREKKING_MYLES', 'AGENCY', 'DMC');

-- Update the existing column to use the new enum
ALTER TABLE "User" 
  ALTER COLUMN "businessType" TYPE TEXT;

-- Update to the new enum type
ALTER TABLE "User" 
  ALTER COLUMN "businessType" TYPE "BusinessType_new" 
  USING ("businessType"::text::"BusinessType_new");

-- Drop the old enum
DROP TYPE "BusinessType";

-- Rename the new enum to the original name
ALTER TYPE "BusinessType_new" RENAME TO "BusinessType";

-- Repeat the same for UserType
CREATE TYPE "UserType_new" AS ENUM ('TREKKING_MYLES', 'AGENCY', 'DMC');

ALTER TABLE "User" 
  ALTER COLUMN "userType" TYPE TEXT;

ALTER TABLE "User" 
  ALTER COLUMN "userType" TYPE "UserType_new" 
  USING ("userType"::text::"UserType_new");

DROP TYPE "UserType";
ALTER TYPE "UserType_new" RENAME TO "UserType";
