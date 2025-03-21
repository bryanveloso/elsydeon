import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { count } from 'drizzle-orm'

// Import schema
import * as schema from './schema'

// Database setup
const dbPath = Bun.env.DATABASE_PATH || './data/quotes.db'
console.log(`Connected to database at ${dbPath}`)
const sqlite = new Database(dbPath)
export const db = drizzle(sqlite)

// Load and log quote count
export const getQuoteCount = async (): Promise<number> => {
  try {
    const result = await db.select({ value: count() }).from(schema.quotes)
    return result[0].value
  } catch (error) {
    console.error('Failed to get quote count:', error)
    return 0
  }
}

// Graceful shutdown helper
export const setupShutdownHandler = () => {
  const handleShutdown = () => {
    console.log('Shutting down gracefully...')
    process.exit(0)
  }

  process.on('SIGINT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
}
