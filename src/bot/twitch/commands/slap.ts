import { createBotCommand } from '@twurple/easy-bot'
import { log } from '@core/utils/logger'

export const slap = createBotCommand('slap', async (params, { msg: { userInfo }, action }) => {
  try {
    const target = params.join(' ').trim()
    if (target) {
      // Basic input validation to prevent abuse
      const safeTarget = target.length > 50 ? target.substring(0, 50) + '...' : target
      action(`slaps ${safeTarget} around a bit with a large trout. 🐟`)
    } else {
      action(`slaps ${userInfo.displayName} around a bit with a large trout. 🐟`)
    }
  } catch (error) {
    log.twitch.error('Error in slap command:', error)
    action('failed to execute the slap command properly!')
  }
})
