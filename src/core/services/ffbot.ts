import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
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

class FFBotService extends EventEmitter {
  private static instance: FFBotService;
  private metadataCache: FFBotMetadata | null = null;
  private hireCache: HireData | null = null;
  private lastRefresh: Date | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private watcher: any = null;
  
  private readonly FFBOT_PATH = '/usr/src/app/ffbot';
  private readonly METADATA_FILE = `${this.FFBOT_PATH}/playerdatabase.ini`;
  private readonly HIRE_FILE = `${this.FFBOT_PATH}/hire.ini`;
  private readonly REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
  
  private constructor() {
    super();
  }
  
  static getInstance(): FFBotService {
    if (!FFBotService.instance) {
      FFBotService.instance = new FFBotService();
    }
    return FFBotService.instance;
  }
  
  async initialize(): Promise<void> {
    console.log('[FFBot] Initializing FFBot service...');
    
    // Initial load
    await this.refresh();
    
    // Set up file watcher
    this.setupWatcher();
    
    // Set up periodic refresh as backup
    this.refreshTimer = setInterval(() => {
      this.refresh().catch(console.error);
    }, this.REFRESH_INTERVAL);
    
    console.log('[FFBot] Service initialized successfully');
  }
  
  private setupWatcher(): void {
    try {
      // Watch the directory for changes
      this.watcher = watch(this.FFBOT_PATH, { recursive: false }, async (eventType, filename) => {
        if (filename === 'playerdatabase.ini' || filename === 'hire.ini') {
          console.log(`[FFBot] File changed: ${filename}`);
          await this.refresh();
        }
      });
    } catch (error) {
      console.error('[FFBot] Failed to set up file watcher:', error);
    }
  }
  
  private async refresh(): Promise<void> {
    try {
      console.log('[FFBot] Refreshing FFBot data...');
      
      // Read metadata file
      const metadataContent = await readFile(this.METADATA_FILE, 'utf-8');
      const metadataParsed = parse(metadataContent);
      
      if (metadataParsed.metadata) {
        // Parse card_list from string representation
        const cardListStr = metadataParsed.metadata.card_list;
        let cardList: string[] = [];
        if (cardListStr) {
          try {
            // Remove brackets and quotes, then split
            cardList = cardListStr
              .replace(/[\[\]]/g, '')
              .split(',')
              .map((card: string) => card.trim().replace(/"/g, ''));
          } catch (e) {
            console.error('[FFBot] Failed to parse card_list:', e);
          }
        }
        
        this.metadataCache = {
          cycle: parseInt(metadataParsed.metadata.cycle) || 0,
          season: parseInt(metadataParsed.metadata.season) || 0,
          recordcycle: parseInt(metadataParsed.metadata.recordcycle) || 0,
          pity_loss: parseInt(metadataParsed.metadata.pity_loss) || 0,
          autologin: metadataParsed.metadata.autologin === 'true',
          autologinname: (metadataParsed.metadata.autologinname || '').replace(/"/g, ''),
          joinmode: metadataParsed.metadata.joinmode === 'true',
          expmulti: parseFloat(metadataParsed.metadata.expmulti) || 1.0,
          ragtimedisabled: metadataParsed.metadata.ragtimedisabled === 'true',
          leaderboard: metadataParsed.metadata.leaderboard === 'true',
          note: metadataParsed.metadata.note || '',
          perfomance: metadataParsed.metadata.perfomance === 'true',
          shorter: metadataParsed.metadata.shorter === 'true',
          joblist: metadataParsed.metadata.joblist === 'true',
          triple: metadataParsed.metadata.triple === 'true',
          card_list: cardList,
          rng: (metadataParsed.metadata.rng || '').replace(/"/g, ''),
        };
      }
      
      // Read hire file
      const hireContent = await readFile(this.HIRE_FILE, 'utf-8');
      this.hireCache = parse(hireContent) as HireData;
      
      this.lastRefresh = new Date();
      this.emit('refresh', { metadata: this.metadataCache, hire: this.hireCache });
      
      console.log('[FFBot] Data refreshed successfully');
    } catch (error) {
      console.error('[FFBot] Failed to refresh data:', error);
      // Don't clear cache on error - keep serving stale data
    }
  }
  
  getMetadata(): FFBotMetadata | null {
    return this.metadataCache;
  }
  
  getHireData(): HireData | null {
    return this.hireCache;
  }
  
  getPlayerHires(playerName: string): Record<string, boolean | number> | null {
    if (!this.hireCache) return null;
    
    // Case-insensitive lookup
    const key = Object.keys(this.hireCache).find(
      k => k.toLowerCase() === playerName.toLowerCase()
    );
    
    return key ? this.hireCache[key] : null;
  }
  
  getLastRefresh(): Date | null {
    return this.lastRefresh;
  }
  
  isAvailable(): boolean {
    return this.metadataCache !== null;
  }
  
  async forceRefresh(): Promise<void> {
    await this.refresh();
  }
  
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    this.removeAllListeners();
  }
}

export const ffbotService = FFBotService.getInstance();
export type { FFBotMetadata, HireData };