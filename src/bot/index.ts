import { getQuoteCount, setupShutdownHandler } from '../core/db';
import { init as discordInit } from './discord';
import { init as twitchInit } from './twitch';

// Add graceful shutdown handling
setupShutdownHandler();

// Startup sequence for bots only
const startBots = async () => {
  try {
    // Load quote count and log it
    const quoteCount = await getQuoteCount();
    console.log(`Loaded ${quoteCount} quotes...`);
    
    // Start Discord and Twitch bots
    await discordInit();
    await twitchInit();
    
    console.log('Bot services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize bots:', error);
    process.exit(1);
  }
};

// Only start if this file is the main entry point
if (import.meta.main) {
  startBots();
}

export { startBots };