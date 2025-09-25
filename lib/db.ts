import { Pool, QueryResultRow } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/lib/schema';

// Use connection string from environment variable or fall back to local config
const connectionString = process.env.POSTGRES_URL || 
  `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

if (!connectionString) {
  throw new Error('Database connection string is not defined. Please set POSTGRES_URL or individual PG* environment variables.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Export the database client
export const db = drizzle(pool, { schema });

// Export a query function for direct SQL queries if needed
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string, 
  params: unknown[] = []
): Promise<{ rows: T[] }> {
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, params);
    return result;
  } finally {
    client.release();
  }
}

// For backward compatibility
export async function connectDB() {
  return {
    execute: async <T extends QueryResultRow>(
      query: string, 
      params: unknown[] = []
    ): Promise<[T[], unknown]> => {
      try {
        const result = await pool.query<T>(query, params);
        return [result.rows, null];
      } catch (error) {
        console.error('Database query error:', error);
        return [[], error];
      }
    },
  };
}
