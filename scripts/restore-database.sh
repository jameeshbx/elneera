#!/bin/bash

# Database Restore Script
# This script restores the database from a backup file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Database Restore Script${NC}"

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: $0 <backup_file.sql>"
    echo "Example: $0 database_backups/backup_20241201_143022.sql"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file '$BACKUP_FILE' not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Restoring from backup: $BACKUP_FILE${NC}"

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

# Confirm before proceeding
echo -e "${YELLOW}This will overwrite the current database. Are you sure? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}Starting database restore...${NC}"

# Restore database using psql
echo -e "${YELLOW}Running psql restore...${NC}"
psql "$DATABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restore completed successfully!${NC}"
else
    echo -e "${RED}✗ Database restore failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Restore process completed!${NC}"
