import { setupShutdownHandler } from '@core/db'
import { errorResponse, jsonResponse } from '@core/utils/http'
import { quoteService } from '@core/services/quote-service'

// Setup shutdown handler
setupShutdownHandler()

// API routes configuration
export const apiRoutes = {
  // GET /api/quotes
  async getQuotes(req: Request) {
    // This isn't in our QuoteService yet, so we'll call getLatestQuotes for now
    return this.getLatestQuotes()
  },

  // GET /api/quotes/latest
  async getLatestQuotes() {
    const latest = await quoteService.getLatestQuotes(25)
    return jsonResponse(latest)
  },

  // GET /api/quotes/random
  async getRandomQuotes() {
    const random = await quoteService.getRandomQuotes(25)
    return jsonResponse(random)
  },

  // GET /api/quotes/search?q=...
  async searchQuotes(req: Request) {
    const url = new URL(req.url)
    const searchTerm = url.searchParams.get('q')

    if (!searchTerm || searchTerm.length < 3) {
      return errorResponse('Search term must be at least 3 characters', 400)
    }

    const { quotes } = await quoteService.searchQuotes(searchTerm, 20, false)
    return jsonResponse(quotes)
  },

  // GET /api/quotes/user/:name
  async getQuotesByUser(username: string) {
    if (!username || username.length < 2) {
      return errorResponse('Username must be at least 2 characters', 400)
    }

    const { quotes } = await quoteService.getQuotesByUser(username, 20, false)
    return jsonResponse(quotes)
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

    return jsonResponse(quote)
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

      return errorResponse('Not Found', 404)
    }
  })

  console.log(`API server running at http://localhost:${port}`)
}
