#!/bin/bash

# Database Backup Script
# This script creates a backup of the current database before migration reset

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database backup process...${NC}"

# Create backup directory if it doesn't exist
BACKUP_DIR="database_backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"

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

# Create backup using pg_dump
echo -e "${YELLOW}Running pg_dump...${NC}"
pg_dump "$DATABASE_URL" --no-owner --no-privileges --clean --if-exists --no-sync --no-comments > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database backup completed successfully!${NC}"
    echo -e "${GREEN}Backup saved to: $BACKUP_FILE${NC}"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Backup size: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}✗ Database backup failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Backup process completed!${NC}"
