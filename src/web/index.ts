import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { setupShutdownHandler } from '@core/utils/shutdown'
import { errorResponse, staticFileResponse } from '@core/utils/http'
import { log } from '@core/utils/logger'

// Setup shutdown handler
setupShutdownHandler()

// Get paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..', '..')
const distDir = join(projectRoot, 'dist')

// Define server initialization function
export const init = async (port: number = 3000) => {
  log.web.info(`Initializing on port ${port}...`)

  // Create server
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)
      const path = url.pathname

      // API Routes - Import and use the shared API routes
      if (path.startsWith('/api/quotes')) {
        try {
          const { apiRoutes } = await import('@api/index')

          // GET /api/quotes
          if (path === '/api/quotes') {
            return apiRoutes.getQuotes(req)
          }

          // GET /api/quotes/latest
          if (path === '/api/quotes/latest') {
            return apiRoutes.getLatestQuotes()
          }

          // GET /api/quotes/random
          if (path === '/api/quotes/random') {
            return apiRoutes.getRandomQuotes()
          }

          // GET /api/quotes/search?q=...
          if (path === '/api/quotes/search') {
            return apiRoutes.searchQuotes(req)
          }

          // GET /api/quotes/user/:name
          const userMatch = path.match(/^\/api\/quotes\/user\/(.+)$/)
          if (userMatch) {
            return apiRoutes.getQuotesByUser(decodeURIComponent(userMatch[1]))
          }

          // GET /api/quotes/:id
          const idMatch = path.match(/^\/api\/quotes\/(\d+)$/)
          if (idMatch) {
            return apiRoutes.getQuoteById(parseInt(idMatch[1]))
          }

          // If no route matched but path starts with /api/quotes
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error) {
          log.api.error('API error:', error)
          return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }

      // Serve static assets (JS, CSS)
      if (path.startsWith('/assets/')) {
        return await staticFileResponse(join(distDir, 'web'), path)
      }

      // Handle image paths - support both /images/ and /public/images/ paths
      if (path.startsWith('/images/') || path.startsWith('/public/images/')) {
        const imagePath = path.startsWith('/images/')
          ? path.substring(8) // Remove '/images/'
          : path.substring(14) // Remove '/public/images/'

        // Try production path first, then development path
        return await staticFileResponse(
          join(distDir, 'web', 'images'),
          imagePath,
          join(projectRoot, 'src', 'web', 'public', 'images')
        )
      }

      // For API routes that weren't handled above, return 404 silently (mostly bot scans)
      if (path.startsWith('/api/')) {
        return errorResponse('Not found', 404)
      }

      // For all other routes, serve the Vite-built index.html (SPA pattern)
      return await staticFileResponse(join(distDir, 'web'), 'index.html')
    }
  })

  log.web.info(`Running at http://localhost:${port}`)

  return server
}

// Main entry point for standalone web server
if (import.meta.main) {
  const port = parseInt(Bun.env.WEB_PORT || '3001')
  log.web.info(`Starting on port ${port}...`)
  init(port)
    .then(() => {
      log.web.info('Initialized successfully')
    })
    .catch((error) => {
      log.web.error('Failed to initialize:', error)
      process.exit(1)
    })
}
