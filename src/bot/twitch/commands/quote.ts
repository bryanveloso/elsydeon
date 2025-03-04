import { createBotCommand } from '@twurple/easy-bot';
import { sql } from 'drizzle-orm';
import { db } from '@core/db';
import * as schema from '@core/schema';

// Command to handle quotes in different forms:
// !quote - get a random quote
// !quote add <text> - <quotee> - add a new quote
// !quote <id> - get specific quote by ID
// !quote search <text> - search for quotes containing text
// !quote latest - get the most recently added quote
// !quote user <username> - search for quotes said by a specific user
// !quote user me/my - search for quotes said by yourself

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
          `I found this quote: “${quote.text}” - ${quote.quotee} (#${quote.id}, ${quote.year})`
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
          `I found this quote: “${quote.text}” ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
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
        // !quote search <text> - Search for quotes with improved results
        const searchText = params.slice(1).join(' ').trim();

        if (searchText.length < 3) {
          say('Search term must be at least 3 characters long.');
          return;
        }

        // First, count the total matches
        const countResult = await db
          .select({
            count: sql`COUNT(*)`,
          })
          .from(schema.quotes)
          .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`);

        const totalMatches = Number(countResult[0].count);

        if (totalMatches === 0) {
          say(`No quotes found containing “${searchText}”`);
          return;
        }

        // Get a random match from the results (more interesting than always the first)
        const result = await db
          .select()
          .from(schema.quotes)
          .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`)
          .orderBy(sql`RANDOM()`)
          .limit(1);

        const quote = result[0];

        if (totalMatches === 1) {
          say(
            `I found this quote: “${quote.text}” ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
          );
        } else {
          say(
            `I found ${totalMatches} quotes with “${searchText}”. Here's one: “${quote.text}” ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
          );
        }
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
          `Quote #${quote.id}: “${quote.text}” - ${quote.quotee} (${quote.year})`
        );
      } else if (params[0] === 'user' && params.length > 1) {
        // !quote user <username> - Search for quotes said by a specific user
        const username = params.slice(1).join(' ').trim();

        if (username.length < 2) {
          say('Username must be at least 2 characters long.');
          return;
        }

        // Check if searching for themselves
        const isSelf = username.toLowerCase() === userInfo.displayName.toLowerCase() || 
                       username.toLowerCase() === userInfo.userName.toLowerCase() || 
                       username.toLowerCase() === 'me' || 
                       username.toLowerCase() === 'my';
        
        const searchName = isSelf ? userInfo.displayName : username;

        // Count matches for this user
        const countResult = await db
          .select({
            count: sql`COUNT(*)`,
          })
          .from(schema.quotes)
          .where(sql`${schema.quotes.quotee} LIKE ${'%' + searchName + '%'}`);

        const totalMatches = Number(countResult[0].count);

        if (totalMatches === 0) {
          say(`No quotes found from "${isSelf ? 'you' : searchName}"`);
          return;
        }

        // Get a random match from the results
        const result = await db
          .select()
          .from(schema.quotes)
          .where(sql`${schema.quotes.quotee} LIKE ${'%' + searchName + '%'}`)
          .orderBy(sql`RANDOM()`)
          .limit(1);

        const quote = result[0];

        if (totalMatches === 1) {
          if (isSelf) {
            say(
              `I found this quote from you: "${quote.text}" ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
            );
          } else {
            say(
              `I found this quote from ${searchName}: "${quote.text}" ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
            );
          }
        } else {
          if (isSelf) {
            say(
              `I found ${totalMatches} quotes from you. Here's one: "${quote.text}" ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
            );
          } else {
            say(
              `I found ${totalMatches} quotes from ${searchName}. Here's one: "${quote.text}" ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
            );
          }
        }
      } else {
        // Unknown subcommand
        say(
          'Usage: !quote, !quote latest, !quote <id>, !quote add <text> - <quotee>, !quote search <text>, or !quote user <username/me>'
        );
      }
    } catch (error) {
      console.error('Error in quote command:', error);
      say('An error occurred while processing the quote command.');
    }
  }
);
