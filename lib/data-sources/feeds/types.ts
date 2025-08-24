export interface FeedsConfig {
  sources: FeedSource[];
  refreshInterval: number; // 刷新间隔（分钟）
  cacheTtl: number; // 缓存时间（秒）
  maxItemsPerSource: number; // 每个源最大条目数
  timeout: number; // 请求超时时间（毫秒）
}

export interface FeedSource {
  id: string;
  name: string;
  type: 'rss' | 'gnews' | 'reddit' | 'telegram';
  url?: string; // RSS URL 或 API 端点
  apiKey?: string; // API 密钥（如需要）
  category?: string; // 分类
  language?: string; // 语言
  country?: string; // 国家/地区
  enabled: boolean;
  reliability: 'high' | 'medium' | 'low';
  tags?: string[]; // 标签
  config?: Record<string, any>; // 特定配置
}

export interface FeedItem {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  author?: string;
  category?: string;
  tags?: string[];
  source: {
    id: string;
    name: string;
    type: string;
  };
  metadata?: Record<string, any>;
}

export interface FeedsOptions {
  limit?: number;
  timeRange?: string;
  categories?: string[];
  sources?: string[]; // 指定源 ID
}

export interface FeedSourceStatus {
  id: string;
  available: boolean;
  lastUpdate?: Date;
  lastError?: string;
  itemCount?: number;
}