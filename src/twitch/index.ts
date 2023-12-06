import {
  RefreshingAuthProvider,
  type RefreshingAuthProviderConfig,
  type TokenInfoData,
} from '@twurple/auth';
import { Bot, BotCommand, createBotCommand } from '@twurple/easy-bot';

import { punt } from './commands/punt';
import { slap } from './commands/slap';

const commands: BotCommand[] = [punt, slap];

export const init = async () => {
  const tokenFile = './tokens.66977097.json';
  const tokenData = await Bun.file(tokenFile).json();

  const authProvider = new RefreshingAuthProvider({
    clientId: Bun.env.TWITCH_CLIENT_ID,
    clientSecret: Bun.env.TWITCH_CLIENT_SECRET,
  } as RefreshingAuthProviderConfig);

  authProvider.onRefresh(
    async (userId: string, newTokenData: TokenInfoData) => {
      await Bun.write(
        `./tokens.${userId}.json`,
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

  bot.onConnect(() => {
    console.log(
      `Connected to ${channels.length} channels: ${channels.join(', ')}`
    );
  });
};
