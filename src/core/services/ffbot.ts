import { watch } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { parse } from 'ini';
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
  luk: number;
  eva: number;
  preferedstat: string;
  gil: number;
  collection: number;
  lv: number;
  exp: number;
  unit: string;
  ascension: number;
  summon: string;
  artifact: string;
  spi: number;
  arti_hp: number;
  arti_atk: number;
  arti_mag: number;
  arti_spi: number;
  freehire: boolean;
  wins: number;
  freehirecount: number;
  season: number;
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
  card_active?: string;
}

class FFBotService extends EventEmitter {
  private static instance: FFBotService
  private metadataCache: FFBotMetadata | null = null
  private hireCache: HireData | null = null
  private playerCache: Map<string, PlayerStats> = new Map()
  private lastRefresh: Date | null = null
  private fileModifiedTime: Date | null = null
  private refreshTimer: NodeJS.Timer | null = null
  private watcher: any = null

  private readonly FFBOT_PATH = '/usr/src/app/ffbot'
  private readonly METADATA_FILE = `${this.FFBOT_PATH}/playerdatabase.ini`
  private readonly HIRE_FILE = `${this.FFBOT_PATH}/hire.ini`
  private readonly REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes

  private constructor() {
    super()
  }

  static getInstance(): FFBotService {
    if (!FFBotService.instance) {
      FFBotService.instance = new FFBotService()
    }
    return FFBotService.instance
  }

  async initialize(): Promise<void> {
    console.log('[FFBot] Initializing FFBot service...')

    // Initial load
    await this.refresh()

    // Set up file watcher
    this.setupWatcher()

    // Set up periodic refresh as backup
    this.refreshTimer = setInterval(() => {
      this.refresh().catch(console.error)
    }, this.REFRESH_INTERVAL)

    console.log('[FFBot] Service initialized successfully')
  }

  private setupWatcher(): void {
    try {
      // Watch the directory for changes
      this.watcher = watch(this.FFBOT_PATH, { recursive: false }, async (eventType, filename) => {
        // Ignore FUSE temporary files and other temporary files
        if (filename && (filename.startsWith('.fuse_hidden') || filename.startsWith('.'))) {
          return
        }

        if (filename === 'playerdatabase.ini' || filename === 'hire.ini') {
          console.log(`[FFBot] File changed: ${filename}`)
          await this.refresh()
        }
      })
    } catch (error) {
      console.error('[FFBot] Failed to set up file watcher:', error)
    }
  }

  private async refresh(): Promise<void> {
    try {
      console.log('[FFBot] Refreshing FFBot data...')

      // Read metadata/player file and get its modification time
      let metadataContent: string
      let fileStats: any

      try {
        ;[metadataContent, fileStats] = await Promise.all([
          readFile(this.METADATA_FILE, 'utf-8'),
          stat(this.METADATA_FILE)
        ])
      } catch (readError: any) {
        // File might be temporarily locked or being written
        if (readError.code === 'ENOENT' || readError.code === 'EBUSY') {
          console.log('[FFBot] File temporarily unavailable, will retry on next refresh')
          return
        }
        throw readError
      }

      this.fileModifiedTime = fileStats.mtime

      const metadataParsed = parse(metadataContent)

      // Clear and rebuild player cache
      this.playerCache.clear()

      // Parse all sections - metadata is one, the rest are players
      for (const [section, data] of Object.entries(metadataParsed)) {
        if (section === 'metadata') continue

        // This is a player section
        if (typeof data === 'object' && data !== null) {
          const playerData = data as any
          const stats: PlayerStats = {
            hp: parseInt(playerData.hp) || 0,
            atk: parseInt(playerData.atk) || 0,
            mag: parseInt(playerData.mag) || 0,
            luk: parseInt(playerData.luk) || 0,
            eva: parseInt(playerData.eva) || 0,
            preferedstat: (playerData.preferedstat || 'none').replace(/"/g, ''),
            gil: parseInt(playerData.gil) || 0,
            collection: parseInt(playerData.collection) || 0,
            lv: parseInt(playerData.lv) || 0,
            exp: parseInt(playerData.exp) || 0,
            unit: (playerData.unit || '').replace(/"/g, ''),
            ascension: parseInt(playerData.ascension) || 0,
            summon: (playerData.summon || 'no').replace(/"/g, ''),
            artifact: (playerData.artifact || '').replace(/"/g, ''),
            spi: parseInt(playerData.spi) || 0,
            arti_hp: parseInt(playerData.arti_hp) || 0,
            arti_atk: parseInt(playerData.arti_atk) || 0,
            arti_mag: parseInt(playerData.arti_mag) || 0,
            arti_spi: parseInt(playerData.arti_spi) || 0,
            freehire: Boolean(playerData.freehire),
            wins: parseInt(playerData.wins) || 0,
            freehirecount: parseInt(playerData.freehirecount) || 0,
            season: parseInt(playerData.season) || 0,
            esper: (playerData.esper || 'none').replace(/"/g, ''),
            jobap: parseInt(playerData.jobap) || 0,
            m1: (playerData.m1 || '').replace(/"/g, ''),
            m2: (playerData.m2 || '').replace(/"/g, ''),
            m3: (playerData.m3 || '').replace(/"/g, ''),
            m4: (playerData.m4 || '').replace(/"/g, ''),
            m5: (playerData.m5 || '').replace(/"/g, ''),
            m6: (playerData.m6 || '').replace(/"/g, ''),
            m7: (playerData.m7 || '').replace(/"/g, ''),
            job_atk: parseInt(playerData.job_atk) || 0,
            job_mag: parseInt(playerData.job_mag) || 0,
            job_spi: parseInt(playerData.job_spi) || 0,
            job_hp: parseInt(playerData.job_hp) || 0,
            card: playerData.card?.replace(/"/g, ''),
            card_collection: playerData.card_collection ? parseInt(playerData.card_collection) : undefined,
            card_passive: (playerData.card_passive || '').replace(/"/g, ''),
            card_active: (playerData.card_active || '').replace(/"/g, '')
          }

          // Store with lowercase key for case-insensitive lookup
          this.playerCache.set(section.toLowerCase(), stats)
        }
      }

      if (metadataParsed.metadata) {
        // Parse card_list from string representation
        const cardListStr = metadataParsed.metadata.card_list
        let cardList: string[] = []
        if (cardListStr) {
          try {
            // Remove brackets and quotes, then split
            cardList = cardListStr
              .replace(/[\[\]]/g, '')
              .split(',')
              .map((card: string) => card.trim().replace(/"/g, ''))
          } catch (e) {
            console.error('[FFBot] Failed to parse card_list:', e)
          }
        }

        this.metadataCache = {
          cycle: parseInt(metadataParsed.metadata.cycle) || 0,
          season: parseInt(metadataParsed.metadata.season) || 0,
          recordcycle: parseInt(metadataParsed.metadata.recordcycle) || 0,
          pity_loss: parseInt(metadataParsed.metadata.pity_loss) || 0,
          autologin: Boolean(metadataParsed.metadata.autologin),
          autologinname: (metadataParsed.metadata.autologinname || '').replace(/"/g, ''),
          joinmode: Boolean(metadataParsed.metadata.joinmode),
          expmulti: parseFloat(metadataParsed.metadata.expmulti) || 1.0,
          ragtimedisabled: Boolean(metadataParsed.metadata.ragtimedisabled),
          leaderboard: Boolean(metadataParsed.metadata.leaderboard),
          note: metadataParsed.metadata.note || '',
          perfomance: Boolean(metadataParsed.metadata.perfomance),
          shorter: Boolean(metadataParsed.metadata.shorter),
          joblist: Boolean(metadataParsed.metadata.joblist),
          triple: Boolean(metadataParsed.metadata.triple),
          card_list: cardList,
          rng: (metadataParsed.metadata.rng || '').replace(/"/g, '')
        }
      }

      // Read hire file
      const hireContent = await readFile(this.HIRE_FILE, 'utf-8')
      this.hireCache = parse(hireContent) as HireData

      this.lastRefresh = new Date()
      this.emit('refresh', { metadata: this.metadataCache, hire: this.hireCache })

      console.log('[FFBot] Data refreshed successfully')
    } catch (error) {
      console.error('[FFBot] Failed to refresh data:', error)
      // Don't clear cache on error - keep serving stale data
    }
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

  getPlayerStats(playerName: string): PlayerStats | null {
    // Case-insensitive lookup
    return this.playerCache.get(playerName.toLowerCase()) || null
  }

  getLastRefresh(): Date | null {
    return this.lastRefresh
  }

  getFileModifiedTime(): Date | null {
    return this.fileModifiedTime
  }

  isAvailable(): boolean {
    return this.metadataCache !== null
  }

  async forceRefresh(): Promise<void> {
    await this.refresh()
  }

  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }

    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }

    this.removeAllListeners()
  }
}

export const ffbotService = FFBotService.getInstance();
export type { FFBotMetadata, HireData, PlayerStats };
