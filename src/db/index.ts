import { drizzle, BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

// Use environment variable with fallback for database path
const dbPath = Bun.env.DATABASE_PATH || 'data/quotes.db';

// Add connection error handling
let db: BunSQLiteDatabase;
try {
  const sqlite = new Database(dbPath);
  db = drizzle(sqlite);
  console.log(`Connected to database at ${dbPath}`);
} catch (error) {
  console.error(`Failed to connect to database at ${dbPath}:`, error);
  process.exit(1);
}

export { db };
