// Koneksi Neon Postgres via driver HTTP (bukan ws) — cocok untuk serverless
// function Vercel, tidak perlu bundling driver ws yang bikin ribet.

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL belum diset. Isi .env (lokal) atau environment variable di Vercel dengan connection string Neon.'
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
