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
  private broadcasterStatus: string = 'offline'

  // Cooldowns in milliseconds
  private readonly WARNING_COOLDOWN = 2 * 60 * 1000 // 2 minutes
  private readonly CLEAR_DELAY = 5 * 60 * 1000 // 5 minutes of stability required

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
        console.log(`[OBS] Initial broadcaster status: ${this.broadcasterStatus}`)
      }
    } catch (error) {
      console.error('[OBS] Failed to get initial status from Redis:', error)
    }

    // Subscribe to OBS events and status updates
    await this.subscriber.subscribe('events:obs', 'events:status')
    console.log('[OBS] Subscribed to Redis events:obs and events:status channels')

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'events:obs') {
        this.handleOBSMessage(message)
      } else if (channel === 'events:status') {
        this.handleStatusChange(message)
      }
    })

    this.subscriber.on('error', (error) => {
      console.error('[OBS] Redis subscriber error:', error)
    })
  }

  private handleStatusChange(message: string) {
    try {
      const data = JSON.parse(message)
      if (data.data && data.data.status) {
        this.broadcasterStatus = data.data.status
        console.log(`[OBS] Broadcaster status updated: ${this.broadcasterStatus}`)
      }
    } catch (error) {
      console.error('[OBS] Error parsing status message:', error)
    }
  }

  private handleOBSMessage(message: string) {
    if (this.broadcasterStatus !== 'online') {
      return
    }

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
      case 'obs.performance.warning': {
        console.log(
          `[OBS] Performance warning: ${event.data.issueType} - ${event.data.dropRate}% dropped frames`
        )

        // Use severity to describe impact, not percentages
        const severityPrefix = {
          minor: 'Stream might be stuttering a bit',
          moderate: 'Stream is stuttering',
          critical: 'Stream is stuttering badly',
        }[event.data.severity] || 'Stream quality issue detected'

        // Customize message based on issue type
        const issueMessages = {
          network_congestion: isRepeat
            ? `Still having network issues! It's not you, I promise. avalonFINE`
            : `${severityPrefix} - network connection to Twitch is struggling. avalonFINE`,
          rendering_lag: isRepeat
            ? `Still having rendering issues! GPU can't keep up. avalonFINE`
            : `${severityPrefix} - OBS rendering can't keep up. avalonFINE`,
          encoding_lag: isRepeat
            ? `Still having encoding issues! avalonFINE`
            : `${severityPrefix} - encoder can't keep up. avalonFINE`,
        }

        return issueMessages[event.data.issueType] || event.data.message
      }

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
