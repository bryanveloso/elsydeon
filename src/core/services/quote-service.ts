import { sql, count } from 'drizzle-orm';
import { db } from '@core/db';
import * as schema from '@core/schema';

export interface Quote {
  id: number;
  text: string;
  quotee: string;
  quoter: string;
  year: number;
  timestamp: string;
}

export interface QuoteAddParams {
  text: string;
  quotee: string;
  quoter: string;
}

export class QuoteService {
  async getQuotesCount(): Promise<number> {
    const result = await db
      .select({ value: count() })
      .from(schema.quotes);
    
    return result[0].value;
  }

  async getQuoteYears(): Promise<number[]> {
    const result = await db
      .select({ year: schema.quotes.year })
      .from(schema.quotes)
      .groupBy(schema.quotes.year)
      .orderBy(schema.quotes.year);
    
    return result.map(row => row.year);
  }

  async getRandomQuotes(limit: number = 25): Promise<Quote[]> {
    const result = await db
      .select()
      .from(schema.quotes)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
    
    return result;
  }

  async getRandomQuote(): Promise<Quote | null> {
    const result = await this.getRandomQuotes(1);
    return result.length > 0 ? result[0] : null;
  }

  async getLatestQuotes(limit: number = 25): Promise<Quote[]> {
    const result = await db
      .select()
      .from(schema.quotes)
      .orderBy(sql`${schema.quotes.id} DESC`)
      .limit(limit);
    
    return result;
  }

  async getLatestQuote(): Promise<Quote | null> {
    const result = await this.getLatestQuotes(1);
    return result.length > 0 ? result[0] : null;
  }

  async getQuoteById(id: number): Promise<Quote | null> {
    const result = await db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.id} = ${id}`);
    
    return result.length > 0 ? result[0] : null;
  }
  
  async getAdjacentQuotes(id: number): Promise<{ current: Quote | null; previous: Quote | null; next: Quote | null }> {
    // Get the current quote
    const current = await this.getQuoteById(id);
    
    if (!current) {
      return { current: null, previous: null, next: null };
    }
    
    // Get the previous quote (lower ID)
    const previousResult = await db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.id} < ${id}`)
      .orderBy(sql`${schema.quotes.id} DESC`)
      .limit(1);
    
    // Get the next quote (higher ID)
    const nextResult = await db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.id} > ${id}`)
      .orderBy(sql`${schema.quotes.id} ASC`)
      .limit(1);
    
    return {
      current,
      previous: previousResult.length > 0 ? previousResult[0] : null,
      next: nextResult.length > 0 ? nextResult[0] : null
    };
  }

  async addQuote(params: QuoteAddParams): Promise<{ id: number }> {
    const { text, quotee, quoter } = params;
    const year = new Date().getFullYear();
    const timestamp = new Date().toISOString();
    
    const result = await db
      .insert(schema.quotes)
      .values({
        text,
        quotee,
        quoter,
        year,
        timestamp,
      })
      .returning({ id: schema.quotes.id });
    
    return { id: result[0].id };
  }

  async searchQuotes(searchText: string, limit: number = 25, random: boolean = false): Promise<{ quotes: Quote[]; totalMatches: number }> {
    const countResult = await db
      .select({
        count: sql`COUNT(*)`,
      })
      .from(schema.quotes)
      .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`);
    
    const totalMatches = Number(countResult[0].count);
    
    if (totalMatches === 0) {
      return { quotes: [], totalMatches: 0 };
    }
    
    const query = db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`);
    
    if (random) {
      query.orderBy(sql`RANDOM()`);
    } else {
      query.orderBy(sql`${schema.quotes.id} DESC`);
    }
    
    const quotes = await query.limit(limit);
    
    return { quotes, totalMatches };
  }

  async getQuotesByUser(username: string, limit: number = 25, random: boolean = false): Promise<{ quotes: Quote[]; totalMatches: number }> {
    const countResult = await db
      .select({
        count: sql`COUNT(*)`,
      })
      .from(schema.quotes)
      .where(sql`${schema.quotes.quotee} LIKE ${'%' + username + '%'}`);
    
    const totalMatches = Number(countResult[0].count);
    
    if (totalMatches === 0) {
      return { quotes: [], totalMatches: 0 };
    }
    
    const query = db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.quotee} LIKE ${'%' + username + '%'}`);
    
    if (random) {
      query.orderBy(sql`RANDOM()`);
    } else {
      query.orderBy(sql`${schema.quotes.id} DESC`);
    }
    
    const quotes = await query.limit(limit);
    
    return { quotes, totalMatches };
  }
}

// Export a singleton instance
export const quoteService = new QuoteService();