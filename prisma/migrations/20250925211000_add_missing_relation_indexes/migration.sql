-- Add missing indexes for relation fields to improve performance with relationMode=prisma

-- Add index for DMC.createdBy
CREATE INDEX IF NOT EXISTS "DMC_createdBy_idx" ON "DMC"("createdBy");

-- Add index for quotes.dmcId
CREATE INDEX IF NOT EXISTS "quotes_dmcId_idx" ON "quotes"("dmcId");

-- Add index for enquiries.agencyId
CREATE INDEX IF NOT EXISTS "enquiries_agencyId_idx" ON "enquiries"("agencyId");

-- Add index for FlightEnquiry.createdBy
CREATE INDEX IF NOT EXISTS "flight_enquiries_createdBy_idx" ON "flight_enquiries"("createdBy");

-- Add index for AccommodationEnquiry.createdBy
CREATE INDEX IF NOT EXISTS "accommodation_enquiries_createdBy_idx" ON "accommodation_enquiries"("createdBy");
