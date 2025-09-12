import type { TwitchCommand } from '../types'
import { ffbotService } from '@core/services/ffbot'

export const ffbot: TwitchCommand = {
  name: 'ffbot',
  description: 'Get FFBot game information',
  cooldown: 5000,
  execute: async (context) => {
    const metadata = ffbotService.getMetadata()
    
    if (!metadata) {
      context.say('FFBot data is not available at the moment.')
      return
    }
    
    const { cycle, season, autologinname, leaderboard, card_list } = metadata
    
    context.say(
      `🎮 FFBot - Season ${season}, Cycle ${cycle} | ` +
      `Player: ${autologinname} | ` +
      `Leaderboard: ${leaderboard ? 'Active' : 'Disabled'} | ` +
      `Cards: ${card_list.join(', ')}`
    )
  },
}

export const ffrefresh: TwitchCommand = {
  name: 'ffrefresh',
  description: 'Force refresh FFBot data (mod only)',
  cooldown: 10000,
  execute: async (context) => {
    // Check if user is mod or broadcaster
    if (!context.isMod && !context.isBroadcaster) {
      return
    }
    
    await ffbotService.forceRefresh()
    const lastRefresh = ffbotService.getLastRefresh()
    
    if (lastRefresh) {
      context.say(`✅ FFBot data refreshed at ${lastRefresh.toLocaleTimeString()}`)
    } else {
      context.say('❌ Failed to refresh FFBot data')
    }
  },
}