-- Add emailSent and whatsappSent columns to sent_itineraries table
ALTER TABLE "sent_itineraries" 
ADD COLUMN IF NOT EXISTS "emailSent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "whatsappSent" BOOLEAN DEFAULT false;

-- Update existing records to have default values based on status
UPDATE "sent_itineraries" 
SET 
  "emailSent" = CASE 
    WHEN "status" = 'sent' THEN true 
    WHEN "status" = 'delivered' THEN true
    ELSE false 
  END,
  "whatsappSent" = CASE 
    WHEN "status" = 'sent' THEN true 
    WHEN "status" = 'delivered' THEN true
    ELSE false 
  END
WHERE "emailSent" IS NULL OR "whatsappSent" IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "idx_sent_itineraries_email_whatsapp" ON "sent_itineraries" ("emailSent", "whatsappSent");
CREATE INDEX IF NOT EXISTS "idx_sent_itineraries_status" ON "sent_itineraries" ("status");
CREATE INDEX IF NOT EXISTS "idx_sent_itineraries_sent_date" ON "sent_itineraries" ("sentDate");
