import { Client, Events, GatewayIntentBits } from 'discord.js';

export const init = async () => {
  // Validate environment variables
  if (!Bun.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN environment variable is required');
  }

  // Create a new Client instance
  const discord = new Client({ intents: [GatewayIntentBits.Guilds] });

  // Set up event handlers
  discord.once(Events.ClientReady, client => {
    console.log(`Discord: Ready! Logged in as ${client.user.tag}`);
  });

  discord.on(Events.Error, error => {
    console.error('Discord connection error:', error);
  });

  // Return a promise that resolves when connected
  return new Promise((resolve, reject) => {
    // Set timeout to avoid hanging if connection fails
    const timeout = setTimeout(() => {
      reject(new Error('Discord connection timed out'));
    }, 30000);

    discord.once(Events.ClientReady, () => {
      clearTimeout(timeout);
      resolve(discord);
    });
    
    // Login with the token from environment
    discord.login(Bun.env.DISCORD_TOKEN).catch(err => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};