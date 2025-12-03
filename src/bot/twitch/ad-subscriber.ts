import Redis from 'ioredis'
import type { Bot } from '@twurple/easy-bot'
import { redisService, type AdEvent } from '@core/services/redis'
import { log } from '@core/utils/logger'

export class AdSubscriber {
  private subscriber: Redis
  private bot: Bot
  private channel: string
  private broadcasterStatus: string = 'offline'

  constructor(bot: Bot) {
    const redisUrl = Bun.env.REDIS_URL || 'redis://host.docker.internal:6379'
    this.subscriber = new Redis(redisUrl)
    this.bot = bot
    this.channel = Bun.env.TWITCH_CHANNELS?.split(',')[0] || 'avalonstar'
  }

  async start() {
    // Get initial status from Redis
    try {
      const initialStatus = await this.subscriber.get('broadcaster:status')
      if (initialStatus) {
        this.broadcasterStatus = initialStatus
        log.ads.info(`Initial broadcaster status: ${this.broadcasterStatus}`)
      }
    } catch (error) {
      log.ads.error('Failed to get initial status from Redis:', error)
    }

    // Subscribe to ad notifications and status updates
    await this.subscriber.subscribe('bot:ads', 'events:status')
    log.ads.info('Subscribed to Redis bot:ads and events:status channels')

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'bot:ads') {
        this.handleAdMessage(message)
      } else if (channel === 'events:status') {
        this.handleStatusChange(message)
      }
    })

    this.subscriber.on('error', (error) => {
      log.ads.error('Redis subscriber error:', error)
    })
  }

  private handleStatusChange(message: string) {
    try {
      const data = JSON.parse(message)
      if (data.data && data.data.status) {
        this.broadcasterStatus = data.data.status
        log.ads.info(`Broadcaster status updated: ${this.broadcasterStatus}`)
      }
    } catch (error) {
      log.ads.error('Error parsing status message:', error)
    }
  }

  private handleAdMessage(message: string) {
    if (this.broadcasterStatus !== 'online') {
      return
    }

    const event = redisService.parseAdMessage(message)
    if (!event) return

    const chatMessage = this.formatAdEvent(event)
    if (chatMessage) {
      this.bot.say(this.channel, chatMessage)
    }
  }

  private formatAdEvent(event: AdEvent): string | null {
    switch (event.type) {
      case 'warning_start':
        log.ads.info(`Warning: ${event.seconds}s until ad`)
        return `This is a message from the emergency ad break system. Incoming ad in ${event.seconds} seconds!`

      case 'countdown':
        // Only announce at specific intervals
        if (event.seconds === 30) {
          log.ads.debug(`Countdown: ${event.seconds}s`)
        } else if (event.seconds === 10) {
          log.ads.debug(`Countdown: ${event.seconds}s`)
        } else if (event.seconds === 5) {
          log.ads.info(`Countdown: ${event.seconds}s`)
          return `An ad break will be commencing in 5 seconds! avalonWHY`
        }
        return null

      case 'ad_started':
        log.ads.info(`Ad started: ${event.duration}s`)
        return `Running ${event.duration} seconds of ads now. We apologize for the interruption to your programming.`

      case 'ad_ended':
        log.ads.info('Ad ended')
        return `The ad block has completed. You may now return to your irregularly scheduled programming.`

      default:
        return null
    }
  }

  async stop() {
    await this.subscriber.quit()
    log.ads.info('Subscriber stopped')
  }
}
