import { count } from 'drizzle-orm';

import { db } from './db';
import * as schema from './db/schema';

import { init as discordInit } from './discord';
import { init as twitchInit } from './twitch';

const result = await db.select({ value: count() }).from(schema.quotes);
console.log(`Loaded ${result[0].value} quotes...`);

try {
  await discordInit();
  await twitchInit();
} catch (error: any) {
  console.error(error);
  process.exit(1);
}
