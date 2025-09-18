#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreDatabase() {
  try {
    const backupFile = process.argv[2] || 'database_backups/backup_20250821_181752.json';
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    console.log('Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log('Starting database restore...');
    
    // Helper function to safely restore data
    async function safeRestore(modelName, data, prismaModel) {
      if (data && data.length > 0) {
        console.log(`Restoring ${data.length} ${modelName}...`);
        for (const item of data) {
          try {
            await prismaModel.upsert({
              where: { id: item.id },
              update: item,
              create: item
            });
          } catch (error) {
            console.log(`Warning: Could not restore ${modelName} with id ${item.id}: ${error.message}`);
          }
        }
        console.log(`✓ Restored ${data.length} ${modelName}`);
      } else {
        console.log(`No ${modelName} to restore`);
      }
    }
    
    // Restore all tables with error handling
    await safeRestore('files', backupData.files, prisma.file);
    await safeRestore('users', backupData.users, prisma.user);
    await safeRestore('agencies', backupData.agencies, prisma.agency);
    await safeRestore('dmcs', backupData.dmcs, prisma.dMC);
    await safeRestore('passwordResets', backupData.passwordResets, prisma.passwordReset);
    await safeRestore('plans', backupData.plans, prisma.plan);
    await safeRestore('features', backupData.features, prisma.feature);
    await safeRestore('subscriptions', backupData.subscriptions, prisma.subscription);
    await safeRestore('agencyForms', backupData.agencyForms, prisma.agencyForm);
    await safeRestore('dmcForms', backupData.dmcForms, prisma.dMCForm);
    await safeRestore('managers', backupData.managers, prisma.manager);
    await safeRestore('userForms', backupData.userForms, prisma.userForm);
    await safeRestore('paymentMethods', backupData.paymentMethods, prisma.paymentMethod);
    await safeRestore('enquiries', backupData.enquiries, prisma.enquiries);
    await safeRestore('itineraries', backupData.itineraries, prisma.itineraries);
    await safeRestore('customers', backupData.customers, prisma.customers);
    await safeRestore('customerFeedbacks', backupData.customerFeedbacks, prisma.customer_feedbacks);
    await safeRestore('sentItineraries', backupData.sentItineraries, prisma.sent_itineraries);
    await safeRestore('flightEnquiries', backupData.flightEnquiries, prisma.flightEnquiry);
    await safeRestore('accommodationEnquiries', backupData.accommodationEnquiries, prisma.accommodationEnquiry);
    await safeRestore('comments', backupData.comments, prisma.comment);
    await safeRestore('staff', backupData.staff, prisma.staff);
    await safeRestore('sharedDmcs', backupData.sharedDmcs, prisma.sharedDMC);
    await safeRestore('sharedDmcItems', backupData.sharedDmcItems, prisma.sharedDMCItem);
    await safeRestore('admins', backupData.admins, prisma.admin);
    await safeRestore('agencyCancellationPolicies', backupData.agencyCancellationPolicies, prisma.agencyCancellationPolicy);
    await safeRestore('emailLogs', backupData.emailLogs, prisma.emailLog);
    await safeRestore('sharedCustomerPdfs', backupData.sharedCustomerPdfs, prisma.sharedCustomerPdf);
    await safeRestore('feedbacks', backupData.feedbacks, prisma.feedback);
    
    console.log('✓ Database restore completed successfully!');
    
  } catch (error) {
    console.error('✗ Restore failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
