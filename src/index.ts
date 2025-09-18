import { getQuoteCount, setupShutdownHandler } from '@core/db'
import { startBots } from '@bot/index'
import { init as webInit } from '@web/index'
import { ffbotService } from '@core/services/ffbot'

// Add graceful shutdown handling
setupShutdownHandler()

// Startup sequence for all services
const startup = async () => {
  try {
    // Log quote count
    const quoteCount = await getQuoteCount()
    console.log(`Loaded ${quoteCount} quotes...`)

    // Start Discord and Twitch bots
    await startBots()

    // Start web server if enabled
    const webEnabled = Bun.env.WEB_ENABLED === 'true'
    const webPort = parseInt(Bun.env.WEB_PORT || '3000')

    if (webEnabled) {
      await webInit(webPort)
    }

    // Initialize FFBot service
    // await ffbotService.initialize()

    console.log('All services initialized successfully')
  } catch (error) {
    console.error('Failed to initialize:', error)
    process.exit(1)
  }
}

// Only run startup if this is the main entry point
if (import.meta.main) {
  startup()
}

export { startup }
