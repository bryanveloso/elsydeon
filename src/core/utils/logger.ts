/**
 * Simple logger with timestamps and consistent prefixes.
 */

const formatTimestamp = (): string => {
  const now = new Date()
  return now.toISOString().replace('T', ' ').substring(0, 19)
}

class Logger {
  private prefix: string

  constructor(prefix: string) {
    this.prefix = prefix
  }

  info(message: string, ...args: unknown[]) {
    console.log(`${formatTimestamp()} [${this.prefix}] ${message}`, ...args)
  }

  warn(message: string, ...args: unknown[]) {
    console.warn(`${formatTimestamp()} [${this.prefix}] WARN ${message}`, ...args)
  }

  error(message: string, ...args: unknown[]) {
    console.error(`${formatTimestamp()} [${this.prefix}] ERROR ${message}`, ...args)
  }

  debug(message: string, ...args: unknown[]) {
    if (Bun.env.DEBUG === 'true') {
      console.log(`${formatTimestamp()} [${this.prefix}] DEBUG ${message}`, ...args)
    }
  }
}

export const createLogger = (prefix: string): Logger => new Logger(prefix)

// Pre-configured loggers
export const log = {
  twitch: createLogger('Twitch'),
  discord: createLogger('Discord'),
  api: createLogger('API'),
  web: createLogger('Web'),
  obs: createLogger('OBS'),
  ads: createLogger('Ads'),
  quotes: createLogger('Quotes'),
  campaign: createLogger('Campaign'),
  redis: createLogger('Redis'),
  ffbot: createLogger('FFBot'),
  lmstudio: createLogger('LMStudio'),
  app: createLogger('App'),
}
