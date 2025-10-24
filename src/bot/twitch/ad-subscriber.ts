import Redis from 'ioredis'
import type { Bot } from '@twurple/easy-bot'
import { redisService, type AdEvent } from '@core/services/redis-service'

export class AdSubscriber {
  private subscriber: Redis
  private bot: Bot
  private channel: string

  constructor(bot: Bot) {
    const redisUrl = Bun.env.REDIS_URL || 'redis://host.docker.internal:6379'
    this.subscriber = new Redis(redisUrl)
    this.bot = bot
    this.channel = Bun.env.TWITCH_CHANNELS?.split(',')[0] || 'avalonstar'
  }

  async start() {
    // Subscribe to ad notifications
    await this.subscriber.subscribe('bot:ads')
    console.log('[Ads] Subscribed to Redis bot:ads channel')

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'bot:ads') {
        this.handleAdMessage(message)
      }
    })

    this.subscriber.on('error', (error) => {
      console.error('[Ads] Redis subscriber error:', error)
    })
  }

  private handleAdMessage(message: string) {
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
        return `This is a message from the emergency ad break system. Incoming ad in ${event.seconds} seconds! avalonEUREKA`

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
        // return `🎬 Running ${event.duration}s ad now. BRB! Take a stretch, hydrate, check the Discord!`

      default:
        return null
    }
  }

  async stop() {
    await this.subscriber.quit()
    console.log('[Ads] Subscriber stopped')
  }
}
