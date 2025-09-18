const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to connect to the database
    await prisma.$connect();
    console.log('✓ Database connection successful!');
    
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
    console.log('Database info:', result);
    
    // Try to set the schema
    console.log('Setting schema to public...');
    await prisma.$queryRaw`SET search_path TO public`;
    
    const result2 = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
    console.log('Database info after setting schema:', result2);
    
  } catch (error) {
    console.error('✗ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
