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

export interface AdEndedEvent {
  type: 'ad_ended'
}

export type AdEvent = AdWarningEvent | AdCountdownEvent | AdStartedEvent | AdEndedEvent

export interface OBSPerformanceWarningEvent {
  event_type: 'obs.performance.warning'
  data: {
    isWarning: boolean
    dropRate: number
    renderDropRate: number
    outputDropRate: number
    congestion: number
    severity: 'minor' | 'moderate' | 'critical'
    issueType: 'rendering_lag' | 'network_congestion' | 'encoding_lag'
    message: string
    recommendation: string
  }
}

export interface OBSPerformanceOkEvent {
  event_type: 'obs.performance.ok'
  data: {
    isWarning: boolean
    dropRate: number
    message: string
  }
}

export type OBSEvent = OBSPerformanceWarningEvent | OBSPerformanceOkEvent

export class RedisService {
  private redisUrl: string

  constructor() {
    this.redisUrl = Bun.env.REDIS_URL || 'redis://host.docker.internal:6379'
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
      } else if (data.type === 'ad_ended') {
        return { type: 'ad_ended' }
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
      if (data.event_type === 'obs.performance.warning' && data.data && typeof data.data.dropRate === 'number') {
        return {
          event_type: 'obs.performance.warning',
          data: {
            isWarning: data.data.isWarning ?? true,
            dropRate: data.data.dropRate,
            renderDropRate: data.data.renderDropRate ?? 0,
            outputDropRate: data.data.outputDropRate ?? 0,
            congestion: data.data.congestion ?? 0,
            severity: data.data.severity ?? 'minor',
            issueType: data.data.issueType ?? 'encoding_lag',
            message: data.data.message ?? `OBS is dropping ${data.data.dropRate}% of frames`,
            recommendation: data.data.recommendation ?? 'Check OBS performance',
          },
        }
      } else if (data.event_type === 'obs.performance.ok' && data.data && typeof data.data.dropRate === 'number') {
        return {
          event_type: 'obs.performance.ok',
          data: {
            isWarning: data.data.isWarning ?? false,
            dropRate: data.data.dropRate,
            message: data.data.message ?? 'OBS performance recovered',
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
