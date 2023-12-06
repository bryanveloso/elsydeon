import { Client, Events, GatewayIntentBits } from 'discord.js';

export const init = async () => {
  // create a new Client instance
  const discord = new Client({ intents: [GatewayIntentBits.Guilds] });

  // listen for the client to be ready
  discord.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
  });

  // login with the token from .env.local
  discord.login(Bun.env.DISCORD_TOKEN);
}
