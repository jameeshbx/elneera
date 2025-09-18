// Simple database connection test
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if DMCForm table exists by trying to count records
    try {
      const dmcCount = await prisma.dMCForm.count();
      console.log(`✅ DMCForm table exists with ${dmcCount} records`);
    } catch (error) {
      console.error('❌ DMCForm table error:', error.message);
    }
    
    // Test if SharedDMC table exists
    try {
      const sharedCount = await prisma.sharedDMC.count();
      console.log(`✅ SharedDMC table exists with ${sharedCount} records`);
    } catch (error) {
      console.error('❌ SharedDMC table error:', error.message);
    }
    
    // Test if Commission table exists
    try {
      const commissionCount = await prisma.commission.count();
      console.log(`✅ Commission table exists with ${commissionCount} records`);
    } catch (error) {
      console.error('❌ Commission table error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

testDatabaseConnection();
