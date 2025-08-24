/**
 * 缓存管理器
 * 
 * 提供统一的缓存接口，支持内存缓存和Redis缓存
 */

import { createHash } from 'crypto';
import NodeCache from 'node-cache';
import { CacheConfig, CacheStats, CacheResult } from './types';

/**
 * 缓存管理器基类
 */
export abstract class CacheManager {
  protected config: CacheConfig;
  protected stats: CacheStats;

  constructor(config: CacheConfig) {
    this.config = config;
    this.stats = {
      hits: 0,
      misses: 0,
      itemCount: 0,
      hitRate: 0,
    };
  }

  /**
   * 生成缓存键
   */
  protected generateKey(source: string, params: any): string {
    const keyData = `${source}:${JSON.stringify(params)}`;
    return createHash('sha256').update(keyData).digest('hex').substring(0, 16);
  }

  /**
   * 更新统计信息
   */
  protected updateStats(hit: boolean): void {
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // 抽象方法，由子类实现
  abstract get<T>(key: string): Promise<CacheResult<T>>;
  abstract set<T>(key: string, data: T, ttl?: number): Promise<void>;
  abstract delete(key: string): Promise<boolean>;
  abstract clear(): Promise<void>;
  abstract getStats(): CacheStats;
}

/**
 * 内存缓存实现
 */
export class MemoryCacheManager extends CacheManager {
  private cache: NodeCache;

  constructor(config: CacheConfig) {
    super(config);
    this.cache = new NodeCache({
      stdTTL: config.defaultTTL,
      checkperiod: 60, // 每60秒检查过期项
      useClones: false, // 提高性能
    });

    // 监听缓存事件
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
      memoryUsage: process.memoryUsage().heapUsed, // 近似值
    };
  }
}

/**
 * Redis缓存实现 (预留接口)
 */
export class RedisCacheManager extends CacheManager {
  // TODO: 实现Redis缓存
  // 需要安装 redis 依赖: npm install redis @types/redis
  
  async get<T>(key: string): Promise<CacheResult<T>> {
    // Redis实现
    throw new Error('Redis缓存暂未实现');
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // Redis实现
    throw new Error('Redis缓存暂未实现');
  }

  async delete(key: string): Promise<boolean> {
    // Redis实现
    throw new Error('Redis缓存暂未实现');
  }

  async clear(): Promise<void> {
    // Redis实现
    throw new Error('Redis缓存暂未实现');
  }

  getStats(): CacheStats {
    // Redis实现
    throw new Error('Redis缓存暂未实现');
  }
}

/**
 * 缓存工厂函数
 */
export function createCacheManager(config: CacheConfig): CacheManager {
  if (!config.enabled) {
    // 返回一个空的缓存管理器
    return new NullCacheManager(config);
  }

  switch (config.type) {
    case 'memory':
      return new MemoryCacheManager(config);
    case 'redis':
      return new RedisCacheManager(config);
    default:
      throw new Error(`不支持的缓存类型: ${config.type}`);
  }
}

/**
 * 空缓存管理器 (禁用缓存时使用)
 */
class NullCacheManager extends CacheManager {
  async get<T>(key: string): Promise<CacheResult<T>> {
    return { hit: false };
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // 不执行任何操作
  }

  async delete(key: string): Promise<boolean> {
    return false;
  }

  async clear(): Promise<void> {
    // 不执行任何操作
  }

  getStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      itemCount: 0,
    };
  }
}