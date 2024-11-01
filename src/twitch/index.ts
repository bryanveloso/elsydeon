import {
  RefreshingAuthProvider,
  type RefreshingAuthProviderConfig,
  type TokenInfoData,
} from '@twurple/auth';
import { Bot, BotCommand, createBotCommand } from '@twurple/easy-bot';

import { punt } from './commands/punt';
import { slap } from './commands/slap';

const commands: BotCommand[] = [punt, slap];

// I hate that I need to do this.
// But I also hate not having the proper scopes and 
// having to manually reauthenticate.
const appImpliedScopes: string[] = [
  'bits:read',
  'channel:edit:commercial',
  'channel:manage:broadcast',
  'channel:manage:polls',
  'channel:manage:predictions',
  'channel:manage:raids',
  'channel:manage:redemptions',
  'channel:manage:schedule',
  'channel:manage:videos',
  'channel:moderate',
  'channel:read:ads',
  'channel:read:charity',
  'channel:read:goals',
  'channel:read:hype_train',
  'channel:read:polls',
  'channel:read:predictions',
  'channel:read:redemptions',
  'channel:read:subscriptions',
  'channel:read:vips',
  'chat:edit',
  'chat:read',
  'clips:edit',
  'moderation:read',
  'moderator:manage:announcements',
  'moderator:manage:banned_users',
  'moderator:manage:chat_messages',
  'moderator:manage:chat_settings',
  'moderator:manage:shoutouts',
  'moderator:read:chat_settings',
  'moderator:read:chatters',
  'moderator:read:followers',
  'moderator:read:shoutouts',
  'user:bot',
  'user:edit',
  'user:read:chat',
];

export const init = async () => {
  const tokenFile = '../tokens.66977097.json';
  const tokenData = await Bun.file(tokenFile).json();

  const authProvider = new RefreshingAuthProvider({
    clientId: Bun.env.TWITCH_CLIENT_ID,
    clientSecret: Bun.env.TWITCH_CLIENT_SECRET,
    appImpliedScopes,
  } as RefreshingAuthProviderConfig);

  authProvider.onRefresh(
    async (userId: string, newTokenData: TokenInfoData) => {
      await Bun.write(
        `../tokens.${userId}.json`,
        JSON.stringify(newTokenData, null, 2)
      );
    }
  );

  await authProvider.addUserForToken(tokenData, ['chat']);

  const channels = (Bun.env.TWITCH_CHANNELS as string).split(',') as string[];

  // !commands lives here so we can grab the list of commands from the variable.
  const available = createBotCommand('commands', (_, { say }) => {
    const commandList = commands.map(command => `!${command.name}`).join(', ');
    say(`Look what I can do! avalonEUREKA -> [${commandList}]`);
  });
  commands.push(available);

  const bot = new Bot({ authProvider, channels, commands });
  await bot.api.requestScopesForUser(66977097, appImpliedScopes);

  bot.onConnect(() => {
    console.log(
      `Connected to ${channels.length} channels: ${channels.join(', ')}`
    );
  });
};
