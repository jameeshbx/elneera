#!/usr/bin/env node

/**
 * Example script showing how to populate the bankData JSON column
 * in PaymentMethod records
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPaymentMethodWithBankData() {
  try {
    console.log('Creating PaymentMethod with bankData...');
    
    // Example 1: Bank Account Payment Method
    const bankAccountPayment = await prisma.paymentMethod.create({
      data: {
        type: 'BANK_ACCOUNT',
        name: 'HDFC Bank Account',
        identifier: '1234567890',
        bankName: 'HDFC Bank',
        branchName: 'Mumbai Main Branch',
        ifscCode: 'HDFC0001234',
        bankCountry: 'India',
        currency: 'INR',
        isActive: true,
        bankData: {
          accountType: 'Savings',
          accountHolderName: 'John Doe',
          accountNumber: '1234567890',
          routingNumber: 'HDFC0001234',
          swiftCode: 'HDFCINBB',
          bankAddress: {
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            postalCode: '400001'
          },
          additionalInfo: {
            minimumBalance: 1000,
            interestRate: 3.5,
            monthlyMaintenanceFee: 0
          }
        }
      }
    });
    
    console.log('✓ Bank Account Payment Method created:', bankAccountPayment.id);
    
    // Example 2: Credit Card Payment Method
    const creditCardPayment = await prisma.paymentMethod.create({
      data: {
        type: 'CREDIT_CARD',
        name: 'Visa Credit Card',
        cardHolder: 'Jane Smith',
        expiryDate: '12/25',
        isActive: true,
        bankData: {
          cardType: 'Visa',
          cardNumber: '**** **** **** 1234',
          cvv: '***',
          issuingBank: 'ICICI Bank',
          creditLimit: 50000,
          availableCredit: 45000,
          billingAddress: {
            street: '456 Oak Avenue',
            city: 'Delhi',
            state: 'Delhi',
            country: 'India',
            postalCode: '110001'
          },
          cardFeatures: {
            rewards: true,
            cashback: true,
            travelInsurance: true,
            purchaseProtection: true
          }
        }
      }
    });
    
    console.log('✓ Credit Card Payment Method created:', creditCardPayment.id);
    
    // Example 3: UPI Payment Method
    const upiPayment = await prisma.paymentMethod.create({
      data: {
        type: 'UPI',
        name: 'Google Pay UPI',
        identifier: 'john.doe@okicici',
        upiProvider: 'Google Pay',
        isActive: true,
        bankData: {
          upiId: 'john.doe@okicici',
          linkedBank: 'ICICI Bank',
          linkedAccount: '****7890',
          upiFeatures: {
            instantTransfer: true,
            qrCodeSupport: true,
            merchantPayments: true
          },
          limits: {
            dailyLimit: 100000,
            perTransactionLimit: 10000,
            monthlyLimit: 1000000
          }
        }
      }
    });
    
    console.log('✓ UPI Payment Method created:', upiPayment.id);
    
    // Example 4: QR Code Payment Method
    const qrCodePayment = await prisma.paymentMethod.create({
      data: {
        type: 'QR_CODE',
        name: 'Business QR Code',
        isActive: true,
        bankData: {
          qrCodeType: 'UPI QR',
          merchantId: 'MERCHANT123',
          storeName: 'Travel Agency XYZ',
          qrCodeData: {
            upiId: 'travel.agency@okicici',
            merchantCode: 'TRAVEL001',
            amount: null, // Dynamic amount
            currency: 'INR'
          },
          supportedApps: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM'],
          qrCodeImage: 'https://example.com/qr-code.png'
        }
      }
    });
    
    console.log('✓ QR Code Payment Method created:', qrCodePayment.id);
    
    console.log('\n✅ All PaymentMethod examples created successfully!');
    
    // Display all created payment methods
    const allPaymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4
    });
    
    console.log('\n📋 Created Payment Methods:');
    allPaymentMethods.forEach((pm, index) => {
      console.log(`${index + 1}. ${pm.name} (${pm.type})`);
      console.log(`   ID: ${pm.id}`);
      console.log(`   Bank Data Keys: ${pm.bankData ? Object.keys(pm.bankData).join(', ') : 'None'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error creating PaymentMethod:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function queryPaymentMethodsWithBankData() {
  try {
    console.log('\n🔍 Querying PaymentMethods with bankData...');
    
    // Query all payment methods
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        bankData: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        bankData: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${paymentMethods.length} PaymentMethods with bankData:`);
    
    paymentMethods.forEach((pm, index) => {
      console.log(`\n${index + 1}. ${pm.name} (${pm.type})`);
      console.log(`   ID: ${pm.id}`);
      console.log(`   Bank Data:`, JSON.stringify(pm.bankData, null, 2));
    });
    
  } catch (error) {
    console.error('❌ Error querying PaymentMethods:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 PaymentMethod bankData Population Example');
  console.log('===========================================\n');
  
  await createPaymentMethodWithBankData();
  await queryPaymentMethodsWithBankData();
}

if (require.main === module) {
  main();
}

module.exports = { createPaymentMethodWithBankData, queryPaymentMethodsWithBankData };
