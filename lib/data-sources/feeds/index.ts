import { IntelligenceItem } from '../types';
import { CacheManager } from '../cache';
import { FeedsConfig, FeedSource, FeedItem, FeedsOptions, FeedSourceStatus } from './types';
import { RSSFeedHandler } from './rss';
// import { GNewsFeedHandler } from './gnews'; // 暂时注释掉，避免构建错误

export interface FeedsModuleOptions {
  config: FeedsConfig;
  cacheManager: CacheManager;
}

export class FeedsModule {
  private config: FeedsConfig;
  private cacheManager: CacheManager;
  private handlers: Map<string, any> = new Map();
  private lastRefresh: Date | null = null;

  constructor(options: FeedsModuleOptions) {
    this.config = options.config;
    this.cacheManager = options.cacheManager;
    this.initializeHandlers();
  }

  /**
   * 初始化各类型的处理器
   */
  private initializeHandlers(): void {
    this.handlers.set('rss', new RSSFeedHandler());
    // this.handlers.set('gnews', new GNewsFeedHandler()); // 暂时注释掉
    // 后续可以添加更多处理器
    // this.handlers.set('reddit', new RedditFeedHandler());
    // this.handlers.set('telegram', new TelegramFeedHandler());
  }

  /**
   * 获取最新项目
   */
  async getLatestItems(query?: string, options: FeedsOptions = {}): Promise<IntelligenceItem[]> {
    const { 
      limit = 20, 
      timeRange, 
      categories, 
      sources 
    } = options;

    console.log(`[FeedsModule] 获取最新项目, 查询: ${query || '全部'}`);

    // 过滤启用的源
    let enabledSources = this.config.sources.filter(source => source.enabled);
    
    // 如果指定了特定源
    if (sources && sources.length > 0) {
      enabledSources = enabledSources.filter(source => sources.includes(source.id));
    }
    
    // 如果指定了分类
    if (categories && categories.length > 0) {
      enabledSources = enabledSources.filter(source => 
        source.category && categories.includes(source.category)
      );
    }

    if (enabledSources.length === 0) {
      console.warn('[FeedsModule] 没有启用的信源');
      return [];
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(query, options);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<IntelligenceItem[]>(cacheKey);
    if (cached.hit && cached.data) {
      console.log(`[FeedsModule] 缓存命中: ${query || '全部'}`);
      return cached.data.slice(0, limit);
    }

    // 并发获取各源的数据
    const promises = enabledSources.map(source => 
      this.fetchFromSource(source, query, { limit: Math.ceil(limit / enabledSources.length) })
    );

    const results = await Promise.allSettled(promises);
    
    // 合并结果
    const allItems: IntelligenceItem[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      } else {
        const source = enabledSources[index];
        console.error(`[FeedsModule] 获取源 ${source.name} 失败:`, result.reason);
      }
    });

    // 处理结果
    const processedItems = this.processItems(allItems, query, limit, timeRange);
    
    // 缓存结果
    await this.cacheManager.set(cacheKey, processedItems, this.config.cacheTtl);
    
    return processedItems;
  }

  /**
   * 从特定源获取数据
   */
  private async fetchFromSource(
    source: FeedSource, 
    query?: string, 
    options: { limit: number } = { limit: 10 }
  ): Promise<IntelligenceItem[]> {
    const handler = this.handlers.get(source.type);
    if (!handler) {
      throw new Error(`不支持的信源类型: ${source.type}`);
    }

    try {
      console.log(`[FeedsModule] 从源 ${source.name} (${source.type}) 获取数据`);
      
      const items = await handler.fetchItems(source, query, options);
      
      // 转换为统一格式
      return items.map((item: FeedItem) => this.convertToIntelligenceItem(item, source));
    } catch (error) {
      console.error(`[FeedsModule] 源 ${source.name} 获取失败:`, error);
      return [];
    }
  }

  /**
   * 转换为统一的 IntelligenceItem 格式
   */
  private convertToIntelligenceItem(item: FeedItem, source: FeedSource): IntelligenceItem {
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      url: item.url,
      publishedAt: item.publishedAt,
      author: item.author,
      tags: item.tags || [],
      source: {
        name: source.name,
        type: 'feeds',
        reliability: source.reliability
      },
      metadata: {
        feedSource: source.id,
        feedType: source.type,
        category: item.category,
        originalItem: item
      }
    };
  }

  /**
   * 处理项目：过滤、排序、去重
   */
  private processItems(
    items: IntelligenceItem[], 
    query?: string, 
    limit: number = 20,
    timeRange?: string
  ): IntelligenceItem[] {
    let processedItems = [...items];

    // 时间范围过滤
    if (timeRange) {
      processedItems = this.filterByTimeRange(processedItems, timeRange);
    }

    // 关键词过滤
    if (query) {
      processedItems = this.filterByQuery(processedItems, query);
    }

    // 去重
    processedItems = this.deduplicateItems(processedItems);

    // 排序（按发布时间倒序）
    processedItems.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // 限制数量
    return processedItems.slice(0, limit);
  }

  /**
   * 按时间范围过滤
   */
  private filterByTimeRange(items: IntelligenceItem[], timeRange: string): IntelligenceItem[] {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return items;
    }

    return items.filter(item => new Date(item.publishedAt) >= cutoffTime);
  }

  /**
   * 按查询关键词过滤
   */
  private filterByQuery(items: IntelligenceItem[], query: string): IntelligenceItem[] {
    const keywords = query.toLowerCase().split(/\s+/);
    
    return items.filter(item => {
      const searchText = (item.title + ' ' + item.content).toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    });
  }

  /**
   * 去重
   */
  private deduplicateItems(items: IntelligenceItem[]): IntelligenceItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = item.url || item.title;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 刷新所有信源
   */
  async refreshAll(): Promise<void> {
    console.log('[FeedsModule] 刷新所有信源');
    
    const enabledSources = this.config.sources.filter(source => source.enabled);
    
    const promises = enabledSources.map(async (source) => {
      try {
        await this.refreshSource(source);
      } catch (error) {
        console.error(`[FeedsModule] 刷新源 ${source.name} 失败:`, error);
      }
    });

    await Promise.allSettled(promises);
    this.lastRefresh = new Date();
  }

  /**
   * 刷新特定信源
   */
  private async refreshSource(source: FeedSource): Promise<void> {
    const handler = this.handlers.get(source.type);
    if (!handler || !handler.refresh) {
      return;
    }

    await handler.refresh(source);
  }

  /**
   * 获取模块状态
   */
  async getStatus(): Promise<{ available: boolean; lastUpdate?: Date; error?: string }> {
    try {
      const enabledSources = this.config.sources.filter(source => source.enabled);
      
      if (enabledSources.length === 0) {
        return { available: false, error: '没有启用的信源' };
      }

      // 检查各源状态
      const statusPromises = enabledSources.map(source => this.getSourceStatus(source));
      const statuses = await Promise.allSettled(statusPromises);
      
      const availableCount = statuses.filter(s => 
        s.status === 'fulfilled' && s.value.available
      ).length;

      return {
        available: availableCount > 0,
        lastUpdate: this.lastRefresh || undefined,
        error: availableCount === 0 ? '所有信源都不可用' : undefined
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取特定源状态
   */
  async getSourceStatus(source: FeedSource): Promise<FeedSourceStatus> {
    const handler = this.handlers.get(source.type);
    
    if (!handler) {
      return {
        id: source.id,
        available: false,
        lastError: `不支持的信源类型: ${source.type}`
      };
    }

    try {
      if (handler.getStatus) {
        return await handler.getStatus(source);
      } else {
        // 简单的可用性检查
        await this.fetchFromSource(source, undefined, { limit: 1 });
        return {
          id: source.id,
          available: true,
          lastUpdate: new Date()
        };
      }
    } catch (error) {
      return {
        id: source.id,
        available: false,
        lastError: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(query?: string, options: FeedsOptions = {}): string {
    const { limit, timeRange, categories, sources } = options;
    const parts = [
      'feeds',
      query || 'all',
      limit || 'default',
      timeRange || 'all',
      categories?.sort().join(',') || 'all',
      sources?.sort().join(',') || 'all'
    ];
    return parts.join(':');
  }

  /**
   * 获取支持的信源类型
   */
  getSupportedTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 添加新的处理器
   */
  addHandler(type: string, handler: any): void {
    this.handlers.set(type, handler);
  }
}