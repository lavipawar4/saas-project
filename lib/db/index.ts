import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('DATABASE_URL is not set. Database connection will fail at runtime.');
}

// Only initialize neon if we have a URL, otherwise use a safe no-op or throw a clearer error in-place
export const db = drizzle(neon(databaseUrl || ""), { schema });
