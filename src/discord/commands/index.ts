import { Collection } from 'discord.js';
import * as quoteCommand from './quote';

// Create a collection of all commands
const commands = new Collection();

// Add commands to the collection
commands.set(quoteCommand.data.name, quoteCommand);

// Export the commands collection and individual commands
export { commands };
export { quoteCommand };