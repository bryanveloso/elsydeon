/**
 * Redis service for subscribing to pub/sub channels
 */

export interface AdWarningEvent {
  type: 'warning_start'
  seconds: number
}

export interface AdCountdownEvent {
  type: 'countdown'
  seconds: number
}

export interface AdStartedEvent {
  type: 'ad_started'
  duration: number
}

export type AdEvent = AdWarningEvent | AdCountdownEvent | AdStartedEvent

export interface OBSPerformanceWarningEvent {
  event_type: 'obs.performance.warning'
  data: {
    isWarning: boolean
    dropRate: number
    skippedFrames: number
    totalFrames: number
  }
}

export interface OBSPerformanceOkEvent {
  event_type: 'obs.performance.ok'
  data: {
    isWarning: boolean
    dropRate: number
    skippedFrames: number
    totalFrames: number
  }
}

export type OBSEvent = OBSPerformanceWarningEvent | OBSPerformanceOkEvent

export class RedisService {
  private redisUrl: string

  constructor() {
    this.redisUrl = Bun.env.REDIS_URL || 'redis://localhost:6379'
  }

  /**
   * Parse ad message from Redis pub/sub
   */
  parseAdMessage(message: string): AdEvent | null {
    try {
      const data = JSON.parse(message)

      // Validate and return typed event
      if (data.type === 'warning_start' && typeof data.seconds === 'number') {
        return { type: 'warning_start', seconds: data.seconds }
      } else if (data.type === 'countdown' && typeof data.seconds === 'number') {
        return { type: 'countdown', seconds: data.seconds }
      } else if (data.type === 'ad_started' && typeof data.duration === 'number') {
        return { type: 'ad_started', duration: data.duration }
      }

      return null
    } catch (error) {
      console.error('[Redis] Error parsing ad message:', error)
      return null
    }
  }

  /**
   * Parse OBS message from Redis pub/sub
   */
  parseOBSMessage(message: string): OBSEvent | null {
    try {
      const data = JSON.parse(message)

      // Validate and return typed event
      if (
        (data.event_type === 'obs.performance.warning' || data.event_type === 'obs.performance.ok') &&
        data.data &&
        typeof data.data.isWarning === 'boolean' &&
        typeof data.data.dropRate === 'number' &&
        typeof data.data.skippedFrames === 'number' &&
        typeof data.data.totalFrames === 'number'
      ) {
        return {
          event_type: data.event_type,
          data: {
            isWarning: data.data.isWarning,
            dropRate: data.data.dropRate,
            skippedFrames: data.data.skippedFrames,
            totalFrames: data.data.totalFrames,
          },
        }
      }

      return null
    } catch (error) {
      console.error('[Redis] Error parsing OBS message:', error)
      return null
    }
  }
}

// Export singleton instance
export const redisService = new RedisService()
