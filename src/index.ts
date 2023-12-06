import { init as discordInit } from './discord';
import { init as twitchInit } from './twitch';

try {
  await discordInit();
  await twitchInit();
} catch (error: any) {
  process.exit(1);
}
