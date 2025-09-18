-- First, update all existing records to use the correct value
UPDATE "User" SET "businessType" = 'TREKKING_MYLES' WHERE "businessType" = 'TREKKING_MYLES';
UPDATE "User" SET "userType" = 'TREKKING_MYLES' WHERE "userType" = 'TREKKING_MYLES';

-- Now, drop and recreate the enums with the correct values
-- First drop the foreign key constraints that might reference these enums
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_businessType_fkey";

-- Create new enums with correct values
CREATE TYPE "BusinessType_new" AS ENUM ('TREKKING_MYLES', 'AGENCY', 'DMC');
CREATE TYPE "UserType_new" AS ENUM ('TREKKING_MYLES', 'AGENCY', 'DMC');

-- Update the columns to use the new enums
ALTER TABLE "User" 
  ALTER COLUMN "businessType" TYPE TEXT,
  ALTER COLUMN "userType" TYPE TEXT;

-- Now update to the new enum types
ALTER TABLE "User" 
  ALTER COLUMN "businessType" TYPE "BusinessType_new" USING ("businessType"::text::"BusinessType_new"),
  ALTER COLUMN "userType" TYPE "UserType_new" USING ("userType"::text::"UserType_new");

-- Drop the old enums
DROP TYPE IF EXISTS "BusinessType";
DROP TYPE IF EXISTS "UserType";

-- Rename the new enums to the original names
ALTER TYPE "BusinessType_new" RENAME TO "BusinessType";
ALTER TYPE "UserType_new" RENAME TO "UserType";
