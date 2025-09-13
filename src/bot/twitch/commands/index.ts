import { BotCommand } from '@twurple/easy-bot'

// Import all commands
import { analyze } from './analyze'
import { ffbot, stats, ffrefresh } from './ffbot'
import { heykay, heymoral, heymyri } from './honors'
import { punt } from './punt'
import { quote } from './quote'
import { slap } from './slap'

// Export command registry
export const commands: BotCommand[] = [punt, slap, quote, analyze, ffbot, stats, ffrefresh, heykay, heymoral, heymyri]

// Export individual commands for direct use
export { punt, slap, quote, analyze, ffbot, stats, ffrefresh, heykay, heymoral, heymyri }
