import { db, setupShutdownHandler } from '@core/db';
import * as schema from '@core/schema';
import { sql } from 'drizzle-orm';

// Setup shutdown handler
setupShutdownHandler();

// API routes configuration
export const apiRoutes = {
  // GET /api/quotes
  async getQuotes(req: Request) {
    const quotes = await db.select().from(schema.quotes).limit(20);
    return Response.json(quotes);
  },
  
  // GET /api/quotes/latest
  async getLatestQuotes() {
    const latest = await db
      .select()
      .from(schema.quotes)
      .orderBy(sql`${schema.quotes.id} DESC`)
      .limit(25);
    return Response.json(latest);
  },
  
  // GET /api/quotes/random
  async getRandomQuotes() {
    const random = await db
      .select()
      .from(schema.quotes)
      .orderBy(sql`RANDOM()`)
      .limit(25);
    return Response.json(random);
  },
  
  // GET /api/quotes/search?q=...
  async searchQuotes(req: Request) {
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('q');
    
    if (!searchTerm || searchTerm.length < 3) {
      return Response.json(
        { error: 'Search term must be at least 3 characters' }, 
        { status: 400 }
      );
    }

    const quotes = await db.select().from(schema.quotes)
      .where(sql`${schema.quotes.text} LIKE ${'%' + searchTerm + '%'}`)
      .limit(20);

    return Response.json(quotes);
  },
  
  // GET /api/quotes/user/:name
  async getQuotesByUser(username: string) {
    if (!username || username.length < 2) {
      return Response.json(
        { error: 'Username must be at least 2 characters' },
        { status: 400 }
      );
    }

    const quotes = await db.select().from(schema.quotes)
      .where(sql`${schema.quotes.quotee} LIKE ${'%' + username + '%'}`)
      .limit(20);

    return Response.json(quotes);
  },
  
  // GET /api/quotes/:id
  async getQuoteById(id: number) {
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
};

// Start standalone API server if this is the main entry point
if (import.meta.main) {
  const port = parseInt(Bun.env.API_PORT || '4000');

  console.log(`Starting API server on port ${port}...`);

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      // API Routes
      if (path === '/api/quotes') {
        return apiRoutes.getQuotes(req);
      }

      if (path === '/api/quotes/latest') {
        return apiRoutes.getLatestQuotes();
      }

      if (path === '/api/quotes/random') {
        return apiRoutes.getRandomQuotes();
      }

      if (path === '/api/quotes/search') {
        return apiRoutes.searchQuotes(req);
      }

      // Check if it's a user quotes request
      const userMatch = path.match(/^\/api\/quotes\/user\/(.+)$/);
      if (userMatch) {
        return apiRoutes.getQuotesByUser(decodeURIComponent(userMatch[1]));
      }

      // Check if it's a quote ID request
      const idMatch = path.match(/^\/api\/quotes\/(\d+)$/);
      if (idMatch) {
        return apiRoutes.getQuoteById(parseInt(idMatch[1]));
      }

      return new Response('Not Found', { status: 404 });
    },
  });

  console.log(`API server running at http://localhost:${port}`);
}
