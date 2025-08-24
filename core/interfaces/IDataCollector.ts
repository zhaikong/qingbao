// 核心服务层 (NEW)
// 统一接口定义 - 数据采集接口

export type CollectorType = 'API' | 'BROWSER' | 'MCP';

export interface CollectionOptions {
  // Define collection options
}

import type { SearchResult } from '../../lib/types';

export interface CollectionResult {
  source: string;
  results: SearchResult[];
  error?: string;
}

export interface CollectorMetadata {
  // Define collector metadata
}

export interface IDataCollector {
  readonly type: CollectorType
  readonly name: string
  readonly priority: number

  isAvailable(): Promise<boolean>
  collect(query: string, options?: CollectionOptions): Promise<CollectionResult>
  testConnection(): Promise<boolean>
  getMetadata(): CollectorMetadata
}