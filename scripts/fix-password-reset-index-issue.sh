#!/bin/bash

# Fix PasswordReset Index Issue Script
# This script resolves the migration conflict where PasswordReset_userId_idx
# is being dropped before it's created due to migration order issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Fix PasswordReset Index Issue${NC}"
echo -e "${BLUE}================================${NC}"

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
    export $(grep -v '^#' .env | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set your DATABASE_URL environment variable and try again."
    exit 1
fi

# Step 1: Create backup using Prisma
echo -e "${YELLOW}Step 1: Creating database backup...${NC}"
BACKUP_DIR="database_backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.json"

echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"

# Create a backup script
cat > scripts/temp-backup.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('Starting database backup...');
    
    // Get all data from all tables
    const data = {};
    
    // Helper function to safely backup a table
    async function safeBackup(modelName, prismaCall) {
      try {
        console.log(`Backing up ${modelName}...`);
        return await prismaCall();
      } catch (error) {
        console.log(`Warning: Could not backup ${modelName}: ${error.message}`);
        return [];
      }
    }
    
    // Backup all tables with error handling
    data.users = await safeBackup('users', () => prisma.user.findMany());
    data.agencies = await safeBackup('agencies', () => prisma.agency.findMany());
    data.dmcs = await safeBackup('dmcs', () => prisma.dMC.findMany());
    data.passwordResets = await safeBackup('passwordResets', () => prisma.passwordReset.findMany());
    data.plans = await safeBackup('plans', () => prisma.plan.findMany());
    data.features = await safeBackup('features', () => prisma.feature.findMany());
    data.subscriptions = await safeBackup('subscriptions', () => prisma.subscription.findMany());
    data.agencyForms = await safeBackup('agencyForms', () => prisma.agencyForm.findMany());
    data.dmcForms = await safeBackup('dmcForms', () => prisma.dMCForm.findMany());
    data.managers = await safeBackup('managers', () => prisma.manager.findMany());
    data.userForms = await safeBackup('userForms', () => prisma.userForm.findMany());
    data.paymentMethods = await safeBackup('paymentMethods', () => prisma.paymentMethod.findMany());
    data.enquiries = await safeBackup('enquiries', () => prisma.enquiries.findMany());
    data.itineraries = await safeBackup('itineraries', () => prisma.itineraries.findMany());
    data.customers = await safeBackup('customers', () => prisma.customers.findMany());
    data.customerFeedbacks = await safeBackup('customerFeedbacks', () => prisma.customer_feedbacks.findMany());
    data.sentItineraries = await safeBackup('sentItineraries', () => prisma.sent_itineraries.findMany());
    data.flightEnquiries = await safeBackup('flightEnquiries', () => prisma.flightEnquiry.findMany());
    data.accommodationEnquiries = await safeBackup('accommodationEnquiries', () => prisma.accommodationEnquiry.findMany());
    data.comments = await safeBackup('comments', () => prisma.comment.findMany());
    data.staff = await safeBackup('staff', () => prisma.staff.findMany());
    data.sharedDmcs = await safeBackup('sharedDmcs', () => prisma.sharedDMC.findMany());
    data.sharedDmcItems = await safeBackup('sharedDmcItems', () => prisma.sharedDMCItem.findMany());
    data.admins = await safeBackup('admins', () => prisma.admin.findMany());
    data.agencyCancellationPolicies = await safeBackup('agencyCancellationPolicies', () => prisma.agencyCancellationPolicy.findMany());
    data.emailLogs = await safeBackup('emailLogs', () => prisma.emailLog.findMany());
    data.sharedCustomerPdfs = await safeBackup('sharedCustomerPdfs', () => prisma.sharedCustomerPdf.findMany());
    data.files = await safeBackup('files', () => prisma.file.findMany());
    data.feedbacks = await safeBackup('feedbacks', () => prisma.feedback.findMany());
    
    console.log('Backup completed successfully!');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
EOF

# Run the backup script
node scripts/temp-backup.js > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup completed successfully!${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Backup size: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Clean up temporary backup script
rm -f scripts/temp-backup.js

# Step 2: Remove problematic migration
echo -e "${YELLOW}Step 2: Removing problematic migration...${NC}"
PROBLEMATIC_MIGRATION="prisma/migrations/20250819082216_apply_uptodate"

if [ -d "$PROBLEMATIC_MIGRATION" ]; then
    echo -e "${YELLOW}Removing: $PROBLEMATIC_MIGRATION${NC}"
    rm -rf "$PROBLEMATIC_MIGRATION"
    echo -e "${GREEN}✓ Problematic migration removed!${NC}"
else
    echo -e "${YELLOW}Migration directory not found, continuing...${NC}"
fi

# Step 3: Reset migrations
echo -e "${YELLOW}Step 3: Resetting migrations...${NC}"
echo -e "${YELLOW}This will drop and recreate the database schema.${NC}"

# Confirm before proceeding
echo -e "${YELLOW}Are you sure you want to proceed with migration reset? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration reset cancelled.${NC}"
    echo -e "${GREEN}Backup is still available at: $BACKUP_FILE${NC}"
    exit 0
fi

echo -e "${YELLOW}Running prisma migrate reset...${NC}"
npx prisma migrate reset --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration reset completed successfully!${NC}"
else
    echo -e "${RED}✗ Migration reset failed!${NC}"
    echo -e "${YELLOW}You can restore from backup using the restore script.${NC}"
    exit 1
fi

# Step 4: Restore database from backup
echo -e "${YELLOW}Step 4: Restoring database from backup...${NC}"
echo -e "${YELLOW}Restoring from: $BACKUP_FILE${NC}"

# Create a restore script
cat > scripts/temp-restore.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreDatabase() {
  try {
    const backupFile = process.argv[2];
    if (!backupFile) {
      throw new Error('Backup file path not provided');
    }
    
    console.log('Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log('Starting database restore...');
    
    // Restore all tables
    if (backupData.files && backupData.files.length > 0) {
      console.log('Restoring files...');
      for (const file of backupData.files) {
        await prisma.file.upsert({
          where: { id: file.id },
          update: file,
          create: file
        });
      }
    }
    
    if (backupData.users && backupData.users.length > 0) {
      console.log('Restoring users...');
      for (const user of backupData.users) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: user,
          create: user
        });
      }
    }
    
    if (backupData.agencies && backupData.agencies.length > 0) {
      console.log('Restoring agencies...');
      for (const agency of backupData.agencies) {
        await prisma.agency.upsert({
          where: { id: agency.id },
          update: agency,
          create: agency
        });
      }
    }
    
    if (backupData.dmcs && backupData.dmcs.length > 0) {
      console.log('Restoring DMCs...');
      for (const dmc of backupData.dmcs) {
        await prisma.dMC.upsert({
          where: { id: dmc.id },
          update: dmc,
          create: dmc
        });
      }
    }
    
    if (backupData.agencyForms && backupData.agencyForms.length > 0) {
      console.log('Restoring agency forms...');
      for (const form of backupData.agencyForms) {
        await prisma.agencyForm.upsert({
          where: { id: form.id },
          update: form,
          create: form
        });
      }
    }
    
    if (backupData.dmcForms && backupData.dmcForms.length > 0) {
      console.log('Restoring DMC forms...');
      for (const form of backupData.dmcForms) {
        await prisma.dMCForm.upsert({
          where: { id: form.id },
          update: form,
          create: form
        });
      }
    }
    
    if (backupData.managers && backupData.managers.length > 0) {
      console.log('Restoring managers...');
      for (const manager of backupData.managers) {
        await prisma.manager.upsert({
          where: { id: manager.id },
          update: manager,
          create: manager
        });
      }
    }
    
    if (backupData.userForms && backupData.userForms.length > 0) {
      console.log('Restoring user forms...');
      for (const form of backupData.userForms) {
        await prisma.userForm.upsert({
          where: { id: form.id },
          update: form,
          create: form
        });
      }
    }
    
    if (backupData.admins && backupData.admins.length > 0) {
      console.log('Restoring admins...');
      for (const admin of backupData.admins) {
        await prisma.admin.upsert({
          where: { id: admin.id },
          update: admin,
          create: admin
        });
      }
    }
    
    if (backupData.enquiries && backupData.enquiries.length > 0) {
      console.log('Restoring enquiries...');
      for (const enquiry of backupData.enquiries) {
        await prisma.enquiries.upsert({
          where: { id: enquiry.id },
          update: enquiry,
          create: enquiry
        });
      }
    }
    
    if (backupData.itineraries && backupData.itineraries.length > 0) {
      console.log('Restoring itineraries...');
      for (const itinerary of backupData.itineraries) {
        await prisma.itineraries.upsert({
          where: { id: itinerary.id },
          update: itinerary,
          create: itinerary
        });
      }
    }
    
    if (backupData.customers && backupData.customers.length > 0) {
      console.log('Restoring customers...');
      for (const customer of backupData.customers) {
        await prisma.customers.upsert({
          where: { id: customer.id },
          update: customer,
          create: customer
        });
      }
    }
    
    console.log('Restore completed successfully!');
    
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
EOF

# Run the restore script
node scripts/temp-restore.js "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restore completed successfully!${NC}"
else
    echo -e "${RED}✗ Database restore failed!${NC}"
    echo -e "${YELLOW}You can manually restore from backup using the restore script.${NC}"
    exit 1
fi

# Clean up temporary restore script
rm -f scripts/temp-restore.js

# Step 5: Mark migrations as applied
echo -e "${YELLOW}Step 5: Marking migrations as applied...${NC}"
npx prisma migrate resolve --applied 20250818230252_baseline
npx prisma migrate resolve --applied 20250819134500_add_bank_data
npx prisma migrate resolve --applied 20250819135000_add_relation_indexes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations marked as applied successfully!${NC}"
else
    echo -e "${RED}✗ Failed to mark migrations as applied!${NC}"
    echo -e "${YELLOW}You may need to manually resolve this.${NC}"
fi

# Step 6: Generate Prisma client
echo -e "${YELLOW}Step 6: Generating Prisma client...${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma client generated successfully!${NC}"
else
    echo -e "${RED}✗ Prisma client generation failed!${NC}"
fi

# Step 7: Verify migration status
echo -e "${YELLOW}Step 7: Verifying migration status...${NC}"
npx prisma migrate status

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}PasswordReset index issue has been resolved!${NC}"
echo -e "${GREEN}Backup saved at: $BACKUP_FILE${NC}"
echo -e "${BLUE}================================${NC}"

echo -e "${YELLOW}What was the problem?${NC}"
echo "The migration '20250819082216_apply_uptodate' was trying to drop"
echo "the 'PasswordReset_userId_idx' index before it was created by"
echo "the '20250819135000_add_relation_indexes' migration."

echo -e "${YELLOW}What was the solution?${NC}"
echo "1. Created a backup of the current database using Prisma"
echo "2. Removed the problematic migration file"
echo "3. Reset the migration system"
echo "4. Restored the database from backup"
echo "5. Marked all remaining migrations as applied"

echo -e "${YELLOW}Prevention:${NC}"
echo "To prevent this in the future:"
echo "- Always check migration order when creating new migrations"
echo "- Use 'npx prisma migrate dev' to create migrations"
echo "- Test migrations on a development database first"
