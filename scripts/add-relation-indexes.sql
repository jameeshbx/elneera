-- Add indexes for relation fields to improve query performance with relationMode = "prisma"

-- User table indexes
CREATE INDEX IF NOT EXISTS "User_agencyId_idx" ON "User"("agencyId");
CREATE INDEX IF NOT EXISTS "User_dmcId_idx" ON "User"("dmcId");
CREATE INDEX IF NOT EXISTS "User_profileImgId_idx" ON "User"("profileImgId");

-- PasswordReset table indexes
CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- Subscription table indexes
CREATE INDEX IF NOT EXISTS "Subscription_agencyId_idx" ON "Subscription"("agencyId");
CREATE INDEX IF NOT EXISTS "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX IF NOT EXISTS "Subscription_featureId_idx" ON "Subscription"("featureId");
CREATE INDEX IF NOT EXISTS "Subscription_agencyFormId_idx" ON "Subscription"("agencyFormId");

-- AgencyForm table indexes
CREATE INDEX IF NOT EXISTS "AgencyForm_logoId_idx" ON "AgencyForm"("logoId");
CREATE INDEX IF NOT EXISTS "AgencyForm_businessLicenseId_idx" ON "AgencyForm"("businessLicenseId");

-- DMCForm table indexes
CREATE INDEX IF NOT EXISTS "DMCForm_registrationCertificateId_idx" ON "DMCForm"("registrationCertificateId");

-- Manager table indexes
CREATE INDEX IF NOT EXISTS "Manager_profileId_idx" ON "Manager"("profileId");

-- UserForm table indexes
CREATE INDEX IF NOT EXISTS "UserForm_profileImageId_idx" ON "user_form"("profileImageId");

-- PaymentMethod table indexes (already has some)
CREATE INDEX IF NOT EXISTS "PaymentMethod_qrCodeId_idx" ON "PaymentMethod"("qrCodeId");

-- enquiries table indexes
CREATE INDEX IF NOT EXISTS "enquiries_customerId_idx" ON "enquiries"("customerId");

-- itineraries table indexes
CREATE INDEX IF NOT EXISTS "itineraries_customerId_idx" ON "itineraries"("customerId");
CREATE INDEX IF NOT EXISTS "itineraries_agencyCancellationPolicyId_idx" ON "itineraries"("agencyCancellationPolicyId");

-- customer_feedbacks table indexes
CREATE INDEX IF NOT EXISTS "customer_feedbacks_customerId_idx" ON "customer_feedbacks"("customerId");
CREATE INDEX IF NOT EXISTS "customer_feedbacks_itineraryId_idx" ON "customer_feedbacks"("itineraryId");

-- sent_itineraries table indexes
CREATE INDEX IF NOT EXISTS "sent_itineraries_customerId_idx" ON "sent_itineraries"("customerId");
CREATE INDEX IF NOT EXISTS "sent_itineraries_itineraryId_idx" ON "sent_itineraries"("itineraryId");

-- SharedDMC table indexes
CREATE INDEX IF NOT EXISTS "SharedDMC_assignedStaffId_idx" ON "shared_dmcs"("assignedStaffId");

-- SharedDMCItem table indexes
CREATE INDEX IF NOT EXISTS "SharedDMCItem_sharedDMCId_idx" ON "shared_dmc_items"("sharedDMCId");
CREATE INDEX IF NOT EXISTS "SharedDMCItem_dmcId_idx" ON "shared_dmc_items"("dmcId");

-- Admin table indexes
CREATE INDEX IF NOT EXISTS "Admin_profileId_idx" ON "admins"("profileId");
CREATE INDEX IF NOT EXISTS "Admin_userId_idx" ON "admins"("userId");

-- SharedCustomerPdf table indexes
CREATE INDEX IF NOT EXISTS "SharedCustomerPdf_itineraryId_idx" ON "shared_customer_pdfs"("itineraryId");
CREATE INDEX IF NOT EXISTS "SharedCustomerPdf_customerId_idx" ON "shared_customer_pdfs"("customerId");
CREATE INDEX IF NOT EXISTS "SharedCustomerPdf_enquiryId_idx" ON "shared_customer_pdfs"("enquiryId");

-- EmailLog table indexes
CREATE INDEX IF NOT EXISTS "EmailLog_sharedCustomerPdfId_idx" ON "email_logs"("sharedCustomerPdfId");

-- Comment table indexes
CREATE INDEX IF NOT EXISTS "Comment_managerId_idx" ON "comments"("managerId");
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "comments"("authorId");
