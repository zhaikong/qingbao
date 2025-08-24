import NodeCache from 'node-cache';
import { CacheManager } from './index';
import { CacheConfig, CacheResult, CacheStats } from './types';

/**
 * 基于 node-cache 的内存缓存管理器
 */
export class NodeCacheManager extends CacheManager {
  private cache: NodeCache;

  constructor(config: CacheConfig) {
    super(config);
    this.cache = new NodeCache({ 
      stdTTL: config.defaultTTL,
      checkperiod: 60,
      useClones: false
    });

    // 监听缓存事件更新统计信息
    this.cache.on('set', () => {
      this.stats.itemCount = this.cache.keys().length;
    });

    this.cache.on('del', () => {
      this.stats.itemCount = this.cache.keys().length;
    });

    this.cache.on('expired', () => {
      this.stats.itemCount = this.cache.keys().length;
    });
  }

  async get<T>(key: string): Promise<CacheResult<T>> {
    const data = this.cache.get<T>(key);
    const hit = data !== undefined;
    
    this.updateStats(hit);

    if (hit) {
      const ttl = this.cache.getTtl(key);
      const remainingTTL = ttl ? Math.max(0, Math.floor((ttl - Date.now()) / 1000)) : 0;
      
      return {
        hit: true,
        data,
        remainingTTL,
      };
    }

    return { hit: false };
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const actualTTL = ttl || this.config.defaultTTL;
    this.cache.set(key, data, actualTTL);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.del(key) > 0;
  }

  async clear(): Promise<void> {
    this.cache.flushAll();
    this.stats.itemCount = 0;
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      itemCount: this.cache.keys().length,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  // 保持向后兼容的方法
  del(key: string): void {
    this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }
}