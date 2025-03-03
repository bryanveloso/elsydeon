import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  quotee: text('quotee').notNull(),
  quoter: text('quoter').notNull(),
  year: integer('year').notNull(),
  timestamp: text('timestamp').notNull(),
});