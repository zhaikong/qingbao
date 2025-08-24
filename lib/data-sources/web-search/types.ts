/**
 * 联网搜索模块类型定义
 */

import { IntelligenceItem } from '../types';

// 搜索引擎类型
export type SearchEngine = 'zhipu' | 'duckduckgo' | 'searxng';

// Web搜索配置接口
export interface WebSearchConfig {
  /** 启用的搜索引擎 */
  engines: SearchEngine[];
  
  /** 最大结果数量 */
  maxResults?: number;
  
  /** 请求超时时间 (毫秒) */
  timeout?: number;
  
  /** 缓存配置 */
  cacheConfig?: {
    ttl: number;
  };
  
  /** 智谱搜索配置 */
  zhipu?: {
    enabled: boolean;
    apiKey?: string;
  };
  
  /** DuckDuckGo搜索配置 */
  duckduckgo?: {
    enabled: boolean;
  };
  
  /** SearXNG搜索配置 */
  searxng?: {
    enabled: boolean;
    baseUrl?: string;
  };
}

// 搜索配置接口 (向后兼容)
export interface SearchConfig extends WebSearchConfig {}

// Web搜索选项接口
export interface WebSearchOptions {
  /** 最大结果数量 */
  limit?: number;
  
  /** 时间范围 */
  timeRange?: string;
  
  /** 指定使用的搜索引擎 */
  engines?: SearchEngine[];
  
  /** 优先级策略 */
  priority?: 'speed' | 'quality';
  
  /** 是否使用缓存 */
  useCache?: boolean;
}

// 搜索选项接口 (向后兼容)
export interface SearchOptions extends WebSearchOptions {}

// 搜索请求接口
export interface SearchRequest {
  /** 搜索查询 */
  query: string;
  
  /** 指定使用的搜索引擎 */
  engines?: SearchEngine[];
  
  /** 最大结果数量 */
  maxResults?: number;
  
  /** 是否使用缓存 */
  useCache?: boolean;
}

// 搜索结果接口
export interface SearchResponse {
  /** 是否成功 */
  success: boolean;
  
  /** 搜索数据 */
  data?: {
    results: IntelligenceItem[];
    total: number;
    query: string;
    engines: string[];
    processingTime: number;
  };
  
  /** 错误信息 */
  error?: string;
  
  /** 错误列表 */
  errors?: string[];
}

// 搜索引擎接口
export interface ISearchEngine {
  /** 引擎名称 */
  name: SearchEngine;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 搜索方法 */
  search(query: string, options?: any): Promise<IntelligenceItem[]>;
  
  /** 健康检查 */
  healthCheck?(): Promise<boolean>;
  
  /** 获取引擎状态 */
  getStatus?(): {
    name: string;
    enabled: boolean;
    lastUsed?: Date;
    errorCount: number;
  };
}

// 搜索引擎工厂接口
export interface SearchEngineFactory {
  create(engine: SearchEngine, config: any): ISearchEngine;
  getSupportedEngines(): SearchEngine[];
}