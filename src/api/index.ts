import { setupShutdownHandler } from '@core/utils/shutdown'
import { errorResponse, jsonResponse } from '@core/utils/http'
import { quoteService } from '@core/services/quote'

// Setup shutdown handler
setupShutdownHandler()

// API routes configuration
export const apiRoutes = {
  // GET /api/quotes
  async getQuotes(req: Request) {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '100'), 500)

    if (page < 1) {
      return errorResponse('Page must be greater than 0', 400)
    }

    if (perPage < 1) {
      return errorResponse('per_page must be greater than 0', 400)
    }

    const result = await quoteService.getAllQuotesPaginated(page, perPage)
    
    // Transform quotes to match React app format
    const transformedQuotes = result.quotes.map(quote => ({
      id: quote.number,
      text: quote.text,
      quotee: quote.quotee.display_name,
      quoter: quote.quoter.display_name,
      year: quote.year,
      timestamp: quote.created_at
    }))

    return jsonResponse({
      quotes: transformedQuotes,
      pagination: result.pagination
    })
  },

  // GET /api/quotes/latest
  async getLatestQuotes() {
    const latest = await quoteService.getLatestQuotes(25)
    const transformed = latest.map(quote => ({
      id: quote.number,
      text: quote.text,
      quotee: quote.quotee.display_name,
      quoter: quote.quoter.display_name,
      year: quote.year,
      timestamp: quote.created_at
    }))
    return jsonResponse(transformed)
  },

  // GET /api/quotes/random
  async getRandomQuotes() {
    const random = await quoteService.getRandomQuotes(25)
    const transformed = random.map(quote => ({
      id: quote.number,
      text: quote.text,
      quotee: quote.quotee.display_name,
      quoter: quote.quoter.display_name,
      year: quote.year,
      timestamp: quote.created_at
    }))
    return jsonResponse(transformed)
  },

  // GET /api/quotes/search?q=...
  async searchQuotes(req: Request) {
    const url = new URL(req.url)
    const searchTerm = url.searchParams.get('q')

    if (!searchTerm || searchTerm.length < 3) {
      return errorResponse('Search term must be at least 3 characters', 400)
    }

    const { quotes } = await quoteService.searchQuotes(searchTerm, 20, false)
    const transformed = quotes.map(quote => ({
      id: quote.number,
      text: quote.text,
      quotee: quote.quotee.display_name,
      quoter: quote.quoter.display_name,
      year: quote.year,
      timestamp: quote.created_at
    }))
    return jsonResponse(transformed)
  },

  // GET /api/quotes/user/:name
  async getQuotesByUser(username: string) {
    if (!username || username.length < 2) {
      return errorResponse('Username must be at least 2 characters', 400)
    }

    const { quotes } = await quoteService.getQuotesByUser(username, 20, false)
    const transformed = quotes.map(quote => ({
      id: quote.number,
      text: quote.text,
      quotee: quote.quotee.display_name,
      quoter: quote.quoter.display_name,
      year: quote.year,
      timestamp: quote.created_at
    }))
    return jsonResponse(transformed)
  },

  // GET /api/quotes/:id
  async getQuoteById(id: number) {
    if (isNaN(id)) {
      return errorResponse('Invalid quote ID', 400)
    }

    const quote = await quoteService.getQuoteById(id)

    if (!quote) {
      return errorResponse('Quote not found', 404)
    }

    // Transform quote to match React app format
    const transformedQuote = {
      id: quote.number,
      text: quote.text,
      quotee: quote.quotee.display_name,
      quoter: quote.quoter.display_name,
      year: quote.year,
      timestamp: quote.created_at
    }

    return jsonResponse(transformedQuote)
  },

  // GET /api/users
  async getUsers() {
    const users = await quoteService.getAllUsers()
    return jsonResponse({ users })
  }
}

// Start standalone API server if this is the main entry point
if (import.meta.main) {
  const port = parseInt(Bun.env.API_PORT || '4000')

  console.log(`Starting API server on port ${port}...`)

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)
      const path = url.pathname

      // API Routes
      if (path === '/api/quotes') {
        return apiRoutes.getQuotes(req)
      }

      if (path === '/api/quotes/latest') {
        return apiRoutes.getLatestQuotes()
      }

      if (path === '/api/quotes/random') {
        return apiRoutes.getRandomQuotes()
      }

      if (path === '/api/quotes/search') {
        return apiRoutes.searchQuotes(req)
      }

      // Check if it's a user quotes request
      const userMatch = path.match(/^\/api\/quotes\/user\/(.+)$/)
      if (userMatch) {
        return apiRoutes.getQuotesByUser(decodeURIComponent(userMatch[1]))
      }

      // Check if it's a quote ID request
      const idMatch = path.match(/^\/api\/quotes\/(\d+)$/)
      if (idMatch) {
        return apiRoutes.getQuoteById(parseInt(idMatch[1]))
      }

      if (path === '/api/users') {
        return apiRoutes.getUsers()
      }

      return errorResponse('Not Found', 404)
    }
  })

  console.log(`API server running at http://localhost:${port}`)
}
