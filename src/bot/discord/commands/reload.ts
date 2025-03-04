import {
  ChatInputCommandInteraction,
  SlashCommandBuilder
} from 'discord.js';

export const data = new SlashCommandBuilder().setName('reload').setDescription('Reloads a command').addStringOption(option =>
  option.setName('command').setDescription('The command to reload').setRequired(true)
);

export async function execute(interaction: ChatInputCommandInteraction) { 
  // Check if the user has the required permissions
  if (!interaction.memberPermissions?.has('Administrator')) {
    return interaction.reply({ 
      content: 'You need Administrator permission to reload commands!', 
      ephemeral: true 
    });
  }

  const commandName = interaction.options.getString('command', true);
  const command = interaction.client.commands.get(commandName);

  if (!command) {
    return interaction.reply({ content: `There is no command with name \`${commandName}\``, ephemeral: true });
  }

  try {
    // Bun doesn't use require.cache like Node.js, so we need a different approach
    // We'll use dynamic imports which can be refreshed in Bun
    const commandModule = await import(`./${commandName}.ts?update=${Date.now()}`);
    
    // Set the new command
    interaction.client.commands.set(commandModule.data.name, {
      data: commandModule.data,
      execute: commandModule.execute
    });
    
    return interaction.reply({ content: `Command \`${commandName}\` was reloaded!`, ephemeral: true });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return interaction.reply({ content: `There was an error while reloading a command \`${commandName}\`:\n\`${errorMessage}\``, ephemeral: true });
  }
}
