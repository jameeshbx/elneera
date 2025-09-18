-- Add bankData column to PaymentMethod table
ALTER TABLE "PaymentMethod" ADD COLUMN "bankData" JSONB;
