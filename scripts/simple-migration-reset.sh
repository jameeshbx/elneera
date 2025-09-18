#!/bin/bash

# Simple Migration Reset Script
# This script handles migration reset without requiring pg_dump backup
# It uses Prisma's built-in capabilities to resolve the migration issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Simple Migration Reset Script${NC}"
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

echo -e "${YELLOW}Current migration status:${NC}"
npx prisma migrate status

echo -e "${YELLOW}Step 1: Pulling current database schema...${NC}"
npx prisma db pull

echo -e "${YELLOW}Step 2: Resetting migrations...${NC}"
echo -e "${YELLOW}This will drop and recreate the database schema.${NC}"

# Confirm before proceeding
echo -e "${YELLOW}Are you sure you want to proceed with migration reset? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration reset cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}Running prisma migrate reset...${NC}"
npx prisma migrate reset --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration reset completed successfully!${NC}"
else
    echo -e "${RED}✗ Migration reset failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Marking current migration as applied...${NC}"
npx prisma migrate resolve --applied 20250818230252_baseline

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations marked as applied successfully!${NC}"
else
    echo -e "${RED}✗ Failed to mark migrations as applied!${NC}"
    echo -e "${YELLOW}You may need to manually resolve this.${NC}"
fi

echo -e "${YELLOW}Step 4: Generating Prisma client...${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma client generated successfully!${NC}"
else
    echo -e "${RED}✗ Prisma client generation failed!${NC}"
fi

echo -e "${YELLOW}Step 5: Final migration status check...${NC}"
npx prisma migrate status

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Simple migration reset process completed!${NC}"
echo -e "${YELLOW}Note: This approach does not preserve data.${NC}"
echo -e "${YELLOW}If you need data preservation, use the full backup approach.${NC}"
echo -e "${BLUE}================================${NC}"
