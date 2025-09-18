const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Connect to database
    await prisma.$connect();
    console.log('✓ Connected to database');
    
    // Set the schema to public
    await prisma.$queryRaw`SET search_path TO public`;
    console.log('✓ Set schema to public');
    
    // Create the schema if it doesn't exist
    await prisma.$queryRaw`CREATE SCHEMA IF NOT EXISTS public`;
    console.log('✓ Created public schema');
    
    // Grant usage on schema
    await prisma.$queryRaw`GRANT USAGE ON SCHEMA public TO neondb_owner`;
    console.log('✓ Granted usage on schema');
    
    // Grant all privileges on schema
    await prisma.$queryRaw`GRANT ALL PRIVILEGES ON SCHEMA public TO neondb_owner`;
    console.log('✓ Granted all privileges on schema');
    
    console.log('✓ Database setup completed successfully!');
    
  } catch (error) {
    console.error('✗ Database setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
