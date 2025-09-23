import { EventEmitter } from 'node:events';

interface FFBotMetadata {
  cycle: number;
  season: number;
  recordcycle: number;
  pity_loss: number;
  autologin: boolean;
  autologinname: string;
  joinmode: boolean;
  expmulti: number;
  ragtimedisabled: boolean;
  leaderboard: boolean;
  note: string;
  perfomance: boolean;
  shorter: boolean;
  joblist: boolean;
  triple: boolean;
  card_list: string[];
  rng: string;
}

interface HireData {
  [player: string]: Record<string, boolean | number>;
}

interface PlayerStats {
  hp: number;
  atk: number;
  mag: number;
  preferedstat: string;
  gil: number;
  collection: number;
  lv: number;
  exp: number;
  unit: string;
  ascension: number;
  artifact: string;
  spi: number;
  freehire: boolean;
  wins: number;
  freehirecount: number;
  esper: string;
  jobap: number;
  m1: string;
  m2: string;
  m3: string;
  m4: string;
  m5: string;
  m6: string;
  m7: string;
  job_atk: number;
  job_mag: number;
  job_spi: number;
  job_hp: number;
  card?: string;
  card_collection?: number;
  card_passive?: string;
}

class FFBotService extends EventEmitter {
  private static instance: FFBotService
  private metadataCache: FFBotMetadata | null = null
  private hireCache: HireData | null = null
  private playerCache: Map<string, { data: PlayerStats; timestamp: number }> = new Map()
  private lastRefresh: Date | null = null
  private baseUrl: string
  private cacheTTL = 60000 // 1 minute cache per player

  private constructor() {
    super()
    // Get configuration from environment
    const synthformUrl = Bun.env.SYNTHFORM_API_URL || 'http://localhost:7175/api'
    this.baseUrl = `${synthformUrl}/games/ffbot`
  }

  static getInstance(): FFBotService {
    if (!FFBotService.instance) {
      FFBotService.instance = new FFBotService()
    }
    return FFBotService.instance
  }

  async initialize(): Promise<void> {
    console.log('[FFBot] Service initialized with API mode')
    // API-based service doesn't need initialization
    // Data is fetched on-demand
  }

  getMetadata(): FFBotMetadata | null {
    return this.metadataCache
  }

  getHireData(): HireData | null {
    return this.hireCache
  }

  getPlayerHires(playerName: string): Record<string, boolean | number> | null {
    if (!this.hireCache) return null

    // Case-insensitive lookup
    const key = Object.keys(this.hireCache).find((k) => k.toLowerCase() === playerName.toLowerCase())

    return key ? this.hireCache[key] : null
  }

  async getPlayerStats(playerName: string): Promise<PlayerStats | null> {
    const cacheKey = playerName.toLowerCase()

    // Check cache first
    const cached = this.playerCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    try {
      // For now, this would need an endpoint to be created on the Synthform side
      // The endpoint would query the Player model from the database
      // Example: GET /api/games/ffbot/players/{username}
      const response = await fetch(`${this.baseUrl}/players/${encodeURIComponent(playerName)}`)

      if (!response.ok) {
        if (response.status === 404) {
          // Player not found
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Map the API response to our PlayerStats interface
      const stats: PlayerStats = {
        hp: result.data?.hp || 0,
        atk: result.data?.atk || 0,
        mag: result.data?.mag || 0,
        preferedstat: result.data?.preference || 'none',
        gil: result.data?.gil || 0,
        collection: result.data?.collection || 0,
        lv: result.data?.lv || 0,
        exp: result.data?.exp || 0,
        unit: result.data?.unit || '',
        ascension: result.data?.ascension || 0,
        artifact: result.data?.artifact || '',
        spi: result.data?.spi || 0,
        freehire: result.data?.freehire_available || false,
        wins: result.data?.wins || 0,
        freehirecount: result.data?.freehirecount || 0,
        esper: result.data?.esper || 'none',
        jobap: result.data?.job_level || 0,
        m1: result.data?.job || '',
        m2: result.data?.job_slots?.m2 || '',
        m3: result.data?.job_slots?.m3 || '',
        m4: result.data?.job_slots?.m4 || '',
        m5: result.data?.job_slots?.m5 || '',
        m6: result.data?.job_slots?.m6 || '',
        m7: result.data?.job_slots?.m7 || '',
        job_atk: result.data?.job_bonuses?.atk || 0,
        job_mag: result.data?.job_bonuses?.mag || 0,
        job_spi: result.data?.job_bonuses?.spi || 0,
        job_hp: result.data?.job_bonuses?.hp || 0,
        card: result.data?.card,
        card_passive: result.data?.card_passive || '',
      }

      // Cache the result
      this.playerCache.set(cacheKey, { data: stats, timestamp: Date.now() })

      return stats
    } catch (error) {
      console.error(`Failed to fetch FFBot stats for ${playerName}:`, error)

      // Return cached data if available, even if expired
      const cached = this.playerCache.get(cacheKey)
      if (cached) {
        return cached.data
      }

      return null
    }
  }

  getLastRefresh(): Date | null {
    return this.lastRefresh
  }

  getFileModifiedTime(): Date | null {
    // No longer using files, return null
    return null
  }

  isAvailable(): boolean {
    // Service is always available with API mode
    return true
  }

  async forceRefresh(): Promise<void> {
    // Clear cache to force fresh data on next request
    this.playerCache.clear()
  }

  destroy(): void {
    this.removeAllListeners()
  }
}

export const ffbotService = FFBotService.getInstance();
export type { FFBotMetadata, HireData, PlayerStats };
