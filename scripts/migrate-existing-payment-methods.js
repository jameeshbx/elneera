#!/usr/bin/env node

/**
 * Utility script to migrate existing PaymentMethod records
 * to include bankData JSON column
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingPaymentMethods() {
  try {
    console.log('🔧 Migrating existing PaymentMethod records to include bankData...');
    
    // Get all existing payment methods without bankData
    const existingPaymentMethods = await prisma.paymentMethod.findMany({
      where: {
        bankData: {
          equals: null
        }
      }
    });
    
    console.log(`Found ${existingPaymentMethods.length} PaymentMethod records without bankData`);
    
    if (existingPaymentMethods.length === 0) {
      console.log('✅ No PaymentMethod records need migration');
      return;
    }
    
    let migratedCount = 0;
    
    for (const paymentMethod of existingPaymentMethods) {
      try {
        // Create bankData based on the payment method type and existing fields
        const bankData = createBankDataFromExistingFields(paymentMethod);
        
        // Update the payment method with bankData
        await prisma.paymentMethod.update({
          where: { id: paymentMethod.id },
          data: { bankData }
        });
        
        console.log(`✓ Migrated: ${paymentMethod.name || paymentMethod.id} (${paymentMethod.type})`);
        migratedCount++;
        
      } catch (error) {
        console.log(`⚠ Failed to migrate ${paymentMethod.name || paymentMethod.id}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Migration completed! ${migratedCount}/${existingPaymentMethods.length} records migrated`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function createBankDataFromExistingFields(paymentMethod) {
  const baseData = {
    migratedAt: new Date().toISOString(),
    originalFields: {
      name: paymentMethod.name,
      identifier: paymentMethod.identifier,
      bankName: paymentMethod.bankName,
      branchName: paymentMethod.branchName,
      ifscCode: paymentMethod.ifscCode,
      bankCountry: paymentMethod.bankCountry,
      currency: paymentMethod.currency,
      cardHolder: paymentMethod.cardHolder,
      expiryDate: paymentMethod.expiryDate,
      upiProvider: paymentMethod.upiProvider,
      paymentLink: paymentMethod.paymentLink,
      notes: paymentMethod.notes
    }
  };
  
  switch (paymentMethod.type) {
    case 'BANK_ACCOUNT':
      return {
        ...baseData,
        accountType: 'Savings', // Default value
        accountHolderName: paymentMethod.cardHolder || 'Unknown',
        accountNumber: paymentMethod.identifier || 'Unknown',
        routingNumber: paymentMethod.ifscCode,
        bankAddress: {
          country: paymentMethod.bankCountry || 'Unknown'
        },
        additionalInfo: {
          branchName: paymentMethod.branchName,
          notes: paymentMethod.notes
        }
      };
      
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      return {
        ...baseData,
        cardType: paymentMethod.type === 'CREDIT_CARD' ? 'Credit' : 'Debit',
        cardNumber: paymentMethod.identifier ? `**** **** **** ${paymentMethod.identifier.slice(-4)}` : 'Unknown',
        cvv: '***',
        issuingBank: paymentMethod.bankName || 'Unknown',
        billingAddress: {
          country: paymentMethod.bankCountry || 'Unknown'
        },
        cardFeatures: {
          notes: paymentMethod.notes
        }
      };
      
    case 'UPI':
      return {
        ...baseData,
        upiId: paymentMethod.identifier || 'Unknown',
        linkedBank: paymentMethod.bankName || 'Unknown',
        upiFeatures: {
          provider: paymentMethod.upiProvider,
          notes: paymentMethod.notes
        }
      };
      
    case 'QR_CODE':
      return {
        ...baseData,
        qrCodeType: 'Unknown',
        qrCodeData: {
          identifier: paymentMethod.identifier,
          notes: paymentMethod.notes
        }
      };
      
    case 'PAYMENT_GATEWAY':
      return {
        ...baseData,
        gatewayType: 'Unknown',
        gatewayData: {
          identifier: paymentMethod.identifier,
          paymentLink: paymentMethod.paymentLink,
          notes: paymentMethod.notes
        }
      };
      
    default:
      return {
        ...baseData,
        unknownType: true,
        originalType: paymentMethod.type
      };
  }
}

async function validateMigration() {
  try {
    console.log('\n🔍 Validating migration results...');
    
    const totalPaymentMethods = await prisma.paymentMethod.count();
    const paymentMethodsWithBankData = await prisma.paymentMethod.count({
      where: {
        bankData: {
          not: {
            equals: null
          }
        }
      }
    });
    
    console.log(`Total PaymentMethod records: ${totalPaymentMethods}`);
    console.log(`Records with bankData: ${paymentMethodsWithBankData}`);
    console.log(`Records without bankData: ${totalPaymentMethods - paymentMethodsWithBankData}`);
    
    if (paymentMethodsWithBankData === totalPaymentMethods) {
      console.log('✅ All PaymentMethod records now have bankData!');
    } else {
      console.log('⚠ Some PaymentMethod records still missing bankData');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 PaymentMethod Migration Utility');
  console.log('==================================\n');
  
  await migrateExistingPaymentMethods();
  await validateMigration();
}

if (require.main === module) {
  main();
}

module.exports = { migrateExistingPaymentMethods, validateMigration };
