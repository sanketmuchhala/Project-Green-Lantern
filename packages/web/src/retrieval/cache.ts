import Dexie, { Table } from 'dexie';

export interface CacheEntry {
  id: string;
  url: string;
  summary: string;
  title?: string;
  host: string;
  cached_at: number;
  ttl_ms: number;
}

export class RetrievalCache extends Dexie {
  cache!: Table<CacheEntry>;

  constructor() {
    super('RetrievalCache');
    
    this.version(1).stores({
      cache: 'id, url, host, cached_at'
    });
  }
}

export const cache = new RetrievalCache();

export async function getCached(url: string): Promise<CacheEntry | null> {
  try {
    const entry = await cache.cache.get(url);
    if (!entry) return null;
    
    // Check if entry has expired
    const now = Date.now();
    if (now > entry.cached_at + entry.ttl_ms) {
      // Entry expired, remove it
      await cache.cache.delete(url);
      return null;
    }
    
    return entry;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

export async function setCached(
  url: string, 
  summary: string, 
  title?: string, 
  ttlMs: number = 3600000 // 1 hour default
): Promise<void> {
  try {
    const host = (url.match(/^https?:\/\/([^/]+)/)?.[1] || "");
    const entry: CacheEntry = {
      id: url,
      url,
      summary,
      title,
      host,
      cached_at: Date.now(),
      ttl_ms: ttlMs
    };
    
    await cache.cache.put(entry);
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

export async function cleanExpired(): Promise<number> {
  try {
    const now = Date.now();
    const allEntries = await cache.cache.toArray();
    const expired = allEntries.filter(entry => now > entry.cached_at + entry.ttl_ms);
    
    if (expired.length > 0) {
      await cache.cache.bulkDelete(expired.map(e => e.id));
    }
    
    return expired.length;
  } catch (error) {
    console.warn('Cache cleanup error:', error);
    return 0;
  }
}

export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  try {
    const entries = await cache.cache.toArray();
    // const now = Date.now();
    
    let totalSize = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    
    for (const entry of entries) {
      totalSize += entry.summary.length + (entry.title?.length || 0) + entry.url.length;
      
      if (oldestEntry === null || entry.cached_at < oldestEntry) {
        oldestEntry = entry.cached_at;
      }
      if (newestEntry === null || entry.cached_at > newestEntry) {
        newestEntry = entry.cached_at;
      }
    }
    
    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry,
      newestEntry
    };
  } catch (error) {
    console.warn('Cache stats error:', error);
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null
    };
  }
}

// Initialize cache cleanup on first use
let cleanupInitialized = false;

export async function initializeCache(): Promise<void> {
  if (cleanupInitialized) return;
  
  try {
    await cache.open();
    
    // Run initial cleanup
    await cleanExpired();
    
    // Set up periodic cleanup every 15 minutes
    setInterval(async () => {
      const cleaned = await cleanExpired();
      if (cleaned > 0) {
        console.log(`Cleaned ${cleaned} expired cache entries`);
      }
    }, 15 * 60 * 1000);
    
    cleanupInitialized = true;
  } catch (error) {
    console.error('Cache initialization failed:', error);
  }
}