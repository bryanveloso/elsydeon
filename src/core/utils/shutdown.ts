/**
 * Graceful shutdown handler
 */
export const setupShutdownHandler = () => {
  const handleShutdown = () => {
    console.log('Shutting down gracefully...')
    process.exit(0)
  }

  process.on('SIGINT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
}
