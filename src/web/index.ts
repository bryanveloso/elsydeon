import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, setupShutdownHandler } from '../core/db';
import * as schema from '../core/schema';
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
        const { apiRoutes } = await import('../api');
        
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
        
        // GET /api/quotes/:id
        const idMatch = path.match(/^\/api\/quotes\/(\d+)$/);
        if (idMatch) {
          return apiRoutes.getQuoteById(parseInt(idMatch[1]));
        }
      }

      // Static files - JavaScript and CSS
      if (path === '/app.js' || path === '/styles.css') {
        const file = Bun.file(join(distDir, path.slice(1)));
        return new Response(file, {
          headers: { 
            'Content-Type': path.endsWith('.js') 
              ? 'application/javascript' 
              : 'text/css'
          }
        });
      }

      // For all other routes, serve index.html (SPA pattern)
      return new Response(Bun.file(join(distDir, 'index.html')), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  });

  console.log(`Web server running at http://localhost:${port}`);
  
  return server;
};

// Main entry point for standalone web server
if (import.meta.main) {
  const port = parseInt(Bun.env.WEB_PORT || '3000');
  console.log(`Starting web server on port ${port}...`);
  init(port).then(() => {
    console.log('Web server initialized successfully');
  }).catch(error => {
    console.error('Failed to initialize web server:', error);
    process.exit(1);
  });
}