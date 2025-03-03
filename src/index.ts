import { count } from 'drizzle-orm';

import { db } from './db';
import * as schema from './db/schema';

import { init as discordInit } from './discord';
import { init as twitchInit } from './twitch';
import { init as webInit } from './web';

// Add graceful shutdown handling
const handleShutdown = () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Startup sequence
const startup = async () => {
  try {
    const result = await db.select({ value: count() }).from(schema.quotes);
    console.log(`Loaded ${result[0].value} quotes...`);
    
    // Start Discord and Twitch bots
    await discordInit();
    await twitchInit();
    
    // Start web server if enabled
    const webEnabled = Bun.env.WEB_ENABLED === 'true';
    const webPort = parseInt(Bun.env.WEB_PORT || '3000');
    
    if (webEnabled) {
      await webInit(webPort);
    }
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
};

startup();
