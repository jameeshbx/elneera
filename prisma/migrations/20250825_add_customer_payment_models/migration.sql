-- CreateEnum
CREATE TYPE "CustomerPaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerPaymentMethodType" AS ENUM ('BANK_TRANSFER', 'UPI_METHOD', 'CASH', 'PAYMENT_LINK', 'CREDIT_CARD', 'DEBIT_CARD');

-- CreateEnum
CREATE TYPE "ShareMethod" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "PaymentReminderStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "customer_payments" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "itineraryReference" TEXT NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3),
    "remainingBalance" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "CustomerPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "shareMethod" "ShareMethod" NOT NULL DEFAULT 'EMAIL',
    "paymentLink" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "customerId" TEXT,
    "enquiryId" TEXT,
    "itineraryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "customer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payment_history" (
    "id" TEXT NOT NULL,
    "customerPaymentId" TEXT NOT NULL,
    "paymentMethod" "CustomerPaymentMethodType" NOT NULL DEFAULT 'BANK_TRANSFER',
    "paidDate" TIMESTAMP(3) NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "pendingAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "transactionId" TEXT,
    "invoiceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "customer_payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payment_reminders" (
    "id" TEXT NOT NULL,
    "customerPaymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledTime" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" "PaymentReminderStatus" NOT NULL DEFAULT 'PENDING',
    "method" "ShareMethod" NOT NULL DEFAULT 'EMAIL',
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "customer_payment_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payment_receipts" (
    "id" TEXT NOT NULL,
    "customerPaymentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "customer_payment_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_payments_customerId_idx" ON "customer_payments"("customerId");

-- CreateIndex
CREATE INDEX "customer_payments_enquiryId_idx" ON "customer_payments"("enquiryId");

-- CreateIndex
CREATE INDEX "customer_payments_itineraryId_idx" ON "customer_payments"("itineraryId");

-- CreateIndex
CREATE INDEX "customer_payments_paymentStatus_idx" ON "customer_payments"("paymentStatus");

-- CreateIndex
CREATE INDEX "customer_payments_itineraryReference_idx" ON "customer_payments"("itineraryReference");

-- CreateIndex
CREATE INDEX "customer_payment_history_customerPaymentId_idx" ON "customer_payment_history"("customerPaymentId");

-- CreateIndex
CREATE INDEX "customer_payment_history_paidDate_idx" ON "customer_payment_history"("paidDate");

-- CreateIndex
CREATE INDEX "customer_payment_history_status_idx" ON "customer_payment_history"("status");

-- CreateIndex
CREATE INDEX "customer_payment_reminders_customerPaymentId_idx" ON "customer_payment_reminders"("customerPaymentId");

-- CreateIndex
CREATE INDEX "customer_payment_reminders_status_idx" ON "customer_payment_reminders"("status");

-- CreateIndex
CREATE INDEX "customer_payment_reminders_scheduledDate_idx" ON "customer_payment_reminders"("scheduledDate");

-- CreateIndex
CREATE INDEX "customer_payment_receipts_customerPaymentId_idx" ON "customer_payment_receipts"("customerPaymentId");

-- AddForeignKey
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment_history" ADD CONSTRAINT "customer_payment_history_customerPaymentId_fkey" FOREIGN KEY ("customerPaymentId") REFERENCES "customer_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment_reminders" ADD CONSTRAINT "customer_payment_reminders_customerPaymentId_fkey" FOREIGN KEY ("customerPaymentId") REFERENCES "customer_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment_receipts" ADD CONSTRAINT "customer_payment_receipts_customerPaymentId_fkey" FOREIGN KEY ("customerPaymentId") REFERENCES "customer_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
