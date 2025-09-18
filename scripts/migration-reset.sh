#!/bin/bash

# Migration Reset Script
# This script handles the complete migration reset process:
# 1. Backup current database
# 2. Reset migrations
# 3. Restore database
# 4. Mark migrations as applied

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Migration Reset Script${NC}"
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

# Step 1: Create backup
echo -e "${YELLOW}Step 1: Creating database backup...${NC}"
BACKUP_DIR="database_backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"
pg_dump "$DATABASE_URL" --no-owner --no-privileges --clean --if-exists --no-sync --no-comments > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup completed successfully!${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Backup size: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Step 2: Reset migrations
echo -e "${YELLOW}Step 2: Resetting migrations...${NC}"
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
    echo -e "${YELLOW}You can restore from backup using:${NC}"
    echo -e "${YELLOW}  ./scripts/restore-database.sh $BACKUP_FILE${NC}"
    exit 1
fi

# Step 3: Restore database
echo -e "${YELLOW}Step 3: Restoring database from backup...${NC}"
echo -e "${YELLOW}Restoring from: $BACKUP_FILE${NC}"

psql "$DATABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restore completed successfully!${NC}"
else
    echo -e "${RED}✗ Database restore failed!${NC}"
    echo -e "${YELLOW}You can manually restore from backup using:${NC}"
    echo -e "${YELLOW}  ./scripts/restore-database.sh $BACKUP_FILE${NC}"
    exit 1
fi

# Step 4: Mark migrations as applied
echo -e "${YELLOW}Step 4: Marking migrations as applied...${NC}"
npx prisma migrate resolve --applied 20250818230252_baseline

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations marked as applied successfully!${NC}"
else
    echo -e "${RED}✗ Failed to mark migrations as applied!${NC}"
    echo -e "${YELLOW}You may need to manually resolve this.${NC}"
fi

# Step 5: Generate Prisma client
echo -e "${YELLOW}Step 5: Generating Prisma client...${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma client generated successfully!${NC}"
else
    echo -e "${RED}✗ Prisma client generation failed!${NC}"
fi

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Migration reset process completed!${NC}"
echo -e "${GREEN}Backup saved at: $BACKUP_FILE${NC}"
echo -e "${BLUE}================================${NC}"
