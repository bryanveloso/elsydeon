import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  quotee: text('quotee').notNull(),
  quoter: text('quoter').notNull(),
  year: integer('year').notNull(),
  timestamp: text('timestamp').notNull(),
}, (table) => ({
  // Create indexes for faster searches
  textIdx: index('quotes_text_idx').on(table.text),
  quoteeIdx: index('quotes_quotee_idx').on(table.quotee),
  yearIdx: index('quotes_year_idx').on(table.year),
  idIdx: index('quotes_id_desc_idx').on(table.id),
}));