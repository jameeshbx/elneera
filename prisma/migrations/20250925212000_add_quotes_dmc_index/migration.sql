-- Add index for quotes.dmcId relation field
CREATE INDEX IF NOT EXISTS "quotes_dmcId_idx" ON "quotes"("dmcId");
