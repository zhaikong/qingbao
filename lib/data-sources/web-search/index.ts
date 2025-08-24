import { SearchResponse, SearchEngine, WebSearchConfig } from './types';
import { CacheManager } from '../cache';
import { IntelligenceItem } from '../types';

// 导入各搜索引擎
import { search as searchWithZhipu } from '../../search-engines/zhipu';
import { search as searchWithDuckDuckGo } from '../../search-engines/duckduckgo';
import { search as searchWithSearxng } from '../../search-engines/searxng';

// 定义搜索结果类型
interface SearchResult {
  title: string;
  content: string;
  url: string;
  engine: SearchEngine;
  publishedAt: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface WebSearchModuleOptions {
  config: WebSearchConfig;
  cacheManager?: CacheManager;
}

export class WebSearchModule {
  private config: WebSearchConfig;
  private cacheManager?: CacheManager;

  constructor(options: WebSearchModuleOptions) {
    this.config = options.config;
    this.cacheManager = options.cacheManager;
  }

  /**
   * 执行搜索
   */
  async search(query: string, options?: {
    engines?: SearchEngine[];
    maxResults?: number;
    cacheKey?: string;
  }): Promise<SearchResponse> {
    const {
      engines = this.config.engines,
      maxResults = this.config.maxResults || 20,
      cacheKey
    } = options || {};

    // 生成缓存键
    const finalCacheKey = cacheKey || this.generateCacheKey(query, engines);

    // 尝试从缓存获取
    if (this.cacheManager) {
      const cached = await this.cacheManager.get<SearchResponse>(finalCacheKey);
      if (cached.hit && cached.data) {
        return cached.data;
      }
    }

    const startTime = Date.now();
    const results: SearchResult[] = [];
    const errors: string[] = [];

    // 并发执行搜索
    const searchPromises = engines.map(async (engine: SearchEngine) => {
      try {
        const engineResults = await this.searchWithEngine(engine, query);
        results.push(...engineResults);
      } catch (error) {
        const errorMsg = `${engine} search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    });

    await Promise.allSettled(searchPromises);

    // 处理结果
    const processedResults = this.processSearchResults(results, maxResults);

    const response: SearchResponse = {
      success: results.length > 0,
      data: results.length > 0 ? {
        results: processedResults,
        total: processedResults.length,
        query,
        engines: engines.filter(engine => 
          !errors.some(error => error.includes(engine))
        ),
        processingTime: Date.now() - startTime
      } : undefined,
      error: results.length === 0 ? 'All search engines failed' : undefined,
      errors: errors.length > 0 ? errors : undefined
    };

    // 缓存成功的结果
    if (this.cacheManager && response.success) {
      await this.cacheManager.set(
        finalCacheKey, 
        response, 
        this.config.cacheConfig?.ttl || 300
      );
    }

    return response;
  }

  /**
   * 使用指定引擎搜索
   */
  private async searchWithEngine(engine: SearchEngine, query: string): Promise<SearchResult[]> {
    switch (engine) {
      case 'zhipu':
        return await this.searchZhipu(query);
      case 'duckduckgo':
        return await this.searchDuckDuckGo(query);
      case 'searxng':
        return await this.searchSearxng(query);
      default:
        throw new Error(`Unsupported search engine: ${engine}`);
    }
  }

  /**
   * 智谱搜索
   */
  private async searchZhipu(query: string): Promise<SearchResult[]> {
    const zhipuConfig = this.config.zhipu;
    if (!zhipuConfig?.enabled) {
      throw new Error('Zhipu search is not enabled');
    }

    const response = await searchWithZhipu(query);

    return response.map(item => ({
      title: item.title,
      content: item.content,
      url: item.url,
      engine: 'zhipu',
      publishedAt: item.publishDate || new Date().toISOString(),
      relevanceScore: 0.8, // 智谱搜索质量较高
      metadata: {
        domain: item.url ? new URL(item.url).hostname : undefined,
        source: item.source
      }
    }));
  }

  /**
   * DuckDuckGo搜索
   */
  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    const duckduckgoConfig = this.config.duckduckgo;
    if (!duckduckgoConfig?.enabled) {
      throw new Error('DuckDuckGo search is not enabled');
    }

    const response = await searchWithDuckDuckGo(query);

    return response.map(item => ({
      title: item.title,
      content: item.content,
      url: item.url,
      engine: 'duckduckgo',
      publishedAt: new Date().toISOString(), // DuckDuckGo通常不提供发布时间
      relevanceScore: 0.6,
      metadata: {
        domain: item.url ? new URL(item.url).hostname : undefined,
        source: item.source
      }
    }));
  }

  /**
   * SearXNG搜索
   */
  private async searchSearxng(query: string): Promise<SearchResult[]> {
    const searxngConfig = this.config.searxng;
    if (!searxngConfig?.enabled) {
      throw new Error('SearXNG search is not enabled');
    }

    const response = await searchWithSearxng(query);

    return response.map(item => ({
      title: item.title,
      content: item.content,
      url: item.url,
      engine: 'searxng',
      publishedAt: item.publishDate || new Date().toISOString(),
      relevanceScore: 0.7,
      metadata: {
        domain: item.url ? new URL(item.url).hostname : undefined,
        source: item.source
      }
    }));
  }

  /**
   * 处理搜索结果：去重、排序、限制数量
   */
  private processSearchResults(results: SearchResult[], maxResults: number): IntelligenceItem[] {
    // 去重（基于URL）
    const uniqueResults = results.reduce((acc, item) => {
      if (!acc.has(item.url)) {
        acc.set(item.url, item);
      } else {
        // 如果URL重复，保留相关性更高的结果
        const existing = acc.get(item.url)!;
        if (item.relevanceScore > existing.relevanceScore) {
          acc.set(item.url, item);
        }
      }
      return acc;
    }, new Map<string, SearchResult>());

    // 转换为数组并排序
    const sortedResults = Array.from(uniqueResults.values()).sort((a: SearchResult, b: SearchResult) => {
      // 按相关性排序
      return b.relevanceScore - a.relevanceScore;
    });

    // 转换为 IntelligenceItem 格式并限制数量
    return sortedResults.slice(0, maxResults).map(result => ({
      id: result.url,
      title: result.title,
      content: result.content,
      url: result.url,
      publishedAt: result.publishedAt,
      source: {
        name: result.engine,
        type: 'web-search',
        engine: result.engine,
        reliability: 'medium' as const
      },
      relevanceScore: result.relevanceScore,
      metadata: result.metadata
    }));
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(query: string, engines: SearchEngine[]): string {
    const key = `${query}:${engines.sort().join(',')}`;
    return `web-search:${Buffer.from(key).toString('base64')}`;
  }
}