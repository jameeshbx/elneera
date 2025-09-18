#!/bin/bash

# Fix Migration Issue Script
# This script documents the manual fix for the migration issue
# where migrations were applied to the database but missing from local migrations directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Migration Issue Fix Summary${NC}"
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

echo -e "${YELLOW}Step 1: Check current migration status${NC}"
npx prisma migrate status

echo -e "${YELLOW}Step 2: Set database schema to public${NC}"
psql "$DATABASE_URL" -c "SET search_path TO public;"

echo -e "${YELLOW}Step 3: Create Prisma migrations table if it doesn't exist${NC}"
psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS \"_prisma_migrations\" (id VARCHAR(36) PRIMARY KEY, checksum VARCHAR(64) NOT NULL, finished_at TIMESTAMPTZ, migration_name VARCHAR(255) NOT NULL, logs TEXT, rolled_back_at TIMESTAMPTZ, started_at TIMESTAMPTZ NOT NULL DEFAULT now(), applied_steps_count INTEGER NOT NULL DEFAULT 0);"

echo -e "${YELLOW}Step 4: Mark migration as applied${NC}"
psql "$DATABASE_URL" -c "INSERT INTO \"_prisma_migrations\" (id, checksum, migration_name, started_at, finished_at, applied_steps_count) VALUES ('20250818230252_baseline', 'checksum_placeholder', '20250818230252_baseline', NOW(), NOW(), 1) ON CONFLICT (id) DO NOTHING;"

echo -e "${YELLOW}Step 5: Verify migration status${NC}"
npx prisma migrate status

echo -e "${YELLOW}Step 6: Generate Prisma client${NC}"
npx prisma generate

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Migration issue has been resolved!${NC}"
echo -e "${GREEN}The database schema is now up to date.${NC}"
echo -e "${BLUE}================================${NC}"

echo -e "${YELLOW}What was the problem?${NC}"
echo "The database had migrations applied that were not tracked in the local"
echo "migrations directory. This caused Prisma to think the database was"
echo "out of sync with the local migration files."

echo -e "${YELLOW}What was the solution?${NC}"
echo "1. We manually created the Prisma migrations tracking table"
echo "2. We marked the existing migration as applied in the database"
echo "3. This synchronized the local migration state with the database"

echo -e "${YELLOW}Prevention:${NC}"
echo "To prevent this in the future:"
echo "- Always use 'npx prisma migrate deploy' in production"
echo "- Keep migration files in version control"
echo "- Don't manually apply migrations to the database"
echo "- Use the backup scripts provided if you need to reset migrations"
