/**
 * 数据源管理器
 * 
 * 统一管理各种数据源：网络搜索、RSS订阅等
 */

import { DataSourceConfig, DataSourceResult, IntelligenceItem } from './types';
import { WebSearchModule } from './web-search';
import { FeedsModule } from './feeds';
import { CacheManager } from './cache';
import { CacheResult } from './cache/types';
import { buildWebSearchConfig, buildFeedsConfig, YamlConfig } from './config-adapter';
import { performanceMonitor } from '../performance-monitor';

export interface DataSourceManagerOptions {
  config: DataSourceConfig;
  cacheManager: CacheManager;
  yamlConfig?: YamlConfig; // 添加 YAML 配置选项
}

export class DataSourceManager {
  private config: DataSourceConfig;
  private cacheManager: CacheManager;
  private webSearchModule: WebSearchModule;
  private feedsModule: FeedsModule | null = null;
  private yamlConfig?: YamlConfig;

  constructor(options: DataSourceManagerOptions) {
    this.config = options.config;
    this.cacheManager = options.cacheManager;
    this.yamlConfig = options.yamlConfig;

    // 初始化网络搜索模块 - 使用配置适配器
    const searchConfig = this.yamlConfig 
      ? buildWebSearchConfig(this.yamlConfig)
      : this.buildLegacyWebSearchConfig();
    
    this.webSearchModule = new WebSearchModule({
      config: searchConfig,
      cacheManager: this.cacheManager
    });

    // 初始化RSS订阅模块 - 使用配置适配器
    if (this.yamlConfig) {
      const feedsConfig = buildFeedsConfig(this.yamlConfig);
      if (feedsConfig) {
        this.feedsModule = new FeedsModule({
          config: feedsConfig,
          cacheManager: this.cacheManager
        });
      }
    } else if (this.config.feeds && this.config.feeds.sources && this.config.feeds.sources.length > 0) {
      // 兼容旧配置格式
      const feedsConfig = {
        sources: this.config.feeds.sources.map(sourceId => ({
          id: sourceId,
          name: sourceId,
          type: 'rss' as const,
          url: '',
          enabled: true,
          category: 'general',
          reliability: 'high' as const
        })),
        refreshInterval: 300000, // 5分钟
        cacheTtl: 600, // 10分钟
        maxItemsPerSource: 50,
        timeout: 30000 // 30秒
      };
      
      this.feedsModule = new FeedsModule({
        config: feedsConfig,
        cacheManager: this.cacheManager
      });
    }
  }

  /**
   * 构建旧版 WebSearchConfig（向后兼容）
   */
  private buildLegacyWebSearchConfig() {
    return this.config.search ? {
      engines: this.config.search.engines.filter(engine => 
        ['zhipu', 'duckduckgo', 'searxng'].includes(engine)
      ) as ('zhipu' | 'duckduckgo' | 'searxng')[],
      maxResults: this.config.search.maxResults || 20,
      timeout: 30000,
      cacheConfig: {
        ttl: 3600
      },
      zhipu: {
        enabled: this.config.search.engines.includes('zhipu'),
        apiKey: process.env.ZHIPU_API_KEY
      },
      duckduckgo: {
        enabled: this.config.search.engines.includes('duckduckgo')
      },
      searxng: {
        enabled: this.config.search.engines.includes('searxng')
      }
    } : {
      engines: ['zhipu' as const],
      maxResults: 20,
      timeout: 30000,
      cacheConfig: {
        ttl: 3600
      },
      zhipu: {
        enabled: true,
        apiKey: process.env.ZHIPU_API_KEY
      },
      duckduckgo: {
        enabled: false
      },
      searxng: {
        enabled: false
      }
    };
  }

  /**
   * 统一搜索接口
   */
  async search(query: string, options: {
    sources?: string[];
    limit?: number;
    useCache?: boolean;
  } = {}): Promise<DataSourceResult> {
    const { sources = ['web', 'feeds'], limit = 20, useCache = true } = options;
    
    console.log(`[DataSourceManager] 开始搜索: ${query}`);
    console.log(`[DataSourceManager] 使用数据源: ${sources.join(', ')}`);

    // 开始性能监控
    performanceMonitor.start(`search-${query}`);
    
    const startTime = Date.now();
    const results: IntelligenceItem[] = [];
    const sourceResults: Record<string, any> = {};

    // 生成缓存键
    const cacheKey = this.generateCacheKey(query, options);
    
    // 尝试从缓存获取
    if (useCache) {
      const cached: CacheResult<DataSourceResult> = await this.cacheManager.get<DataSourceResult>(cacheKey);
      if (cached.hit && cached.data) {
        console.log(`[DataSourceManager] 缓存命中: ${query}`);
        return cached.data;
      }
    }

    // 网络搜索 - 使用新的DataCollectionService
    if (sources.includes('web')) {
      try {
        console.log('[DataSourceManager] Executing search with new DataCollectionService...');
        
        // 导入新的数据采集服务
        const DataCollectionService = (await import('../../core/services/DataCollectionService.ts')).default;
        
        // 使用新的数据采集服务
        const availableSources = await DataCollectionService.getAvailableSources();
        const webResults = await DataCollectionService.collectData(query, availableSources);
        
        // 转换为标准格式
        const convertedResults = webResults.map(result => ({
          id: `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: result.title,
          content: result.content || result.snippet,
          url: result.url,
          publishedAt: result.publishDate || new Date().toISOString(),
          author: result.source,
          category: 'web-search',
          tags: [],
          source: {
            id: result.source, // 使用动态的、真实的来源ID
            name: result.source,
            type: 'api' as const
          },
          metadata: {
            relevanceScore: result.relevanceScore,
            searchQuery: query
          }
        }));
        
        results.push(...convertedResults);
        sourceResults.web = {
          count: convertedResults.length,
          sources: webResults.map(r => r.source).join(', ')
        };
        
        console.log(`[DataSourceManager] 真实数据源搜索成功，获得 ${convertedResults.length} 条结果`);
        
      } catch (error) {
        console.error('[DataSourceManager] 真实数据源搜索失败:', error);
        sourceResults.web = {
          count: 0,
          error: error instanceof Error ? error.message : '未知错误'
        };
      }
    }

    // RSS订阅搜索
    if (sources.includes('feeds') && this.feedsModule) {
      try {
        console.log('[DataSourceManager] 执行RSS订阅搜索...');
        const feedResults = await this.feedsModule.getLatestItems(query, {
          limit: Math.ceil(limit / sources.length)
        });
        
        if (feedResults && Array.isArray(feedResults)) {
          results.push(...feedResults);
          sourceResults.feeds = {
            count: feedResults.length
          };
        }
      } catch (error) {
        console.error('[DataSourceManager] RSS订阅搜索失败:', error);
        sourceResults.feeds = {
          count: 0,
          error: error instanceof Error ? error.message : '未知错误'
        };
      }
    }

    // 处理结果
    const processedResults = this.processResults(results, limit);
    const endTime = Date.now();

    const result: DataSourceResult = {
      items: processedResults,
      total: processedResults.length,
      sources: sourceResults,
      timing: {
        total: endTime - startTime,
        fetch: endTime - startTime,
        process: 0
      }
    };

    // 缓存结果
    if (useCache && processedResults.length > 0) {
      await this.cacheManager.set(cacheKey, result, 300); // 5分钟缓存
    }

    console.log(`[DataSourceManager] 搜索完成，返回 ${processedResults.length} 条结果`);
    return result;
  }

  /**
   * 获取最新项目（主要来自RSS订阅）
   */
  async getLatestItems(options: {
    sources?: string[];
    categories?: string[];
    limit?: number;
    timeRange?: string;
  } = {}): Promise<DataSourceResult> {
    const { limit = 20 } = options;
    
    console.log('[DataSourceManager] 获取最新项目');

    const startTime = Date.now();
    const results: IntelligenceItem[] = [];
    const sourceResults: Record<string, any> = {};

    // 生成缓存键
    const cacheKey = this.generateCacheKey('latest', options);
    
    // 尝试从缓存获取
    const cached: CacheResult<DataSourceResult> = await this.cacheManager.get<DataSourceResult>(cacheKey);
    if (cached.hit && cached.data) {
      console.log('[DataSourceManager] 缓存命中: latest');
      return cached.data;
    }

    // RSS订阅
    if (this.feedsModule) {
      try {
        const feedResults = await this.feedsModule.getLatestItems(undefined, options);
        
        if (feedResults && Array.isArray(feedResults)) {
          results.push(...feedResults);
          sourceResults.feeds = {
            count: feedResults.length
          };
        }
      } catch (error) {
        console.error('[DataSourceManager] RSS订阅获取失败:', error);
        sourceResults.feeds = {
          count: 0,
          error: error instanceof Error ? error.message : '未知错误'
        };
      }
    }

    // 处理结果
    const processedResults = this.processResults(results, limit);
    const endTime = Date.now();

    const result: DataSourceResult = {
      items: processedResults,
      total: processedResults.length,
      sources: sourceResults,
      timing: {
        total: endTime - startTime,
        fetch: endTime - startTime,
        process: 0
      }
    };

    // 缓存结果
    if (processedResults.length > 0) {
      await this.cacheManager.set(cacheKey, result, 180); // 3分钟缓存
    }

    return result;
  }

  /**
   * 处理搜索结果：去重、排序、限制数量
   */
  private processResults(items: IntelligenceItem[], limit: number): IntelligenceItem[] {
    // 去重（基于URL或标题）
    const seen = new Set<string>();
    const deduped = items.filter(item => {
      const key = item.url || item.title;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    // 按发布时间排序（最新的在前）
    deduped.sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      return timeB - timeA;
    });

    // 限制数量
    return deduped.slice(0, limit);
  }

  /**
   * 刷新所有数据源
   */
  async refreshAll(): Promise<void> {
    console.log('[DataSourceManager] 刷新所有数据源');

    const promises: Promise<void>[] = [];

    // 刷新RSS订阅
    if (this.feedsModule) {
      promises.push(this.feedsModule.refreshAll());
    }

    await Promise.allSettled(promises);
    console.log('[DataSourceManager] 所有数据源刷新完成');
  }

  /**
   * 获取数据源状态
   */
  async getStatus(): Promise<{
    available: boolean;
    sources: Record<string, any>;
    lastUpdate?: Date;
  }> {
    const sources: Record<string, any> = {};

    // 网络搜索状态
    sources.web = {
      available: true,
      type: 'web-search',
      engines: this.config.search?.engines || [],
      lastUpdate: new Date()
    };

    // RSS订阅状态
    if (this.feedsModule) {
      try {
        const feedsStatus = await this.feedsModule.getStatus();
        sources.feeds = feedsStatus;
      } catch (error) {
        sources.feeds = {
          available: false,
          error: error instanceof Error ? error.message : '未知错误'
        };
      }
    }

    const available = Object.values(sources).some((status: any) => status.available);

    return {
      available,
      sources,
      lastUpdate: new Date()
    };
  }

  /**
   * 获取配置信息
   */
  getConfig(): DataSourceConfig {
    return this.config;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DataSourceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 重新初始化模块
    if (newConfig.search) {
      const searchConfig = this.config.search ? {
        engines: this.config.search.engines.filter(engine => 
          ['zhipu', 'duckduckgo', 'searxng'].includes(engine)
        ) as ('zhipu' | 'duckduckgo' | 'searxng')[],
        maxResults: this.config.search.maxResults || 20
      } : {
        engines: ['zhipu' as const],
        maxResults: 20
      };
      
      this.webSearchModule = new WebSearchModule({
        config: searchConfig,
        cacheManager: this.cacheManager
      });
    }

    if (newConfig.feeds && this.config.feeds) {
      // 构建完整的 FeedsConfig
      const feedsConfig = {
        sources: this.config.feeds.sources.map(sourceId => ({
          id: sourceId,
          name: sourceId,
          type: 'rss' as const,
          url: '',
          enabled: true,
          category: 'general',
          reliability: 'high' as const
        })),
        refreshInterval: 300000, // 5分钟
        cacheTtl: 600, // 10分钟
        maxItemsPerSource: 50,
        timeout: 30000 // 30秒
      };
      
      this.feedsModule = new FeedsModule({
        config: feedsConfig,
        cacheManager: this.cacheManager
      });
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(query: string, options: any = {}): string {
    const parts = [
      'datasource',
      query,
      JSON.stringify(options)
    ];
    return parts.join(':');
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * 清空缓存
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
  }
}