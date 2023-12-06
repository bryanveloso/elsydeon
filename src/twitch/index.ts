import { RefreshingAuthProvider, type RefreshingAuthProviderConfig, type TokenInfoData } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';

export const init = async () => {
  const tokenFile = './tokens.66977097.json'
  const tokenData = await Bun.file(tokenFile).json();

  const authProvider = new RefreshingAuthProvider({
    clientId: Bun.env.TWITCH_CLIENT_ID,
    clientSecret: Bun.env.TWITCH_CLIENT_SECRET,
  } as RefreshingAuthProviderConfig);

  authProvider.onRefresh(async (userId: string, newTokenData: TokenInfoData) => {
    await Bun.write(`./tokens.${userId}.json`, JSON.stringify(newTokenData, null, 2));
  })

  await authProvider.addUserForToken(tokenData, ['chat'])

  const channels = (Bun.env.TWITCH_CHANNELS as string).split(',') as string[];
  const chatClient = new ChatClient({ authProvider, channels });
  chatClient.connect();

  chatClient.onConnect(() => {
    console.log(`Connected to ${channels.length} channels: ${channels.join(', ')}`);
  })
}
