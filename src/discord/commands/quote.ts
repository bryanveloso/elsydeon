import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  CommandInteraction
} from 'discord.js';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export const data = new SlashCommandBuilder()
  .setName('quote')
  .setDescription('Quote management commands')
  .addSubcommand(subcommand =>
    subcommand
      .setName('random')
      .setDescription('Get a random quote')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('latest')
      .setDescription('Get the most recently added quote')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('get')
      .setDescription('Get a specific quote by ID')
      .addIntegerOption(option =>
        option.setName('id')
          .setDescription('The ID of the quote to get')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand => 
    subcommand
      .setName('add')
      .setDescription('Add a new quote')
      .addStringOption(option => 
        option.setName('text')
          .setDescription('The quote text')
          .setRequired(true)
      )
      .addStringOption(option => 
        option.setName('quotee')
          .setDescription('Who said the quote')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('search')
      .setDescription('Search for quotes containing text')
      .addStringOption(option =>
        option.setName('text')
          .setDescription('The text to search for')
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const subcommand = interaction.options.getSubcommand();
    
    // Handle different subcommands
    switch(subcommand) {
      case 'random':
        await handleRandomQuote(interaction);
        break;
      case 'latest':
        await handleLatestQuote(interaction);
        break;
      case 'get':
        await handleGetQuote(interaction);
        break;
      case 'add':
        await handleAddQuote(interaction);
        break;
      case 'search':
        await handleSearchQuote(interaction);
        break;
      default:
        await interaction.reply('Unknown subcommand');
    }
  } catch (error) {
    console.error('Error in Discord quote command:', error);
    await interaction.reply({ 
      content: 'An error occurred while processing the quote command.', 
      ephemeral: true 
    });
  }
}

async function handleRandomQuote(interaction: CommandInteraction) {
  // Defer the reply while we fetch data
  await interaction.deferReply();
  
  // Get random quote
  const result = await db.select().from(schema.quotes).orderBy(sql`RANDOM()`).limit(1);
  
  if (result.length === 0) {
    await interaction.editReply('No quotes found! Add some with `/quote add`');
    return;
  }
  
  const quote = result[0];
  
  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Quote #${quote.id}`)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter, inline: true }
    )
    .setFooter({ text: `Quote #${quote.id}` });
  
  await interaction.editReply({ embeds: [embed] });
}

async function handleLatestQuote(interaction: CommandInteraction) {
  await interaction.deferReply();
  
  // Get latest quote by using SQL query to sort by ID descending
  const result = await db.select().from(schema.quotes)
    .orderBy(sql`${schema.quotes.id} DESC`)
    .limit(1);
  
  if (result.length === 0) {
    await interaction.editReply('No quotes found! Add some with `/quote add`');
    return;
  }
  
  const quote = result[0];
  
  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Latest Quote #${quote.id}`)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter, inline: true }
    )
    .setFooter({ text: `Added on ${new Date(quote.timestamp).toLocaleDateString()}` });
  
  await interaction.editReply({ embeds: [embed] });
}

async function handleGetQuote(interaction: CommandInteraction) {
  await interaction.deferReply();
  
  // Get the quote ID from options
  const id = (interaction as ChatInputCommandInteraction).options.getInteger('id');
  
  // Fetch the quote
  const result = await db.select().from(schema.quotes)
    .where(sql`${schema.quotes.id} = ${id}`);
  
  if (result.length === 0) {
    await interaction.editReply(`Quote #${id} not found!`);
    return;
  }
  
  const quote = result[0];
  
  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Quote #${quote.id}`)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter, inline: true }
    )
    .setFooter({ text: `Quote #${quote.id}` });
  
  await interaction.editReply({ embeds: [embed] });
}

async function handleAddQuote(interaction: ChatInputCommandInteraction) {
  // Check permissions
  if (!interaction.memberPermissions?.has('ManageMessages')) {
    await interaction.reply({ 
      content: 'You need the Manage Messages permission to add quotes!', 
      ephemeral: true 
    });
    return;
  }
  
  await interaction.deferReply();
  
  // Get quote details
  const text = interaction.options.getString('text', true);
  const quotee = interaction.options.getString('quotee', true);
  const quoter = interaction.user.username;
  const year = new Date().getFullYear();
  const timestamp = new Date().toISOString();
  
  try {
    // Insert the quote into the database
    const result = await db.insert(schema.quotes).values({
      text,
      quotee,
      quoter,
      year,
      timestamp,
    }).returning({ id: schema.quotes.id });
    
    const quoteId = result[0].id;
    
    // Create a confirmation embed
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('Quote Added')
      .setDescription(`"${text}"`)
      .addFields(
        { name: 'Said by', value: quotee, inline: true },
        { name: 'Added by', value: quoter, inline: true },
        { name: 'ID', value: `#${quoteId}`, inline: true }
      );
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to add quote:', error);
    await interaction.editReply('Failed to add quote. Please try again later.');
  }
}

async function handleSearchQuote(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  
  // Get search text
  const searchText = interaction.options.getString('text', true);
  
  if (searchText.length < 3) {
    await interaction.editReply('Search term must be at least 3 characters long.');
    return;
  }
  
  // First, count total matches
  const countResult = await db.select({ 
    count: sql`COUNT(*)` 
  }).from(schema.quotes)
    .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`);
  
  const totalMatches = Number(countResult[0].count);
  
  if (totalMatches === 0) {
    await interaction.editReply(`No quotes found containing "${searchText}"`);
    return;
  }
  
  // Get a random matching quote (more interesting than always the first)
  const result = await db.select().from(schema.quotes)
    .where(sql`${schema.quotes.text} LIKE ${'%' + searchText + '%'}`)
    .orderBy(sql`RANDOM()`)
    .limit(1);
  
  const quote = result[0];
  
  // Create a nice embed for the quote
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(totalMatches === 1 ? `Quote #${quote.id}` : `Quote #${quote.id} (${totalMatches} matches)`)
    .setDescription(`"${quote.text}"`)
    .addFields(
      { name: 'Said by', value: quote.quotee, inline: true },
      { name: 'Year', value: `${quote.year}`, inline: true },
      { name: 'Added by', value: quote.quoter, inline: true }
    );
  
  // Add footer with match info if multiple matches
  if (totalMatches > 1) {
    embed.setFooter({ 
      text: `${totalMatches} quotes match "${searchText}". Try the search again for a different result.` 
    });
  } else {
    embed.setFooter({ text: `Quote #${quote.id}` });
  }
  
  await interaction.editReply({ embeds: [embed] });
}
