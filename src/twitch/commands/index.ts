import { BotCommand } from '@twurple/easy-bot';

// Import all commands
import { punt } from './punt';
import { slap } from './slap';
import { quote } from './quote';

// Export command registry
export const commands: BotCommand[] = [
  punt,
  slap,
  quote,
];

// Export individual commands for direct use
export {
  punt,
  slap,
  quote,
};