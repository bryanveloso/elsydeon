import { RefreshingAuthProvider, type RefreshingAuthProviderConfig, type AccessToken } from '@twurple/auth'
import { Bot, BotCommand, createBotCommand } from '@twurple/easy-bot'

// Import commands from central registry
import { commands } from './commands'

// Keep existing scopes as requested
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
  'user:read:chat'
]

export const init = async () => {
  // Validate environment variables
  if (!Bun.env.TWITCH_CLIENT_ID || !Bun.env.TWITCH_CLIENT_SECRET || !Bun.env.TWITCH_CHANNELS) {
    throw new Error('Missing required Twitch environment variables')
  }

  // Use environment variable with fallback for user ID
  const userId = Bun.env.TWITCH_USER_ID || '66977097'
  const tokenFile = `./tokens.${userId}.json`

  try {
    // Read token data with error handling
    const tokenData = await Bun.file(tokenFile)
      .json()
      .catch(() => {
        throw new Error(`Could not read token file: ${tokenFile}`)
      })

    const authProvider = new RefreshingAuthProvider({
      clientId: Bun.env.TWITCH_CLIENT_ID,
      clientSecret: Bun.env.TWITCH_CLIENT_SECRET,
      appImpliedScopes
    } as RefreshingAuthProviderConfig)

    // Save refreshed tokens
    authProvider.onRefresh(async (userId: string, newTokenData: AccessToken) => {
      await Bun.write(`./tokens.${userId}.json`, JSON.stringify(newTokenData, null, 2)).catch((err) => {
        console.error(`Failed to save token: ${err.message}`)
      })
    })

    await authProvider.addUserForToken(tokenData, ['chat'])

    const channels = (Bun.env.TWITCH_CHANNELS as string).split(',') as string[]

    // Create a copy of the commands array to avoid modifying the original
    const botCommands = [...commands]

    // Add the !commands command to list available commands
    const available = createBotCommand('commands', (_, { say }) => {
      const commandList = botCommands.map((command) => `!${command.name}`).join(', ')
      say(`Look what I can do! avalonEUREKA -> [${commandList}]`)
    })
    botCommands.push(available)

    // Initialize bot with error handling
    const bot = new Bot({ authProvider, channels, commands: botCommands })

    try {
      await bot.api.requestScopesForUser(parseInt(userId), appImpliedScopes)
    } catch (error) {
      console.error('Failed to request scopes:', error)
      // Continue anyway since this might be optional
    }

    // Set up event handlers
    bot.onConnect(() => {
      console.log(`Twitch: Connected to ${channels.length} channels: ${channels.join(', ')}`)
      bot.say('avalonstar', `avalonEUREKA It appears that I have been rebooted.`)
    })

    bot.onDisconnect((graceful) => {
      console.log(`Twitch: Disconnected ${graceful ? 'gracefully' : 'unexpectedly'}`)
    })

    return bot
  } catch (error) {
    console.error('Twitch initialization error:', error)
    throw error
  }
}
