import { Collection } from 'discord.js'

import * as quoteCommand from './quote'
import * as reloadCommand from './reload'

// Create a collection of all commands
const commands = new Collection()

// Add commands to the collection
commands.set(quoteCommand.data.name, quoteCommand)
commands.set(reloadCommand.data.name, reloadCommand)

// Export the commands collection and individual commands
export { commands }
export { quoteCommand }
export { reloadCommand }
