import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text'),
  quotee: text('quotee'),
  quoter: text('quoter'),
  year: integer('year'),
  timestamp: text('timestamp'),
});
