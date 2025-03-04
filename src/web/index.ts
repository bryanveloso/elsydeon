import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';

// Get paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');
const distDir = join(projectRoot, 'dist');

export const init = async (port: number = 3000) => {
  console.log(`Initializing web server on port ${port}...`);

  // Create server
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      // API Routes
      if (path.startsWith('/api/quotes')) {
        // GET /api/quotes
        if (path === '/api/quotes') {
          const quotes = await db.select().from(schema.quotes).limit(20);
          return Response.json(quotes);
        }
        
        // GET /api/quotes/latest
        if (path === '/api/quotes/latest') {
          const latest = await db.select().from(schema.quotes)
            .orderBy(sql`${schema.quotes.id} DESC`)
            .limit(10);
          return Response.json(latest);
        }
        
        // GET /api/quotes/random
        if (path === '/api/quotes/random') {
          const random = await db.select().from(schema.quotes)
            .orderBy(sql`RANDOM()`)
            .limit(10);
          return Response.json(random);
        }
        
        // GET /api/quotes/search?q=...
        if (path === '/api/quotes/search') {
          const searchTerm = url.searchParams.get('q');
          if (!searchTerm || searchTerm.length < 3) {
            return Response.json({ error: 'Search term must be at least 3 characters' }, { status: 400 });
          }

          const quotes = await db.select().from(schema.quotes)
            .where(sql`${schema.quotes.text} LIKE ${'%' + searchTerm + '%'}`)
            .limit(20);

          return Response.json(quotes);
        }
        
        // GET /api/quotes/:id
        const idMatch = path.match(/^\/api\/quotes\/(\d+)$/);
        if (idMatch) {
          const id = parseInt(idMatch[1]);
          if (isNaN(id)) {
            return Response.json({ error: 'Invalid quote ID' }, { status: 400 });
          }

          const quote = await db.select().from(schema.quotes)
            .where(sql`${schema.quotes.id} = ${id}`);

          if (!quote.length) {
            return Response.json({ error: 'Quote not found' }, { status: 404 });
          }

          return Response.json(quote[0]);
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