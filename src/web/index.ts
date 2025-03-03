import { Elysia } from 'elysia';
import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';

import { db } from '../db';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';

export const init = async (port: number = 3000) => {
  console.log(`Initializing web server on port ${port}...`);

  const app = new Elysia()
    .use(html())
    .use(staticPlugin({
      assets: 'src/web/public',
      prefix: '/public',
    }))
    // API Routes for quotes
    .group('/api', app => 
      app.group('/quotes', app => 
        app
          .get('/', async () => {
            const quotes = await db.select().from(schema.quotes).limit(20);
            return quotes;
          })
          .get('/latest', async () => {
            const latest = await db.select().from(schema.quotes)
              .orderBy(sql`${schema.quotes.id} DESC`)
              .limit(10);
            return latest;
          })
          .get('/random', async () => {
            const random = await db.select().from(schema.quotes)
              .orderBy(sql`RANDOM()`)
              .limit(10);
            return random;
          })
          .get('/search', async ({ query }) => {
            const searchTerm = query?.q as string;
            if (!searchTerm || searchTerm.length < 3) {
              return { error: 'Search term must be at least 3 characters' };
            }

            const quotes = await db.select().from(schema.quotes)
              .where(sql`${schema.quotes.text} LIKE ${'%' + searchTerm + '%'}`)
              .limit(20);

            return quotes;
          })
          .get('/:id', async ({ params }) => {
            const id = parseInt(params.id);
            if (isNaN(id)) {
              return { error: 'Invalid quote ID' };
            }

            const quote = await db.select().from(schema.quotes)
              .where(sql`${schema.quotes.id} = ${id}`);

            if (!quote.length) {
              return { error: 'Quote not found' };
            }

            return quote[0];
          })
      )
    )
    // Main app route - serves the React app
    .get('/*', () => {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Elsydeon Quote Manager</title>
          <link rel="stylesheet" href="/public/styles.css">
          <script src="/public/app.js" type="module" defer></script>
        </head>
        <body>
          <div id="root"></div>
        </body>
        </html>
      `;
    })
    .listen(port);

  console.log(`Web server running at http://localhost:${port}`);
  
  return app;
};