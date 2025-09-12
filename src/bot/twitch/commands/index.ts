import { BotCommand } from '@twurple/easy-bot'

// Import all commands
import { punt } from './punt'
import { slap } from './slap'
import { quote } from './quote'
import { analyze } from './analyze'
import { ffbot, stats, ffrefresh } from './ffbot'

// Export command registry
export const commands: BotCommand[] = [
  punt, 
  slap, 
  quote, 
  analyze, 
  ffbot,
  stats,
  ffrefresh
]

// Export individual commands for direct use
export { punt, slap, quote, analyze, ffbot, stats, ffrefresh }
