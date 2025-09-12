import { createBotCommand } from '@twurple/easy-bot'
import { ffbotService } from '@core/services/ffbot'

export const ffbot = createBotCommand('ffbot', async (_, { say }) => {
  const metadata = ffbotService.getMetadata()
  
  if (!metadata) {
    say('FFBot data is not available at the moment.')
    return
  }
  
  const { cycle, season, autologinname, leaderboard, card_list } = metadata
  
  say(
    `🎮 FFBot - Season ${season}, Cycle ${cycle} | ` +
    `Player: ${autologinname} | ` +
    `Leaderboard: ${leaderboard ? 'Active' : 'Disabled'} | ` +
    `Cards: ${card_list.join(', ')}`
  )
})

export const ffrefresh = createBotCommand('ffrefresh', async (_, { msg: { userInfo }, say }) => {
  // Check if user is mod or broadcaster
  if (!userInfo.isMod && !userInfo.isBroadcaster) {
    return
  }
  
  await ffbotService.forceRefresh()
  const lastRefresh = ffbotService.getLastRefresh()
  
  if (lastRefresh) {
    say(`✅ FFBot data refreshed at ${lastRefresh.toLocaleTimeString()}`)
  } else {
    say('❌ Failed to refresh FFBot data')
  }
})