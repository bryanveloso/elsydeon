import { createBotCommand } from '@twurple/easy-bot';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

// Command to handle quotes in different forms:
// !quote - get a random quote
// !quote add <text> - <quotee> - add a new quote
// !quote <id> - get specific quote by ID
// !quote search <text> - search for quotes containing text
// !quote latest - get the most recently added quote

export const quote = createBotCommand(
  'quote',
  async (params, { say, msg: { userInfo } }) => {
    try {
      // Handle different subcommands
      if (params.length === 0) {
        // !quote - Get random quote
        const result = await db
          .select()
          .from(schema.quotes)
          .orderBy(sql`RANDOM()`)
          .limit(1);

        if (result.length === 0) {
          say('There are no quotes! Uh, that’s a problem. avalonWHY');
          return;
        }

        const quote = result[0];
        say(
          `I found this quote: "${quote.text}" - ${quote.quotee} (#${quote.id}, ${quote.year})`
        );
      } else if (params[0] === 'latest') {
        // !quote latest - Get the most recently added quote
        const result = await db
          .select()
          .from(schema.quotes)
          .orderBy(sql`${schema.quotes.id} DESC`)
          .limit(1);

        if (result.length === 0) {
          say('There are no quotes! Uh, that’s a problem. avalonWHY');
          return;
        }

        const quote = result[0];
        say(
          `I found this quote: "${quote.text}" - ${quote.quotee} (#${quote.id}, ${quote.year})`
        );
      } else if (params[0] === 'add' && params.length > 1) {
        // !quote add <text> - <quotee> - Add new quote
        if (!userInfo.isBroadcaster && !userInfo.isMod) {
          say('Only mods and the broadcaster can add quotes!');
          return;
        }

        // Join all parameters except "add" and look for the delimiter
        const quoteText = params.slice(1).join(' ');
        const parts = quoteText.split(' - ');

        if (parts.length < 2) {
          say('Quotes must be in the format: !quote add <text> - <quotee>');
          return;
        }

        const text = parts[0].trim();
        const quotee = parts[1].trim();
        const quoter = userInfo.displayName;
        const year = new Date().getFullYear();
        const timestamp = new Date().toISOString();

        try {
          // Insert the quote into the database
          const result = await db
            .insert(schema.quotes)
            .values({
              text,
              quotee,
              quoter,
              year,
              timestamp,
            })
            .returning({ id: schema.quotes.id });

          say(
            `I've added the quote #${result[0].id} to the database. Blame yourself or God. avalonSMUG`
          );
        } catch (error) {
          console.error('Failed to add quote:', error);
          say('Failed to add quote. Please try again later? avalonANGY');
        }
      } else if (params[0] === 'search' && params.length > 1) {
        // !quote search <text> - Search for quotes
        const searchText = params.slice(1).join(' ').trim();

        if (searchText.length < 3) {
          say('Search term must be at least 3 characters long.');
          return;
        }

        const result = await db
          .select()
          .from(schema.quotes)
          .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`)
          .limit(1);

        if (result.length === 0) {
          say(`No quotes found containing "${searchText}"`);
          return;
        }

        const quote = result[0];
        say(
          `Quote #${quote.id}: "${quote.text}" - ${quote.quotee} (${quote.year})`
        );
      } else if (!isNaN(Number(params[0]))) {
        // !quote <id> - Get quote by ID
        const id = Number(params[0]);

        const result = await db
          .select()
          .from(schema.quotes)
          .where(sql`${schema.quotes.id} = ${id}`);

        if (result.length === 0) {
          say(`Quote #${id} not found!`);
          return;
        }

        const quote = result[0];
        say(
          `Quote #${quote.id}: "${quote.text}" - ${quote.quotee} (${quote.year})`
        );
      } else {
        // Unknown subcommand
        say(
          'Usage: !quote, !quote latest, !quote <id>, !quote add <text> - <quotee>, or !quote search <text>'
        );
      }
    } catch (error) {
      console.error('Error in quote command:', error);
      say('An error occurred while processing the quote command.');
    }
  }
);
