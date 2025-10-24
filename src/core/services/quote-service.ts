/**
 * Quote service for fetching and managing quotes from the Synthform API
 */

export interface Quote {
  id: string
  number: number
  text: string
  quotee: {
    id: string
    display_name: string
    username: string | null
  }
  quoter: {
    id: string
    display_name: string
    username: string | null
  }
  year: number
  created_at: string
}

export interface QuoteAddParams {
  text: string
  quotee: string
  quoter: string
}

interface QuoteSearchResponse {
  quotes: Quote[]
  total_matches: number
}

interface QuoteStatsResponse {
  total_quotes: number
  first_quote_year: number | null
  last_quote_year: number | null
  average_length: number
}

export class QuoteService {
  private baseUrl: string

  constructor() {
    const synthformUrl = Bun.env.SYNTHFORM_API_URL || 'http://host.docker.internal:7175/api'
    this.baseUrl = `${synthformUrl}/quotes`
  }

  async getRandomQuotes(limit: number = 25): Promise<Quote[]> {
    try {
      const url = `${this.baseUrl}/random?limit=${limit}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('[Quotes] Error fetching random quotes:', error)
      return []
    }
  }

  async getRandomQuote(): Promise<Quote | null> {
    const result = await this.getRandomQuotes(1)
    return result.length > 0 ? result[0] : null
  }

  async getLatestQuotes(limit: number = 25): Promise<Quote[]> {
    try {
      const url = `${this.baseUrl}/latest?limit=${limit}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('[Quotes] Error fetching latest quotes:', error)
      return []
    }
  }

  async getLatestQuote(): Promise<Quote | null> {
    const result = await this.getLatestQuotes(1)
    return result.length > 0 ? result[0] : null
  }

  async getQuoteById(id: number): Promise<Quote | null> {
    try {
      const url = `${this.baseUrl}/${id}`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('[Quotes] Error fetching quote by id:', error)
      return null
    }
  }

  async addQuote(params: QuoteAddParams): Promise<{ id: number } | null> {
    try {
      const url = `${this.baseUrl}/`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: params.text,
          quotee_username: params.quotee,
          quoter_username: params.quoter,
        }),
      })

      if (!response.ok) {
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return null
      }

      const quote: Quote = await response.json()
      return { id: quote.number }
    } catch (error) {
      console.error('[Quotes] Error adding quote:', error)
      return null
    }
  }

  async searchQuotes(
    searchText: string,
    limit: number = 25,
    random: boolean = false
  ): Promise<{ quotes: Quote[]; totalMatches: number }> {
    try {
      const params = new URLSearchParams({
        q: searchText,
        limit: limit.toString(),
        random: random.toString(),
      })
      const url = `${this.baseUrl}/search?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return { quotes: [], totalMatches: 0 }
      }

      const data: QuoteSearchResponse = await response.json()
      return {
        quotes: data.quotes,
        totalMatches: data.total_matches,
      }
    } catch (error) {
      console.error('[Quotes] Error searching quotes:', error)
      return { quotes: [], totalMatches: 0 }
    }
  }

  async getQuotesByUser(
    username: string,
    limit: number = 25,
    random: boolean = false
  ): Promise<{ quotes: Quote[]; totalMatches: number }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        random: random.toString(),
      })
      const url = `${this.baseUrl}/by-user/${encodeURIComponent(username)}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return { quotes: [], totalMatches: 0 }
      }

      const data: QuoteSearchResponse = await response.json()
      return {
        quotes: data.quotes,
        totalMatches: data.total_matches,
      }
    } catch (error) {
      console.error('[Quotes] Error fetching quotes by user:', error)
      return { quotes: [], totalMatches: 0 }
    }
  }

  async getQuotesForAnalysis(username: string, sampleSize: number = 10): Promise<Quote[]> {
    const { quotes } = await this.getQuotesByUser(username, sampleSize, true)
    return quotes
  }

  async getUserQuoteStats(username: string): Promise<{
    totalQuotes: number
    firstQuoteYear: number | null
    lastQuoteYear: number | null
    averageLength: number
  }> {
    try {
      const url = `${this.baseUrl}/stats/${encodeURIComponent(username)}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return {
          totalQuotes: 0,
          firstQuoteYear: null,
          lastQuoteYear: null,
          averageLength: 0,
        }
      }

      const data: QuoteStatsResponse = await response.json()
      return {
        totalQuotes: data.total_quotes,
        firstQuoteYear: data.first_quote_year,
        lastQuoteYear: data.last_quote_year,
        averageLength: data.average_length,
      }
    } catch (error) {
      console.error('[Quotes] Error fetching user stats:', error)
      return {
        totalQuotes: 0,
        firstQuoteYear: null,
        lastQuoteYear: null,
        averageLength: 0,
      }
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
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const url = `${this.baseUrl}/?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return {
          quotes: [],
          pagination: {
            page: 1,
            per_page: perPage,
            total: 0,
            total_pages: 0,
          },
        }
      }

      return await response.json()
    } catch (error) {
      console.error('[Quotes] Error fetching paginated quotes:', error)
      return {
        quotes: [],
        pagination: {
          page: 1,
          per_page: perPage,
          total: 0,
          total_pages: 0,
        },
      }
    }
  }

  async getAllUsers(): Promise<Array<{
    quotee: string
    quote_count: number
    first_quote_date: string
    last_quote_date: string
  }>> {
    try {
      const url = `${this.baseUrl}/users`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[Quotes] HTTP error! status: ${response.status}`)
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('[Quotes] Error fetching all users:', error)
      return []
    }
  }

  async getQuoteCount(): Promise<number> {
    try {
      const result = await this.getAllQuotesPaginated(1, 1)
      return result.pagination.total
    } catch (error) {
      console.error('[Quotes] Error fetching quote count:', error)
      return 0
    }
  }
}

// Export a singleton instance
export const quoteService = new QuoteService()
