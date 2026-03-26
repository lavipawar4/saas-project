import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('DATABASE_URL is not set. Database connection will fail at runtime.');
}

const sql = neon(databaseUrl || 'postgresql://placeholder:password@localhost:5432/db');
export const db = drizzle(sql, { schema });
