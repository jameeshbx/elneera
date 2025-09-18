-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN', 'AGENT_USER', 'AGENT_ADMIN', 'DMC_USER', 'DMC_ADMIN');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('TREKKING_MYLES', 'AGENCY', 'DMC');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('TREKKING_MYLES', 'AGENCY', 'DMC');

-- CreateEnum
CREATE TYPE "ManagerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DMCStatus" AS ENUM ('ACTIVE', 'DEACTIVE');

-- CreateEnum
CREATE TYPE "AgencyType" AS ENUM ('PRIVATE_LIMITED', 'PROPRIETORSHIP', 'PARTNERSHIP', 'PUBLIC_LIMITED', 'LLP', 'TOUR_OPERATOR', 'TRAVEL_AGENT', 'DMC', 'OTHER');

-- CreateEnum
CREATE TYPE "PanType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'TRUST', 'OTHER');

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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
CREATE UNIQUE INDEX "Manager_email_key" ON "Manager"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_username_key" ON "Manager"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_profileId_key" ON "Manager"("profileId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dmcId_fkey" FOREIGN KEY ("dmcId") REFERENCES "DMC"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_agencyFormId_fkey" FOREIGN KEY ("agencyFormId") REFERENCES "AgencyForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyForm" ADD CONSTRAINT "AgencyForm_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyForm" ADD CONSTRAINT "AgencyForm_businessLicenseId_fkey" FOREIGN KEY ("businessLicenseId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DMCForm" ADD CONSTRAINT "DMCForm_registrationCertificateId_fkey" FOREIGN KEY ("registrationCertificateId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
