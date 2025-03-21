import { Client, Events, GatewayIntentBits, REST, Routes, Collection } from 'discord.js'

import { commands } from './commands'

export const init = async () => {
  // Validate environment variables
  if (!Bun.env.DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN environment variable is required')
  }

  // Create a new Client instance with necessary intents
  const discord = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  })

  // Store commands for interaction handling
  // @ts-ignore - We've extended the Client type in discord.d.ts
  discord.commands = commands as Collection<string, any>

  // Register slash commands with Discord API
  const rest = new REST({ version: '10' }).setToken(Bun.env.DISCORD_TOKEN)
  // @ts-ignore - Commands are correctly typed but TypeScript is being cautious
  const commandsData = Array.from(commands.values()).map((command) => command.data.toJSON())

  // Set up event handlers
  discord.once(Events.ClientReady, async (client) => {
    console.log(`Discord: Ready! Logged in as ${client.user.tag}`)

    try {
      // Global commands for all guilds the bot is in
      if (client.application) {
        console.log('Started refreshing application (/) commands.')

        await rest.put(Routes.applicationCommands(client.application.id), { body: commandsData })

        console.log('Successfully reloaded application (/) commands.')
      }
    } catch (error) {
      console.error('Error registering slash commands:', error)
    }
  })

  // Handle slash command interactions
  discord.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return

    // @ts-ignore - We've extended the Client type in discord.d.ts
    const command = discord.commands.get(interaction.commandName)
    if (!command) return

    try {
      await command.execute(interaction)
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error)
      const content = 'There was an error executing this command!'
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true })
      } else {
        await interaction.reply({ content, ephemeral: true })
      }
    }
  })

  discord.on(Events.Error, (error) => {
    console.error('Discord connection error:', error)
  })

  // Return a promise that resolves when connected
  return new Promise((resolve, reject) => {
    // Set timeout to avoid hanging if connection fails
    const timeout = setTimeout(() => {
      reject(new Error('Discord connection timed out'))
    }, 30000)

    discord.once(Events.ClientReady, () => {
      clearTimeout(timeout)
      resolve(discord)
    })

    // Login with the token from environment
    discord.login(Bun.env.DISCORD_TOKEN).catch((err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}
