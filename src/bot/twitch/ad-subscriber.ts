import Redis from 'ioredis'
import type { Bot } from '@twurple/easy-bot'
import { redisService, type AdEvent } from '@core/services/redis-service'

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
        console.log(`[Ads] Initial broadcaster status: ${this.broadcasterStatus}`)
      }
    } catch (error) {
      console.error('[Ads] Failed to get initial status from Redis:', error)
    }

    // Subscribe to ad notifications and status updates
    await this.subscriber.subscribe('bot:ads', 'events:status')
    console.log('[Ads] Subscribed to Redis bot:ads and events:status channels')

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'bot:ads') {
        this.handleAdMessage(message)
      } else if (channel === 'events:status') {
        this.handleStatusChange(message)
      }
    })

    this.subscriber.on('error', (error) => {
      console.error('[Ads] Redis subscriber error:', error)
    })
  }

  private handleStatusChange(message: string) {
    try {
      const data = JSON.parse(message)
      if (data.data && data.data.status) {
        this.broadcasterStatus = data.data.status
        console.log(`[Ads] Broadcaster status updated: ${this.broadcasterStatus}`)
      }
    } catch (error) {
      console.error('[Ads] Error parsing status message:', error)
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
        console.log(`[Ads] Warning: ${event.seconds}s until ad`)
        return `This is a message from the emergency ad break system. Incoming ad in ${event.seconds} seconds!`

      case 'countdown':
        // Only announce at specific intervals
        if (event.seconds === 30) {
          console.log(`[Ads] Countdown: ${event.seconds}s`)
          // return `⏰ 30 seconds until ad break!`
        } else if (event.seconds === 10) {
          console.log(`[Ads] Countdown: ${event.seconds}s`)
          // return `⏰ 10 seconds until ad break!`
        } else if (event.seconds === 5) {
          console.log(`[Ads] Countdown: ${event.seconds}s`)
          return `An ad break will be commencing in 5 seconds! avalonWHY`
        }
        return null

      case 'ad_started':
        console.log(`[Ads] Ad started: ${event.duration}s`)
        return `Running ${event.duration} seconds of ads now. We apologize for the interruption to your programming.`

      case 'ad_ended':
        console.log(`[Ads] Ad ended`)
        return `The ad block has completed. You may now return to your irregularly scheduled programming.`

      default:
        return null
    }
  }

  async stop() {
    await this.subscriber.quit()
    console.log('[Ads] Subscriber stopped')
  }
}
