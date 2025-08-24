export type Engine = string; // 放宽以兼容实际信源标识（如 GNews、NewsAPI、firecrawl、chrome 等）

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  content: string;
  source: Engine;
  publishDate?: string;       // 统一使用 publishDate
  relevanceScore?: number;
  credibilityScore?: number;  // 可选：可信度评分
  priority?: 'high' | 'medium' | 'low'; // 可选：处理优先级
  timestamp?: number;         // 可选：时间戳
  metadata?: Record<string, any>;
}
