import { createBotCommand } from '@twurple/easy-bot';
import { quoteService } from '@core/services/quote-service';

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
        const quote = await quoteService.getRandomQuote();

        if (!quote) {
          say('There are no quotes! Uh, that’s a problem. avalonWHY')
          return;
        }

        say(
          `I found this quote: “${quote.text}” - ${quote.quotee} (#${quote.id}, ${quote.year})`
        )
      } else if (params[0] === 'latest') {
        // !quote latest - Get the most recently added quote
        const quote = await quoteService.getLatestQuote();

        if (!quote) {
          say('There are no quotes! Uh, that’s a problem. avalonWHY');
          return;
        }

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

        try {
          // Insert the quote using the service
          const { id } = await quoteService.addQuote({
            text,
            quotee,
            quoter
          });

          say(
            `I've added the quote #${id} to the database. Blame yourself or God. avalonSMUG`
          )
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

        const { quotes, totalMatches } = await quoteService.searchQuotes(searchText, 1, true);

        if (totalMatches === 0) {
          say(`No quotes found containing “${searchText}”`)
          return;
        }

        const quote = quotes[0];

        if (totalMatches === 1) {
          say(
            `I found this quote: “${quote.text}” ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
          )
        } else {
          say(
            `I found ${totalMatches} quotes with “${searchText}”. Here's one: “${quote.text}” ~ ${quote.quotee} (#${quote.id}, ${quote.year})`
          )
        }
      } else if (!isNaN(Number(params[0]))) {
        // !quote <id> - Get quote by ID
        const id = Number(params[0]);
        const quote = await quoteService.getQuoteById(id);

        if (!quote) {
          say(`Quote #${id} not found!`);
          return;
        }

        say(
          `Quote #${quote.id}: “${quote.text}” - ${quote.quotee} (${quote.year})`
        )
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

        const { quotes, totalMatches } = await quoteService.getQuotesByUser(searchName, 1, true);

        if (totalMatches === 0) {
          say(`No quotes found from "${isSelf ? 'you' : searchName}"`);
          return;
        }

        const quote = quotes[0];

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
