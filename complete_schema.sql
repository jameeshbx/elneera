-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SharedDMCStatus" AS ENUM ('PENDING', 'SENT', 'RECEIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DMCItemStatus" AS ENUM ('AWAITING_TRANSFER', 'AWAITING_DMC_EUROPE', 'AWAITING_TRAILS_DMC', 'ITINERARY_VIEWED', 'AWAITING_INTERNAL_REVIEW', 'QUOTATION_RECEIVED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('BANK_ACCOUNT', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'QR_CODE', 'PAYMENT_GATEWAY');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN', 'AGENT_USER', 'AGENT_ADMIN', 'DMC_USER', 'DMC_ADMIN');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('TEKKING_MYLES', 'AGENCY', 'DMC');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('TEKKING_MYLES', 'AGENCY', 'DMC');

-- CreateEnum
CREATE TYPE "ManagerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DMCStatus" AS ENUM ('ACTIVE', 'DEACTIVE');

-- CreateEnum
CREATE TYPE "DMCRequestStatusEnum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgencyType" AS ENUM ('PRIVATE_LIMITED', 'PROPRIETORSHIP', 'PARTNERSHIP', 'PUBLIC_LIMITED', 'LLP', 'TOUR_OPERATOR', 'TRAVEL_AGENT', 'DMC', 'OTHER');

-- CreateEnum
CREATE TYPE "PanType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'TRUST', 'OTHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FlightRequirement" AS ENUM ('YES', 'NO');

-- CreateEnum


-- CreateEnum
CREATE TYPE "TravelTag" AS ENUM ('FLIGHTS', 'ACCOMMODATION', 'FULL_PACKAGE', 'SIGHTSEEING');

-- CreateEnum
CREATE TYPE "CancellationPolicyType" AS ENUM ('DEFAULT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('ITINERARY_SHARE', 'CANCELLATION_NOTICE', 'POLICY_UPDATE', 'REMINDER');

-- CreateEnum
CREATE TYPE "SharedPdfStatus" AS ENUM ('GENERATED', 'SENT', 'DELIVERED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "companyName" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "userType" "UserType" NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "agencyId" TEXT,
    "dmcId" TEXT,
    "profileImgId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DMC" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DMC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxRequests" INTEGER NOT NULL,
    "maxUsers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "requestLimit" INTEGER NOT NULL,
    "userLimit" INTEGER NOT NULL,
    "agencyFormId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "contactPerson" TEXT,
    "agencyType" "AgencyType",
    "designation" TEXT,
    "phoneNumber" TEXT,
    "phoneCountryCode" TEXT DEFAULT '+91',
    "ownerName" TEXT,
    "email" TEXT,
    "companyPhone" TEXT,
    "companyPhoneCode" TEXT DEFAULT '+91',
    "website" TEXT,
    "landingPageColor" TEXT DEFAULT '#4ECDC4',
    "gstRegistered" BOOLEAN DEFAULT true,
    "gstNumber" TEXT,
    "yearOfRegistration" TEXT,
    "panNumber" TEXT,
    "panType" "PanType",
    "headquarters" TEXT,
    "country" TEXT DEFAULT 'INDIA',
    "yearsOfOperation" TEXT,
    "logoId" TEXT,
    "businessLicenseId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DMCForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "contactPerson" TEXT,
    "designation" TEXT,
    "phoneNumber" TEXT,
    "phoneCountryCode" TEXT DEFAULT '+91',
    "ownerName" TEXT,
    "email" TEXT,
    "ownerPhoneNumber" TEXT,
    "ownerPhoneCode" TEXT DEFAULT '+91',
    "website" TEXT,
    "primaryCountry" TEXT,
    "destinationsCovered" TEXT,
    "cities" TEXT,
    "gstRegistered" BOOLEAN DEFAULT true,
    "gstNumber" TEXT,
    "yearOfRegistration" TEXT,
    "panNumber" TEXT,
    "panType" "PanType",
    "headquarters" TEXT,
    "country" TEXT,
    "yearsOfExperience" TEXT,
    "registrationCertificateId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "DMCStatus" NOT NULL DEFAULT 'ACTIVE',
    "agencyId" TEXT,

    CONSTRAINT "DMCForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manager" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_form" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneExtension" TEXT NOT NULL DEFAULT '+91',
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profileImageId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "user_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "dmcId" TEXT,
    "type" "PaymentMethodType" NOT NULL,
    "name" TEXT,
    "identifier" TEXT,
    "bankName" TEXT,
    "branchName" TEXT,
    "ifscCode" TEXT,
    "bankCountry" TEXT,
    "currency" TEXT,
    "cardHolder" TEXT,
    "expiryDate" TEXT,
    "upiProvider" TEXT,
    "qrCodeId" TEXT,
    "paymentLink" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locations" TEXT,
    "tourType" TEXT,
    "estimatedDates" TEXT,
    "currency" TEXT,
    "budget" INTEGER,
    "notes" TEXT,
    "assignedStaff" TEXT,
    "pointOfContact" TEXT,
    "leadSource" TEXT DEFAULT 'Direct',
    "flightsRequired" TEXT DEFAULT 'no',
    "pickupLocation" TEXT,
    "dropLocation" TEXT,
    "numberOfTravellers" TEXT,
    "numberOfKids" TEXT,
    "travelingWithPets" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enquiry',
    "enquiryDate" TEXT NOT NULL DEFAULT 'now()',
    "tags" TEXT DEFAULT 'sightseeing',
    "mustSeeSpots" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "destinations" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "travelType" TEXT,
    "adults" INTEGER,
    "children" INTEGER,
    "under6" INTEGER,
    "from7to12" INTEGER,
    "flightsRequired" TEXT,
    "pickupLocation" TEXT,
    "dropLocation" TEXT,
    "currency" TEXT,
    "budget" INTEGER,
    "activityPreferences" TEXT,
    "hotelPreferences" TEXT,
    "mealPreference" TEXT,
    "dietaryPreference" TEXT,
    "transportPreferences" TEXT,
    "travelingWithPets" TEXT,
    "additionalRequests" TEXT,
    "moreDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mustSeeSpots" TEXT,
    "accommodation" JSONB,
    "dailyItinerary" JSONB,
    "customerId" TEXT,
    "activeStatus" BOOLEAN DEFAULT true,
    "budgetEstimation" JSONB,
    "enquiryDetails" JSONB,
    "location" TEXT,
    "numberOfDays" TEXT,
    "travelStyle" TEXT,
    "agencyCancellationPolicyId" TEXT,
    "cancellationPolicyType" "CancellationPolicyType" DEFAULT 'DEFAULT',
    "customCancellationDeadline" INTEGER,
    "customCancellationTerms" TEXT,
    "pdf_url" TEXT,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsappNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_feedbacks" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "document_name" TEXT,
    "document_url" TEXT,
    "itinerary_id" TEXT,

    CONSTRAINT "customer_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sent_itineraries" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "notes" TEXT,
    "documentUrl" TEXT,
    "documentName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "itineraryId" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sent_itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departureCity" TEXT NOT NULL,
    "returnCity" TEXT NOT NULL,
    "departureDate" TEXT NOT NULL,
    "returnDate" TEXT NOT NULL,
    "preferredAirlineClass" TEXT NOT NULL DEFAULT 'economy',
    "numberOfTravellers" TEXT NOT NULL,
    "numberOfKids" TEXT NOT NULL,
    "assignedStaff" TEXT,
    "pointOfContact" TEXT,
    "notes" TEXT,
    "leadSource" TEXT NOT NULL DEFAULT 'Direct',
    "status" TEXT NOT NULL DEFAULT 'enquiry',
    "enquiryDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "flight_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accommodation_enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "children" INTEGER NOT NULL DEFAULT 0,
    "under5" INTEGER NOT NULL DEFAULT 0,
    "from6to12" INTEGER NOT NULL DEFAULT 0,
    "budget" INTEGER NOT NULL DEFAULT 500,
    "accommodationType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hotelPreference" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedStaff" TEXT,
    "pointOfContact" TEXT,
    "notes" TEXT,
    "leadSource" TEXT NOT NULL DEFAULT 'Direct',
    "status" TEXT NOT NULL DEFAULT 'enquiry',
    "enquiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "accommodation_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_dmcs" (
    "id" TEXT NOT NULL,
    "dateGenerated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "status" "SharedDMCStatus" NOT NULL DEFAULT 'PENDING',
    "assignedStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_dmcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_dmc_items" (
    "id" TEXT NOT NULL,
    "sharedDMCId" TEXT NOT NULL,
    "dmcId" TEXT NOT NULL,
    "status" "DMCItemStatus" NOT NULL DEFAULT 'AWAITING_TRANSFER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_dmc_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" "AdminStatus" NOT NULL DEFAULT 'INACTIVE',
    "profileId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyCancellationPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deadlineHours" INTEGER NOT NULL,
    "terms" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyCancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "sharedCustomerPdfId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "emailType" "EmailType" NOT NULL DEFAULT 'ITINERARY_SHARE',
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_customer_pdfs" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "pdfUrl" TEXT NOT NULL,
    "pdfFileName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerWhatsapp" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSentAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "status" "SharedPdfStatus" NOT NULL DEFAULT 'GENERATED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "shared_customer_pdfs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_profileImgId_key" ON "User"("profileImgId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Agency_name_idx" ON "Agency"("name");

-- CreateIndex
CREATE INDEX "DMC_name_idx" ON "DMC"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_userId_key" ON "PasswordReset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_name_key" ON "Feature"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_agencyId_featureId_key" ON "Subscription"("agencyId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyForm_logoId_key" ON "AgencyForm"("logoId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyForm_businessLicenseId_key" ON "AgencyForm"("businessLicenseId");

-- CreateIndex
CREATE INDEX "AgencyForm_name_idx" ON "AgencyForm"("name");

-- CreateIndex
CREATE INDEX "AgencyForm_email_idx" ON "AgencyForm"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DMCForm_registrationCertificateId_key" ON "DMCForm"("registrationCertificateId");

-- CreateIndex
CREATE INDEX "DMCForm_name_idx" ON "DMCForm"("name");

-- CreateIndex
CREATE INDEX "DMCForm_email_idx" ON "DMCForm"("email");

-- CreateIndex
CREATE INDEX "DMCForm_createdBy_idx" ON "DMCForm"("createdBy");

-- CreateIndex
CREATE INDEX "DMCForm_agencyId_idx" ON "DMCForm"("agencyId");

-- CreateIndex
CREATE INDEX "DMCForm_status_idx" ON "DMCForm"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_email_key" ON "Manager"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_username_key" ON "Manager"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_profileId_key" ON "Manager"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "user_form_email_key" ON "user_form"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_form_username_key" ON "user_form"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_form_profileImageId_key" ON "user_form"("profileImageId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_qrCodeId_key" ON "PaymentMethod"("qrCodeId");

-- CreateIndex
CREATE INDEX "PaymentMethod_dmcId_idx" ON "PaymentMethod"("dmcId");

-- CreateIndex
CREATE INDEX "PaymentMethod_type_idx" ON "PaymentMethod"("type");

-- CreateIndex
CREATE INDEX "enquiries_status_idx" ON "enquiries"("status");

-- CreateIndex
CREATE INDEX "enquiries_enquiryDate_idx" ON "enquiries"("enquiryDate");

-- CreateIndex
CREATE INDEX "enquiries_customerId_idx" ON "enquiries"("customerId");

-- CreateIndex
CREATE INDEX "enquiries_email_idx" ON "enquiries"("email");

-- CreateIndex
CREATE INDEX "itineraries_enquiryId_idx" ON "itineraries"("enquiryId");

-- CreateIndex
CREATE INDEX "itineraries_customerId_idx" ON "itineraries"("customerId");

-- CreateIndex
CREATE INDEX "itineraries_status_idx" ON "itineraries"("status");

-- CreateIndex
CREATE INDEX "itineraries_startDate_idx" ON "itineraries"("startDate");

-- CreateIndex
CREATE INDEX "itineraries_agencyCancellationPolicyId_idx" ON "itineraries"("agencyCancellationPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "flight_enquiries_email_idx" ON "flight_enquiries"("email");

-- CreateIndex
CREATE INDEX "flight_enquiries_status_idx" ON "flight_enquiries"("status");

-- CreateIndex
CREATE INDEX "flight_enquiries_createdAt_idx" ON "flight_enquiries"("createdAt");

-- CreateIndex
CREATE INDEX "accommodation_enquiries_email_idx" ON "accommodation_enquiries"("email");

-- CreateIndex
CREATE INDEX "accommodation_enquiries_status_idx" ON "accommodation_enquiries"("status");

-- CreateIndex
CREATE INDEX "accommodation_enquiries_createdAt_idx" ON "accommodation_enquiries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "shared_dmcs_assignedStaffId_idx" ON "shared_dmcs"("assignedStaffId");

-- CreateIndex
CREATE INDEX "shared_dmc_items_sharedDMCId_idx" ON "shared_dmc_items"("sharedDMCId");

-- CreateIndex
CREATE INDEX "shared_dmc_items_dmcId_idx" ON "shared_dmc_items"("dmcId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_dmc_items_sharedDMCId_dmcId_key" ON "shared_dmc_items"("sharedDMCId", "dmcId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_profileId_key" ON "admins"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_userId_key" ON "admins"("userId");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_status_idx" ON "admins"("status");

-- CreateIndex
CREATE INDEX "email_logs_emailType_idx" ON "email_logs"("emailType");

-- CreateIndex
CREATE INDEX "email_logs_recipientEmail_idx" ON "email_logs"("recipientEmail");

-- CreateIndex
CREATE INDEX "email_logs_sharedCustomerPdfId_idx" ON "email_logs"("sharedCustomerPdfId");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "shared_customer_pdfs_customerId_idx" ON "shared_customer_pdfs"("customerId");

-- CreateIndex
CREATE INDEX "shared_customer_pdfs_emailSent_idx" ON "shared_customer_pdfs"("emailSent");

-- CreateIndex
CREATE INDEX "shared_customer_pdfs_enquiryId_idx" ON "shared_customer_pdfs"("enquiryId");

-- CreateIndex
CREATE INDEX "shared_customer_pdfs_itineraryId_idx" ON "shared_customer_pdfs"("itineraryId");

-- CreateIndex
CREATE INDEX "shared_customer_pdfs_status_idx" ON "shared_customer_pdfs"("status");

