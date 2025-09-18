-- Add email and WhatsApp tracking columns to SentItinerary table
ALTER TABLE "SentItinerary" 
ADD COLUMN "emailSent" BOOLEAN DEFAULT false,
ADD COLUMN "whatsappSent" BOOLEAN DEFAULT false;

-- Update existing records to have default values
UPDATE "SentItinerary" 
SET "emailSent" = true, "whatsappSent" = true 
WHERE "status" = 'sent';
