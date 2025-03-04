import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, setupShutdownHandler } from '@core/db';
import * as schema from '@core/schema';
import { sql } from 'drizzle-orm';

// Setup shutdown handler
setupShutdownHandler();

// Get paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');
const distDir = join(projectRoot, 'dist');

// Define server initialization function
export const init = async (port: number = 3000) => {
  console.log(`Initializing web server on port ${port}...`);

  // Create server
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      // API Routes - Import and use the shared API routes
      if (path.startsWith('/api/quotes')) {
        try {
          const { apiRoutes } = await import('@api/index');
          
          // GET /api/quotes
          if (path === '/api/quotes') {
            return apiRoutes.getQuotes(req);
          }
          
          // GET /api/quotes/latest
          if (path === '/api/quotes/latest') {
            return apiRoutes.getLatestQuotes();
          }
          
          // GET /api/quotes/random
          if (path === '/api/quotes/random') {
            return apiRoutes.getRandomQuotes();
          }
          
          // GET /api/quotes/search?q=...
          if (path === '/api/quotes/search') {
            return apiRoutes.searchQuotes(req);
          }
          
          // GET /api/quotes/user/:name
          const userMatch = path.match(/^\/api\/quotes\/user\/(.+)$/);
          if (userMatch) {
            return apiRoutes.getQuotesByUser(decodeURIComponent(userMatch[1]));
          }
          
          // GET /api/quotes/:id
          const idMatch = path.match(/^\/api\/quotes\/(\d+)$/);
          if (idMatch) {
            return apiRoutes.getQuoteById(parseInt(idMatch[1]));
          }
          
          // If no route matched but path starts with /api/quotes
          return new Response(JSON.stringify({ error: 'Not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('API error:', error);
          return new Response(JSON.stringify({ error: 'Internal server error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Serve assets from Vite build
      if (path.startsWith('/assets/')) {
        const file = Bun.file(join(distDir, 'web', path));
        const contentType = path.endsWith('.js') 
          ? 'application/javascript' 
          : path.endsWith('.css')
            ? 'text/css'
            : 'application/octet-stream';
        
        return new Response(file, {
          headers: { 'Content-Type': contentType }
        });
      }

      // For API routes that weren't handled above, return JSON error
      if (path.startsWith('/api/')) {
        console.log(`Unhandled API route: ${path}`);
        return new Response(JSON.stringify({ error: 'API endpoint not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // For all other routes, serve the Vite-built index.html (SPA pattern)
      return new Response(Bun.file(join(distDir, 'web', 'index.html')), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  });

  console.log(`Web server running at http://localhost:${port}`);
  
  return server;
};

// Main entry point for standalone web server
if (import.meta.main) {
  const port = parseInt(Bun.env.WEB_PORT || '3001');
  console.log(`Starting web server on port ${port}...`);
  init(port)
    .then(() => {
      console.log('Web server initialized successfully');
    })
    .catch(error => {
      console.error('Failed to initialize web server:', error);
      process.exit(1);
    });
}
