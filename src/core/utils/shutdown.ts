/**
 * Graceful shutdown handler
 */
import { log } from '@core/utils/logger'

export const setupShutdownHandler = () => {
  const handleShutdown = () => {
    log.app.info('Shutting down gracefully...')
    process.exit(0)
  }

  process.on('SIGINT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
}
