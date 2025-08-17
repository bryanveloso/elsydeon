import { sql } from 'drizzle-orm'
import { db } from '@core/db'
import * as schema from '@core/schema'

export interface Quote {
  id: number
  text: string
  quotee: string
  quoter: string
  year: number
  timestamp: string
}

export interface QuoteAddParams {
  text: string
  quotee: string
  quoter: string
}

export class QuoteService {
  async getRandomQuotes(limit: number = 25): Promise<Quote[]> {
    const result = await db
      .select()
      .from(schema.quotes)
      .orderBy(sql`RANDOM()`)
      .limit(limit)

    return result
  }

  async getRandomQuote(): Promise<Quote | null> {
    const result = await this.getRandomQuotes(1)
    return result.length > 0 ? result[0] : null
  }

  async getLatestQuotes(limit: number = 25): Promise<Quote[]> {
    const result = await db
      .select()
      .from(schema.quotes)
      .orderBy(sql`${schema.quotes.id} DESC`)
      .limit(limit)

    return result
  }

  async getLatestQuote(): Promise<Quote | null> {
    const result = await this.getLatestQuotes(1)
    return result.length > 0 ? result[0] : null
  }

  async getQuoteById(id: number): Promise<Quote | null> {
    const result = await db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.id} = ${id}`)

    return result.length > 0 ? result[0] : null
  }

  async addQuote(params: QuoteAddParams): Promise<{ id: number }> {
    const { text, quotee, quoter } = params
    const year = new Date().getFullYear()
    const timestamp = new Date().toISOString()

    const result = await db
      .insert(schema.quotes)
      .values({
        text,
        quotee,
        quoter,
        year,
        timestamp
      })
      .returning({ id: schema.quotes.id })

    return { id: result[0].id }
  }

  async searchQuotes(
    searchText: string,
    limit: number = 25,
    random: boolean = false
  ): Promise<{ quotes: Quote[]; totalMatches: number }> {
    const countResult = await db
      .select({
        count: sql`COUNT(*)`
      })
      .from(schema.quotes)
      .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`)

    const totalMatches = Number(countResult[0].count)

    if (totalMatches === 0) {
      return { quotes: [], totalMatches: 0 }
    }

    const query = db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`)

    if (random) {
      query.orderBy(sql`RANDOM()`)
    } else {
      query.orderBy(sql`${schema.quotes.id} DESC`)
    }

    const quotes = await query.limit(limit)

    return { quotes, totalMatches }
  }

  async getQuotesByUser(
    username: string,
    limit: number = 25,
    random: boolean = false
  ): Promise<{ quotes: Quote[]; totalMatches: number }> {
    const countResult = await db
      .select({
        count: sql`COUNT(*)`
      })
      .from(schema.quotes)
      .where(sql`${schema.quotes.quotee} LIKE ${'%' + username + '%'}`)

    const totalMatches = Number(countResult[0].count)

    if (totalMatches === 0) {
      return { quotes: [], totalMatches: 0 }
    }

    const query = db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.quotee} LIKE ${'%' + username + '%'}`)

    if (random) {
      query.orderBy(sql`RANDOM()`)
    } else {
      query.orderBy(sql`${schema.quotes.id} DESC`)
    }

    const quotes = await query.limit(limit)

    return { quotes, totalMatches }
  }

  async getQuotesForAnalysis(username: string, sampleSize: number = 10): Promise<Quote[]> {
    const { quotes, totalMatches } = await this.getQuotesByUser(username, sampleSize, true)
    return quotes
  }

  async getUserQuoteStats(username: string): Promise<{
    totalQuotes: number
    firstQuoteYear: number | null
    lastQuoteYear: number | null
    averageLength: number
  }> {
    const { totalMatches } = await this.getQuotesByUser(username, 1)
    
    if (totalMatches === 0) {
      return {
        totalQuotes: 0,
        firstQuoteYear: null,
        lastQuoteYear: null,
        averageLength: 0
      }
    }

    const allQuotes = await db
      .select()
      .from(schema.quotes)
      .where(sql`${schema.quotes.quotee} LIKE ${'%' + username + '%'}`)

    const years = allQuotes.map(q => q.year).sort()
    const totalLength = allQuotes.reduce((sum, q) => sum + q.text.length, 0)

    return {
      totalQuotes: totalMatches,
      firstQuoteYear: years[0],
      lastQuoteYear: years[years.length - 1],
      averageLength: Math.round(totalLength / totalMatches)
    }
  }

  async getAllQuotesPaginated(page: number = 1, perPage: number = 100): Promise<{
    quotes: Quote[]
    pagination: {
      page: number
      per_page: number
      total: number
      total_pages: number
    }
  }> {
    // Get total count
    const countResult = await db
      .select({
        count: sql`COUNT(*)`
      })
      .from(schema.quotes)

    const total = Number(countResult[0].count)
    const totalPages = Math.ceil(total / perPage)
    const offset = (page - 1) * perPage

    // Get paginated quotes
    const quotes = await db
      .select()
      .from(schema.quotes)
      .orderBy(sql`${schema.quotes.id} DESC`)
      .limit(perPage)
      .offset(offset)

    return {
      quotes,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages
      }
    }
  }

  async getAllUsers(): Promise<Array<{
    quotee: string
    quote_count: number
    first_quote_date: string
    last_quote_date: string
  }>> {
    const result = await db
      .select({
        quotee: schema.quotes.quotee,
        quote_count: sql`COUNT(*)`,
        first_quote_date: sql`MIN(${schema.quotes.timestamp})`,
        last_quote_date: sql`MAX(${schema.quotes.timestamp})`
      })
      .from(schema.quotes)
      .groupBy(schema.quotes.quotee)
      .orderBy(sql`COUNT(*) DESC`)

    return result.map(row => ({
      quotee: row.quotee,
      quote_count: Number(row.quote_count),
      first_quote_date: row.first_quote_date as string,
      last_quote_date: row.last_quote_date as string
    }))
  }
}

// Export a singleton instance
export const quoteService = new QuoteService()
