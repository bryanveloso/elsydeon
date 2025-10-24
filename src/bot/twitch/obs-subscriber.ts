import Redis from 'ioredis'
import type { Bot } from '@twurple/easy-bot'
import { redisService, type OBSEvent } from '@core/services/redis-service'

export class OBSSubscriber {
  private subscriber: Redis
  private bot: Bot
  private channel: string
  private lastWarningTime: number = 0
  private lastClearTime: number = 0
  private clearTimerId: Timer | null = null
  private pendingClearMessage: string | null = null
  private isInWarningState: boolean = false

  // Cooldowns in milliseconds
  private readonly WARNING_COOLDOWN = 2 * 60 * 1000 // 2 minutes
  private readonly CLEAR_DELAY = 60 * 1000 // 60 seconds of stability required

  constructor(bot: Bot) {
    const redisUrl = Bun.env.REDIS_URL || 'redis://host.docker.internal:6379'
    this.subscriber = new Redis(redisUrl)
    this.bot = bot
    this.channel = Bun.env.TWITCH_CHANNELS?.split(',')[0] || 'avalonstar'
  }

  async start() {
    // Subscribe to OBS events
    await this.subscriber.subscribe('events:obs')
    console.log('[OBS] Subscribed to Redis events:obs channel')

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'events:obs') {
        this.handleOBSMessage(message)
      }
    })

    this.subscriber.on('error', (error) => {
      console.error('[OBS] Redis subscriber error:', error)
    })
  }

  private handleOBSMessage(message: string) {
    const event = redisService.parseOBSMessage(message)
    if (!event) return

    const now = Date.now()

    if (event.event_type === 'obs.performance.warning') {
      // Cancel any pending clear message
      if (this.clearTimerId) {
        clearTimeout(this.clearTimerId)
        this.clearTimerId = null
        this.pendingClearMessage = null
        console.log('[OBS] Cancelled pending clear message due to new warning')
      }

      // Only send warning if cooldown has elapsed
      if (now - this.lastWarningTime >= this.WARNING_COOLDOWN) {
        const chatMessage = this.formatOBSEvent(event, this.isInWarningState)
        if (chatMessage) {
          this.bot.say(this.channel, chatMessage)
          this.lastWarningTime = now
          this.isInWarningState = true
        }
      } else {
        console.log('[OBS] Skipping warning (cooldown active)')
      }
    } else if (event.event_type === 'obs.performance.ok') {
      // Format the message but don't send it yet
      const chatMessage = this.formatOBSEvent(event)
      if (!chatMessage) return

      // Cancel existing timer if present
      if (this.clearTimerId) {
        clearTimeout(this.clearTimerId)
      }

      // Start a new timer to wait for stability
      this.pendingClearMessage = chatMessage
      this.clearTimerId = setTimeout(() => {
        const timeSinceLastClear = Date.now() - this.lastClearTime
        if (timeSinceLastClear >= this.WARNING_COOLDOWN) {
          if (this.pendingClearMessage) {
            this.bot.say(this.channel, this.pendingClearMessage)
            this.lastClearTime = Date.now()
            this.isInWarningState = false
            console.log('[OBS] Sent clear message after stability period')
          }
        } else {
          console.log('[OBS] Skipping clear message (cooldown active)')
        }
        this.clearTimerId = null
        this.pendingClearMessage = null
      }, this.CLEAR_DELAY)

      console.log(`[OBS] Waiting ${this.CLEAR_DELAY / 1000}s for performance stability`)
    }
  }

  private formatOBSEvent(event: OBSEvent, isRepeat: boolean = false): string | null {
    switch (event.event_type) {
      case 'obs.performance.warning':
        console.log(`[OBS] Performance warning: ${event.data.dropRate}% dropped frames`)
        if (isRepeat) {
          return `OBS is still dropping frames! It's not you I promise. Drop rate: ${event.data.dropRate}% avalonFINE`
        }
        return `OBS has started dropping frames! Drop rate: ${event.data.dropRate}% avalonFINE`

      case 'obs.performance.ok':
        console.log(`[OBS] Performance recovered: ${event.data.dropRate}% drop rate`)
        return `OBS looks to have stopped its shenanigans! avalonSHUCKS`

      default:
        return null
    }
  }

  async stop() {
    if (this.clearTimerId) {
      clearTimeout(this.clearTimerId)
      this.clearTimerId = null
    }
    await this.subscriber.quit()
    console.log('[OBS] Subscriber stopped')
  }
}
