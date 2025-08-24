/**
 * 数据获取模块 - 统一数据模型定义
 * 
 * 所有从不同来源获取的数据，最终都必须被格式化为统一的 IntelligenceItem 接口
 */

// 数据源一级分类
export type SourceType = 'web-search' | 'rss' | 'news-api' | 'social-media' | 'government';

// 统一情报数据项接口
export interface IntelligenceItem {
  /** 唯一标识符 (建议使用URL或内容的SHA256哈希值) */
  id: string;
  
  /** 信息标题 */
  title: string;
  
  /** 内容摘要或正文片段 */
  content: string;
  
  /** 内容摘要 (向后兼容) */
  contentSnippet?: string;
  
  /** (可选) 完整内容，如果可获取 */
  fullContent?: string;
  
  /** 原始链接 */
  url: string;
  
  /** 发布日期/时间 */
  publishedAt: string;
  
  /** 发布日期 (向后兼容) */
  publishedDate?: Date;
  
  /** (可选) 作者 */
  author?: string;
  
  /** (可选) 标签或关键词 */
  tags?: string[];
  
  /** 数据源信息 */
  source: {
    name: string;
    type: string;
    engine?: string;
    reliability?: 'high' | 'medium' | 'low';
  };
  
  /** 数据源一级分类 (向后兼容) */
  sourceType?: SourceType;
  
  /** 数据源具体名称 (向后兼容) */
  sourceName?: string;
  
  /** (可选) 相关性评分，用于搜索结果排序 */
  relevanceScore?: number;
  
  /** (可选) 信源可信度评分，用于排序 */
  credibilityScore?: number;
  
  /** (可选) 元数据 */
  metadata?: Record<string, any>;
}

// 数据获取配置接口
export interface DataSourceConfig {
  /** 启用的数据源类型 */
  enabledSources: SourceType[];
  
  /** 搜索配置 */
  search?: {
    engines: string[];
    maxResults?: number;
  };
  
  /** 信源订阅配置 */
  feeds?: {
    sources: string[];
    categories?: string[];
  };
  
  /** 缓存配置 */
  cache?: {
    enabled: boolean;
    ttl?: {
      webSearch: number;
      rss: number;
      newsApi: number;
      socialMedia: number;
    };
  };
  
  /** 是否合并去重 */
  merge?: boolean;
}

// 数据获取结果接口
export interface DataSourceResult {
  /** 获取到的数据项 */
  items: IntelligenceItem[];
  
  /** 总数量 */
  total: number;
  
  /** 各数据源的统计信息 */
  sources: {
    [sourceName: string]: {
      count: number;
      success: boolean;
      error?: string;
    };
  };
  
  /** 处理时间统计 */
  timing: {
    total: number;
    fetch: number;
    process: number;
  };
}

// 排序选项
export interface SortOptions {
  /** 排序字段 */
  field: 'relevance' | 'date' | 'credibility';
  
  /** 排序方向 */
  order: 'asc' | 'desc';
}

// 数据源状态
export interface DataSourceStatus {
  name: string;
  type: SourceType;
  enabled: boolean;
  lastFetch?: Date;
  lastError?: string;
  successRate: number;
}