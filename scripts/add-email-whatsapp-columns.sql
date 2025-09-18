-- Add emailSent and whatsappSent columns to SentItinerary table
ALTER TABLE "SentItinerary" 
ADD COLUMN IF NOT EXISTS "emailSent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "whatsappSent" BOOLEAN DEFAULT false;

-- Update existing records to have default values
UPDATE "SentItinerary" 
SET "emailSent" = CASE 
    WHEN "status" = 'sent' THEN true 
    ELSE false 
END,
"whatsappSent" = CASE 
    WHEN "status" = 'sent' THEN true 
    ELSE false 
END
WHERE "emailSent" IS NULL OR "whatsappSent" IS NULL;
