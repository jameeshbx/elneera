# Database Migration Reset Scripts

This directory contains scripts to handle database migration issues, specifically when migrations are applied to the database but missing from the local migrations directory.

## Problem

When you see an error like:

```
The following migration(s) are applied to the database but missing from the local migrations directory:
20250708063358_init, 20250720112505_add_updated_at_default, 20250818224811_complete_schema_sync
```

This means the database has migrations that your local Prisma setup doesn't know about.

## Solution

There are several approaches to resolve this issue:

### Approach 1: Manual Fix (Recommended for this specific issue)

If the database schema is already correct but Prisma doesn't recognize it:

1. **Set Schema**: Ensure the database schema is set to 'public'
2. **Create Migration Table**: Create the Prisma migrations tracking table
3. **Mark Applied**: Mark the existing migration as applied
4. **Verify**: Check that the migration status is correct

### Approach 2: Backup → Reset → Restore

For cases where you need to completely reset:

1. **Backup**: Create a complete backup of the current database
2. **Reset**: Use `prisma migrate reset` to drop and recreate the schema
3. **Restore**: Restore the data from the backup
4. **Mark Applied**: Mark the current migration as applied

## Scripts

### 1. `fix-migration-issue.sh` (Recommended - Manual Fix)

This script applies the manual fix for the specific migration issue:

```bash
./scripts/fix-migration-issue.sh
```

**What it does:**

- Sets the database schema to 'public'
- Creates the Prisma migrations tracking table
- Marks the existing migration as applied
- Verifies the migration status
- Generates the Prisma client

**Use when:**

- The database schema is already correct
- Prisma doesn't recognize the applied migrations
- You want to preserve all data without backup/restore

### 2. `migration-reset-with-backup.js` (Data Preserving - Full Reset)

This is the recommended script that preserves your data:

```bash
node scripts/migration-reset-with-backup.js
```

**What it does:**

- Creates a JSON backup of all your data using Prisma
- Prompts for confirmation before proceeding
- Runs `prisma migrate reset --force`
- Restores your data from the JSON backup
- Marks the current migration as applied
- Generates the Prisma client

**Advantages:**

- ✅ Preserves all your data
- ✅ No pg_dump version compatibility issues
- ✅ Works with any PostgreSQL version
- ✅ Handles foreign key constraints properly

### 2. `simple-migration-reset.sh` (Fast - No Data Preservation)

This script is faster but does not preserve data:

```bash
./scripts/simple-migration-reset.sh
```

**What it does:**

- Pulls current database schema
- Runs `prisma migrate reset --force`
- Marks the current migration as applied
- Generates the Prisma client

**Use when:**

- You don't need to preserve data
- You want a quick fix
- You're in development environment

### 3. `migration-reset.sh` (Legacy - pg_dump based)

This script uses pg_dump (may have version compatibility issues):

```bash
./scripts/migration-reset.sh
```

**What it does:**

- Creates a timestamped backup using pg_dump
- Prompts for confirmation before proceeding
- Runs `prisma migrate reset --force`
- Restores your data from the backup
- Marks the current migration as applied
- Generates the Prisma client

**Note:** May fail with PostgreSQL version mismatches

### 2. `backup-database.sh` (Standalone Backup)

Creates a backup only:

```bash
./scripts/backup-database.sh
```

**Usage:**

- Creates a backup in `database_backups/` directory
- Requires `DATABASE_URL` environment variable
- Uses `pg_dump` for PostgreSQL backups

### 3. `restore-database.sh` (Standalone Restore)

Restores from a backup file:

```bash
./scripts/restore-database.sh <backup_file.sql>
```

**Usage:**

- Restores from a specific backup file
- Prompts for confirmation before overwriting
- Example: `./scripts/restore-database.sh database_backups/backup_20241201_143022.sql`

## Prerequisites

1. **PostgreSQL Tools**: Make sure `pg_dump` and `psql` are installed
2. **Environment Variable**: Set your `DATABASE_URL` environment variable
3. **Permissions**: Scripts are executable (`chmod +x`)

## Manual Steps (if scripts fail)

If the automated scripts fail, you can perform the steps manually:

### Step 1: Backup

```bash
pg_dump "$DATABASE_URL" --no-owner --no-privileges --clean --if-exists > backup.sql
```

### Step 2: Reset Migrations

```bash
npx prisma migrate reset --force
```

### Step 3: Restore Data

```bash
psql "$DATABASE_URL" < backup.sql
```

### Step 4: Mark Migration as Applied

```bash
npx prisma migrate resolve --applied 20250818230252_baseline
```

### Step 5: Generate Client

```bash
npx prisma generate
```

## Safety Notes

- **Always backup first**: The scripts create automatic backups, but you can also create manual backups
- **Test in development**: Always test this process in a development environment first
- **Verify data**: After restore, verify that your data is intact
- **Check connections**: Ensure your application can connect to the database after the process

## Troubleshooting

### Script fails with permission error

```bash
chmod +x scripts/*.sh
```

### pg_dump not found

Install PostgreSQL client tools:

- **macOS**: `brew install postgresql`
- **Ubuntu**: `sudo apt-get install postgresql-client`
- **Windows**: Download from PostgreSQL website

### DATABASE_URL not set

Set your database URL:

```bash
export DATABASE_URL="postgresql://username:password@host:port/database"
```

### Migration resolve fails

You may need to manually check the migration status:

```bash
npx prisma migrate status
```

## Files Created

- `database_backups/` - Directory containing timestamped backups
- `backup_YYYYMMDD_HHMMSS.sql` - Individual backup files

## Recovery

If something goes wrong:

1. Check the backup files in `database_backups/`
2. Use `restore-database.sh` to restore from a backup
3. Contact your database administrator if needed
