import { init as discordInit } from './src/discord';
import { init as twitchInit } from './src/twitch';

await discordInit();
await twitchInit();
