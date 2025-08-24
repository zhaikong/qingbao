/**
 * 配置适配器 - 将 YAML 配置转换为各模块需要的配置格式
 */

import { WebSearchConfig } from './web-search/types';
import { FeedsConfig } from './feeds/types';

/**
 * YAML 配置结构（对应 data-sources.yaml）
 */
export interface YamlConfig {
  sources: {
    web_search: {
      zhipu?: {
        enabled: boolean;
        credibility: number;
        engine: string;
      };
      duckduckgo?: {
        enabled: boolean;
        credibility: number;
      };
      searxng?: {
        enabled: boolean;
        credibility: number;
        instance_url?: string;
      };
    };
    rss?: Array<{
      url: string;
      name: string;
      credibility: number;
      category: string;
    }>;
  };
  cache: {
    enabled: boolean;
    ttl: {
      web_search: number;
      rss: number;
    };
  };
}

/**
 * 将 YAML 配置转换为 WebSearchConfig
 */
export function buildWebSearchConfig(yamlConfig: YamlConfig): WebSearchConfig {
  const webSearchSources = yamlConfig.sources.web_search;
  const engines: ('zhipu' | 'duckduckgo' | 'searxng')[] = [];
  
  // 构建启用的引擎列表
  if (webSearchSources.zhipu?.enabled) {
    engines.push('zhipu');
  }
  if (webSearchSources.duckduckgo?.enabled) {
    engines.push('duckduckgo');
  }
  if (webSearchSources.searxng?.enabled) {
    engines.push('searxng');
  }

  // 如果没有启用的引擎，默认启用智谱
  if (engines.length === 0) {
    engines.push('zhipu');
  }

  return {
    engines,
    maxResults: 20,
    timeout: 30000,
    cacheConfig: {
      ttl: yamlConfig.cache.ttl.web_search || 3600
    },
    zhipu: {
      enabled: webSearchSources.zhipu?.enabled || false,
      apiKey: process.env.ZHIPU_API_KEY
    },
    duckduckgo: {
      enabled: webSearchSources.duckduckgo?.enabled || false
    },
    searxng: {
      enabled: webSearchSources.searxng?.enabled || false,
      baseUrl: webSearchSources.searxng?.instance_url
    }
  };
}

/**
 * 将 YAML 配置转换为 FeedsConfig
 */
export function buildFeedsConfig(yamlConfig: YamlConfig): FeedsConfig | null {
  const rssSources = yamlConfig.sources.rss;
  
  if (!rssSources || rssSources.length === 0) {
    return null;
  }

  return {
    sources: rssSources.map(source => ({
      id: source.url,
      name: source.name,
      type: 'rss' as const,
      url: source.url,
      enabled: true,
      category: source.category,
      reliability: source.credibility >= 0.8 ? 'high' as const : 
                   source.credibility >= 0.6 ? 'medium' as const : 'low' as const
    })),
    refreshInterval: 300000, // 5分钟
    cacheTtl: yamlConfig.cache.ttl.rss || 900,
    maxItemsPerSource: 50,
    timeout: 30000
  };
}