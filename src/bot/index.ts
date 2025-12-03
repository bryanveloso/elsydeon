import { setupShutdownHandler } from '@core/utils/shutdown'
import { quoteService } from '@core/services/quote'
import { log } from '@core/utils/logger'
import { init as discordInit } from './discord'
import { init as twitchInit } from './twitch'

// Add graceful shutdown handling
setupShutdownHandler()

// Startup sequence for bots only
const startBots = async () => {
  try {
    // Load quote count and log it
    const quoteCount = await quoteService.getQuoteCount()
    log.app.info(`Loaded ${quoteCount} quotes`)

    // Start Discord and Twitch bots
    await discordInit()
    await twitchInit()

    log.app.info('Bot services initialized successfully')
  } catch (error) {
    log.app.error('Failed to initialize bots:', error)
    process.exit(1)
  }
}

// Only start if this file is the main entry point
if (import.meta.main) {
  startBots()
}

export { startBots }
