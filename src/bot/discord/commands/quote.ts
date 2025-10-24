import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, CommandInteraction } from 'discord.js'
import { quoteService } from '@core/services/quote-service'

export const data = new SlashCommandBuilder()
  .setName('quote')
  .setDescription('Quote management commands')
  .addSubcommand((subcommand) => subcommand.setName('random').setDescription('Get a random quote'))
  .addSubcommand((subcommand) => subcommand.setName('latest').setDescription('Get the most recently added quote'))
  .addSubcommand((subcommand) =>
    subcommand
      .setName('get')
      .setDescription('Get a specific quote by ID')
      .addIntegerOption((option) => option.setName('id').setDescription('The ID of the quote to get').setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Add a new quote')
      .addStringOption((option) => option.setName('text').setDescription('The quote text').setRequired(true))
      .addStringOption((option) => option.setName('quotee').setDescription('Who said the quote').setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('search')
      .setDescription('Search for quotes containing text')
      .addStringOption((option) => option.setName('text').setDescription('The text to search for').setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('user')
      .setDescription('Search for quotes said by a specific user')
      .addStringOption((option) =>
        option.setName('name').setDescription('The name of the person who said the quote').setRequired(true)
      )
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const subcommand = interaction.options.getSubcommand()

    // Handle different subcommands
    switch (subcommand) {
      case 'random':
        await handleRandomQuote(interaction)
        break
      case 'latest':
        await handleLatestQuote(interaction)
        break
      case 'get':
        await handleGetQuote(interaction)
        break
      case 'add':
        await handleAddQuote(interaction)
        break
      case 'search':
        await handleSearchQuote(interaction)
        break
      case 'user':
        await handleUserQuote(interaction)
        break
      default:
        await interaction.reply('Unknown subcommand')
    }
  } catch (error) {
    console.error('Error in Discord quote command:', error)
    await interaction.reply({
      content: 'An error occurred while processing the quote command.',
      ephemeral: true
    })
  }
}

async function handleRandomQuote(interaction: CommandInteraction) {
  // Defer the reply while we fetch data
  await interaction.deferReply()

  // Get random quote
  const quote = await quoteService.getRandomQuote()

  if (!quote) {
    await interaction.editReply('No quotes found! Add some with `/quote add`')
    return
  }

  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`Quote #${quote.number}`)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee.display_name, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter.display_name, inline: true }
    )
    .setFooter({ text: `Quote #${quote.number}` })

  await interaction.editReply({ embeds: [embed] })
}

async function handleLatestQuote(interaction: CommandInteraction) {
  await interaction.deferReply()

  // Get latest quote
  const quote = await quoteService.getLatestQuote()

  if (!quote) {
    await interaction.editReply('No quotes found! Add some with `/quote add`')
    return
  }

  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`Latest Quote #${quote.number}`)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee.display_name, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter.display_name, inline: true }
    )
    .setFooter({ text: `Added on ${new Date(quote.created_at).toLocaleDateString()}` })

  await interaction.editReply({ embeds: [embed] })
}

async function handleGetQuote(interaction: CommandInteraction) {
  await interaction.deferReply()

  // Get the quote ID from options
  const id = (interaction as ChatInputCommandInteraction).options.getInteger('id')

  // Fetch the quote
  const quote = await quoteService.getQuoteById(id!)

  if (!quote) {
    await interaction.editReply(`Quote #${id} not found!`)
    return
  }

  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`Quote #${quote.number}`)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee.display_name, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter.display_name, inline: true }
    )
    .setFooter({ text: `Quote #${quote.number}` })

  await interaction.editReply({ embeds: [embed] })
}

async function handleAddQuote(interaction: ChatInputCommandInteraction) {
  // Check permissions
  if (!interaction.memberPermissions?.has('ManageMessages')) {
    await interaction.reply({
      content: 'You need the Manage Messages permission to add quotes!',
      ephemeral: true
    })
    return
  }

  await interaction.deferReply()

  // Get quote details
  const text = interaction.options.getString('text', true)
  const quotee = interaction.options.getString('quotee', true)
  const quoter = interaction.user.username

  try {
    // Insert the quote using the service
    const { id: quoteId } = await quoteService.addQuote({
      text,
      quotee,
      quoter
    })

    // Create a confirmation embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('Quote Added')
      .setDescription(`"${text}"`)
      .addFields(
        { name: 'Said by', value: quotee, inline: true },
        { name: 'Added by', value: quoter, inline: true },
        { name: 'ID', value: `#${quoteId}`, inline: true }
      )

    await interaction.editReply({ embeds: [embed] })
  } catch (error) {
    console.error('Failed to add quote:', error)
    await interaction.editReply('Failed to add quote. Please try again later.')
  }
}

async function handleSearchQuote(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  // Get search text
  const searchText = interaction.options.getString('text', true)

  if (searchText.length < 3) {
    await interaction.editReply('Search term must be at least 3 characters long.')
    return
  }

  const { quotes, totalMatches } = await quoteService.searchQuotes(searchText, 1, true)

  if (totalMatches === 0) {
    await interaction.editReply(`No quotes found containing "${searchText}"`)
    return
  }

  const quote = quotes[0]

  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(totalMatches === 1 ? `Quote #${quote.number}` : `Quote #${quote.number} (${totalMatches} matches)`)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee.display_name, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter.display_name, inline: true }
    )

  // Add footer with match info if multiple matches
  if (totalMatches > 1) {
    embed.setFooter({
      text: `${totalMatches} quotes match "${searchText}". Try the search again for a different result.`
    })
  } else {
    embed.setFooter({ text: `Quote #${quote.number}` })
  }

  await interaction.editReply({ embeds: [embed] })
}

async function handleUserQuote(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  // Get username
  const username = interaction.options.getString('name', true)

  if (username.length < 2) {
    await interaction.editReply('Username must be at least 2 characters long.')
    return
  }

  // Check if searching for themselves
  const isSelf =
    username.toLowerCase() === interaction.user.username.toLowerCase() ||
    username.toLowerCase() === interaction.user.globalName?.toLowerCase() ||
    username.toLowerCase() === 'me' ||
    username.toLowerCase() === 'my'

  const searchName = isSelf ? interaction.user.username : username

  const { quotes, totalMatches } = await quoteService.getQuotesByUser(searchName, 1, true)

  if (totalMatches === 0) {
    await interaction.editReply(isSelf ? 'No quotes found from you.' : `No quotes found from "${searchName}"`)
    return
  }

  const quote = quotes[0]

  // Build the title
  let title
  if (isSelf) {
    title = totalMatches === 1 ? `Your Quote #${quote.number}` : `Your Quote #${quote.number} (${totalMatches} matches)`
  } else {
    title =
      totalMatches === 1
        ? `Quote #${quote.number} from ${searchName}`
        : `Quote #${quote.number} from ${searchName} (${totalMatches} matches)`
  }

  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(title)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee.display_name, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter.display_name, inline: true }
    )

  // Add footer with match info if multiple matches
  if (totalMatches > 1) {
    const footerText = isSelf
      ? `${totalMatches} quotes from you. Try the command again for a different result.`
      : `${totalMatches} quotes from ${searchName}. Try the command again for a different result.`
    embed.setFooter({ text: footerText })
  } else {
    embed.setFooter({ text: `Quote #${quote.number}` })
  }

  await interaction.editReply({ embeds: [embed] })
}
