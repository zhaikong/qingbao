/**
 * 缓存模块类型定义
 */

// 缓存配置接口
export interface CacheConfig {
  /** 缓存类型 */
  type: 'memory' | 'redis';
  
  /** 是否启用缓存 */
  enabled: boolean;
  
  /** 默认TTL (秒) */
  defaultTTL: number;
  
  /** 各数据源的TTL配置 */
  ttl: {
    webSearch: number;
    rss: number;
    newsApi: number;
    socialMedia: number;
  };
  
  /** Redis配置 (当type为redis时) */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

// 缓存项接口
export interface CacheItem<T = any> {
  /** 缓存的数据 */
  data: T;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 过期时间 */
  expiresAt: number;
  
  /** 缓存键 */
  key: string;
}

// 缓存统计信息
export interface CacheStats {
  /** 命中次数 */
  hits: number;
  
  /** 未命中次数 */
  misses: number;
  
  /** 命中率 */
  hitRate: number;
  
  /** 缓存项数量 */
  itemCount: number;
  
  /** 内存使用量 (字节) */
  memoryUsage?: number;
}

// 缓存操作结果
export interface CacheResult<T = any> {
  /** 是否命中缓存 */
  hit: boolean;
  
  /** 缓存的数据 (如果命中) */
  data?: T;
  
  /** 剩余TTL (秒) */
  remainingTTL?: number;
}