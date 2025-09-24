/**
 * Campaign service for fetching and managing campaign data from the Synthform API
 */

interface Milestone {
  id: string
  threshold: number
  title: string
  description: string
  is_unlocked: boolean
  unlocked_at: string | null
  image_url: string | null
}

interface Metric {
  id: string
  total_subs: number
  total_resubs: number
  total_bits: number
  total_donations: number
  timer_seconds_remaining: number | null
  timer_started_at: string | null
  timer_paused_at: string | null
  extra_data: Record<string, any>
  updated_at: string
}

interface Campaign {
  id: string
  name: string
  slug: string
  description: string
  start_date: string
  end_date: string | null
  is_active: boolean
  timer_mode: string
  timer_initial_seconds: number
  seconds_per_sub: number
  seconds_per_tier2: number
  seconds_per_tier3: number
  max_timer_seconds: number | null
  metric: Metric
  milestones: Milestone[]
}

class CampaignService {
  private baseUrl: string
  private cache: { data: Campaign | null; timestamp: number } | null = null
  private cacheTTL = 30000 // 30 seconds cache

  constructor() {
    // Get configuration from environment
    // Use host.docker.internal for Docker, or localhost for local dev
    const synthformUrl = Bun.env.SYNTHFORM_API_URL || 'http://host.docker.internal:7175/api'
    this.baseUrl = `${synthformUrl}/campaigns`
  }

  /**
   * Fetch the active campaign from the API
   */
  async fetchActiveCampaign(): Promise<Campaign | null> {
    // Check cache first
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTTL) {
      return this.cache.data
    }

    try {
      const url = `${this.baseUrl}/active`
      console.log('[Campaign] Fetching from:', url)

      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          console.log('[Campaign] No active campaign found')
          // No active campaign
          this.cache = { data: null, timestamp: Date.now() }
          return null
        }
        console.error(`[Campaign] HTTP error! status: ${response.status}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('[Campaign] Fetched campaign:', data.name)

      // Cache the response
      this.cache = { data, timestamp: Date.now() }

      return data as Campaign
    } catch (error) {
      console.error('[Campaign] Failed to fetch active campaign:', error)
      // Return cached data if available, even if expired
      if (this.cache?.data) {
        console.log('[Campaign] Returning stale cache due to error')
        return this.cache.data
      }
      return null
    }
  }

  /**
   * Get the active campaign (uses cache)
   */
  async getActiveCampaign(): Promise<Campaign | null> {
    return this.fetchActiveCampaign()
  }

  /**
   * Format timer seconds into readable format
   */
  formatTimer(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  /**
   * Get a formatted status message for the campaign
   */
  async getStatusMessage(): Promise<string> {
    const campaign = await this.getActiveCampaign()

    if (!campaign) {
      return 'No active campaign at the moment.'
    }

    const { name, metric, milestones } = campaign
    const { total_subs, total_resubs, total_bits, timer_seconds_remaining } = metric

    let message = `avalonHYPE ${name} | `

    // Add progress metrics
    message += `avalonLOVE Subs: ${total_subs.toLocaleString()} | `
    message += `avalonHUG Resubs: ${total_resubs.toLocaleString()} | `
    message += `avalonPOP Bits: ${total_bits.toLocaleString()} `

    // Add timer if running
    if (timer_seconds_remaining !== null && timer_seconds_remaining > 0) {
      message += `| avalonPAUSE Timer: ${this.formatTimer(timer_seconds_remaining)} `
    }

    // Add next milestone
    const nextMilestone = milestones.find((m) => !m.is_unlocked)
    if (nextMilestone) {
      message += `| avalonNOTE Next Goal: "${nextMilestone.title}" at ${nextMilestone.threshold}`
    }

    return message
  }

  /**
   * Get milestone progress message
   */
  async getMilestonesMessage(): Promise<string> {
    const campaign = await this.getActiveCampaign()

    if (!campaign) {
      return 'No active campaign at the moment.'
    }

    const { milestones } = campaign

    const unlocked = milestones.filter(m => m.is_unlocked)
    const locked = milestones.filter(m => !m.is_unlocked)

    let message = `🎯 Milestones - `
    message += `Unlocked: ${unlocked.length}/${milestones.length} | `

    if (locked.length > 0) {
      const next = locked[0]
      message += `Next: "${next.title}" at ${next.threshold} (${next.description})`
    } else {
      message += `All milestones unlocked! 🎉`
    }

    return message
  }

  /**
   * Get timer status message
   */
  async getTimerMessage(): Promise<string> {
    const campaign = await this.getActiveCampaign()

    if (!campaign) {
      return 'No active campaign at the moment.'
    }

    const { metric, timer_mode } = campaign
    const { timer_seconds_remaining, timer_started_at, timer_paused_at } = metric

    if (timer_mode === 'none') {
      return 'This campaign does not have a timer.'
    }

    if (timer_seconds_remaining === null || timer_seconds_remaining <= 0) {
      return '⏱️ Timer: Not started'
    }

    let status = timer_paused_at ? 'PAUSED' : 'RUNNING'
    let message = `⏱️ Subathon Timer: ${this.formatTimer(timer_seconds_remaining)} remaining (${status})`

    return message
  }

  /**
   * Start the campaign timer
   */
  async startTimer(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/timer/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Clear cache to force refresh
      this.cache = null

      if (result.error) {
        return { success: false, message: result.error }
      }

      return { success: true, message: 'Timer started successfully!' }
    } catch (error) {
      console.error('Failed to start timer:', error)
      return { success: false, message: 'Failed to start timer' }
    }
  }

  /**
   * Pause the campaign timer
   */
  async pauseTimer(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/timer/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Clear cache to force refresh
      this.cache = null

      if (result.error) {
        return { success: false, message: result.error }
      }

      return { success: true, message: 'Timer paused successfully!' }
    } catch (error) {
      console.error('Failed to pause timer:', error)
      return { success: false, message: 'Failed to pause timer' }
    }
  }
}

// Export singleton instance
export const campaignService = new CampaignService()
