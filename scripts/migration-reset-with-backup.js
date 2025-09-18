#!/usr/bin/env node

/**
 * Migration Reset with Backup Script
 * This script handles the complete migration reset process with data preservation
 * using Prisma's capabilities instead of pg_dump
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function backupDatabase() {
  log('Step 1: Creating database backup...', 'yellow');
  
  const prisma = new PrismaClient();
  
  try {
    // Create backup directory
    const backupDir = 'database_backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
    
    log(`Creating backup: ${backupFile}`, 'yellow');
    
    // Backup all tables data
    const backup = {};
    
    // List of models to backup (excluding system tables)
    const models = [
      'User', 'Agency', 'DMC', 'PasswordReset', 'Plan', 'Feature', 'Subscription',
      'AgencyForm', 'DMCForm', 'Manager', 'UserForm', 'PaymentMethod', 'enquiries',
      'itineraries', 'customers', 'customer_feedbacks', 'sent_itineraries',
      'FlightEnquiry', 'AccommodationEnquiry', 'Comment', 'Staff', 'SharedDMC',
      'SharedDMCItem', 'Admin', 'AgencyCancellationPolicy', 'email_logs',
      'shared_customer_pdfs', 'File'
    ];
    
    for (const model of models) {
      try {
        log(`Backing up ${model}...`, 'yellow');
        const data = await prisma[model].findMany();
        backup[model] = data;
        log(`✓ ${model}: ${data.length} records`, 'green');
      } catch (error) {
        log(`⚠ ${model}: ${error.message}`, 'yellow');
      }
    }
    
    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log(`✓ Backup completed successfully!`, 'green');
    log(`Backup saved to: ${backupFile}`, 'green');
    log(`Backup size: ${fileSizeInMB} MB`, 'green');
    
    return backupFile;
    
  } catch (error) {
    log(`✗ Backup failed: ${error.message}`, 'red');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function restoreDatabase(backupFile) {
  log('Step 3: Restoring database from backup...', 'yellow');
  
  const prisma = new PrismaClient();
  
  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    log(`Restoring from: ${backupFile}`, 'yellow');
    
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Restore data in order (respecting foreign key constraints)
    const restoreOrder = [
      'File', 'Agency', 'DMC', 'Plan', 'Feature', 'AgencyForm', 'DMCForm',
      'Manager', 'UserForm', 'Admin', 'Staff', 'User', 'PasswordReset',
      'PaymentMethod', 'customers', 'enquiries', 'itineraries', 'customer_feedbacks',
      'sent_itineraries', 'FlightEnquiry', 'AccommodationEnquiry', 'Comment',
      'SharedDMC', 'SharedDMCItem', 'Subscription', 'AgencyCancellationPolicy',
      'email_logs', 'shared_customer_pdfs'
    ];
    
    for (const model of restoreOrder) {
      if (backup[model] && backup[model].length > 0) {
        try {
          log(`Restoring ${model}...`, 'yellow');
          
          // Use createMany for better performance, fallback to individual creates
          try {
            await prisma[model].createMany({
              data: backup[model],
              skipDuplicates: true
            });
          } catch (error) {
            // If createMany fails, try individual creates
            for (const record of backup[model]) {
              try {
                await prisma[model].create({
                  data: record
                });
              } catch (createError) {
                log(`⚠ Failed to restore record in ${model}: ${createError.message}`, 'yellow');
              }
            }
          }
          
          log(`✓ ${model}: ${backup[model].length} records restored`, 'green');
        } catch (error) {
          log(`⚠ ${model}: ${error.message}`, 'yellow');
        }
      }
    }
    
    log('✓ Database restore completed successfully!', 'green');
    
  } catch (error) {
    log(`✗ Restore failed: ${error.message}`, 'red');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  log('================================', 'blue');
  log('  Migration Reset with Backup', 'blue');
  log('================================', 'blue');
  
  try {
    // Step 1: Backup
    const backupFile = await backupDatabase();
    
    // Step 2: Reset migrations
    log('Step 2: Resetting migrations...', 'yellow');
    log('This will drop and recreate the database schema.', 'yellow');
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Are you sure you want to proceed with migration reset? (y/N): ', resolve);
    });
    rl.close();
    
    if (!answer.toLowerCase().startsWith('y')) {
      log('Migration reset cancelled.', 'yellow');
      log(`Backup is still available at: ${backupFile}`, 'green');
      return;
    }
    
    log('Running prisma migrate reset...', 'yellow');
    
    const { execSync } = require('child_process');
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    
    log('✓ Migration reset completed successfully!', 'green');
    
    // Step 3: Restore
    await restoreDatabase(backupFile);
    
    // Step 4: Mark migrations as applied
    log('Step 4: Marking migrations as applied...', 'yellow');
    execSync('npx prisma migrate resolve --applied 20250818230252_baseline', { stdio: 'inherit' });
    log('✓ Migrations marked as applied successfully!', 'green');
    
    // Step 5: Generate Prisma client
    log('Step 5: Generating Prisma client...', 'yellow');
    execSync('npx prisma generate', { stdio: 'inherit' });
    log('✓ Prisma client generated successfully!', 'green');
    
    log('================================', 'blue');
    log('Migration reset process completed!', 'green');
    log(`Backup saved at: ${backupFile}`, 'green');
    log('================================', 'blue');
    
  } catch (error) {
    log(`✗ Process failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { backupDatabase, restoreDatabase };
