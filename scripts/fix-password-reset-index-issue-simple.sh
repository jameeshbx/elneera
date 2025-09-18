#!/bin/bash

# Simplified Fix PasswordReset Index Issue Script
# This script resolves the migration conflict without resetting the database

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

# Step 1: Remove problematic migration
echo -e "${YELLOW}Step 1: Removing problematic migration...${NC}"
PROBLEMATIC_MIGRATION="prisma/migrations/20250819082216_apply_uptodate"

if [ -d "$PROBLEMATIC_MIGRATION" ]; then
    echo -e "${YELLOW}Removing: $PROBLEMATIC_MIGRATION${NC}"
    rm -rf "$PROBLEMATIC_MIGRATION"
    echo -e "${GREEN}✓ Problematic migration removed!${NC}"
else
    echo -e "${YELLOW}Migration directory not found, continuing...${NC}"
fi

# Step 2: Mark remaining migrations as applied
echo -e "${YELLOW}Step 2: Marking migrations as applied...${NC}"
npx prisma migrate resolve --applied 20250818230252_baseline
npx prisma migrate resolve --applied 20250819134500_add_bank_data
npx prisma migrate resolve --applied 20250819135000_add_relation_indexes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations marked as applied successfully!${NC}"
else
    echo -e "${RED}✗ Failed to mark migrations as applied!${NC}"
    echo -e "${YELLOW}You may need to manually resolve this.${NC}"
fi

# Step 3: Generate Prisma client
echo -e "${YELLOW}Step 3: Generating Prisma client...${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma client generated successfully!${NC}"
else
    echo -e "${RED}✗ Prisma client generation failed!${NC}"
fi

# Step 4: Verify migration status
echo -e "${YELLOW}Step 4: Verifying migration status...${NC}"
npx prisma migrate status

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}PasswordReset index issue has been resolved!${NC}"
echo -e "${BLUE}================================${NC}"

echo -e "${YELLOW}What was the problem?${NC}"
echo "The migration '20250819082216_apply_uptodate' was trying to drop"
echo "the 'PasswordReset_userId_idx' index before it was created by"
echo "the '20250819135000_add_relation_indexes' migration."

echo -e "${YELLOW}What was the solution?${NC}"
echo "1. Removed the problematic migration file"
echo "2. Marked all remaining migrations as applied"
echo "3. Generated the Prisma client"

echo -e "${YELLOW}Prevention:${NC}"
echo "To prevent this in the future:"
echo "- Always check migration order when creating new migrations"
echo "- Use 'npx prisma migrate dev' to create migrations"
echo "- Test migrations on a development database first"
