// import discord.js
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { StaticAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';

// create a new Client instance
const discord = new Client({ intents: [GatewayIntentBits.Guilds] });

// listen for the client to be ready
discord.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// login with the token from .env.local
discord.login(process.env.DISCORD_TOKEN);

// twitch's turn
const authProvider = new StaticAuthProvider(
  process.env.TWITCH_CLIENT_ID!,
  process.env.TWITCH_ACCESS_TOKEN!
);

const chatClient = new ChatClient({ authProvider, channels: ['avalonstar'] });
chatClient.connect();

chatClient.say(
  'avalonstar',
  `I'm back bitches (don't test commands they don't work... yet)`
);
