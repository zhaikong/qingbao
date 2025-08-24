import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { DataSourceConfig } from './types';

/**
 * 配置加载器
 */
export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: DataSourceConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * 加载配置文件
   */
  loadConfig(configPath?: string): DataSourceConfig {
    if (this.config) {
      return this.config;
    }

    const defaultConfigPath = join(process.cwd(), 'config', 'data-sources.yaml');
    const finalConfigPath = configPath || defaultConfigPath;

    try {
      const configFile = readFileSync(finalConfigPath, 'utf8');
      const rawConfig = yaml.load(configFile) as any;
      
      this.config = this.validateAndNormalizeConfig(rawConfig);
      return this.config;
    } catch (error) {
      console.error('Failed to load data sources config:', error);
      
      // 返回默认配置
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  /**
   * 获取配置（如果未加载则先加载）
   */
  getConfig(): DataSourceConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  /**
   * 重新加载配置
   */
  reloadConfig(configPath?: string): DataSourceConfig {
    this.config = null;
    return this.loadConfig(configPath);
  }

  /**
   * 验证和规范化配置
   */
  private validateAndNormalizeConfig(rawConfig: any): DataSourceConfig {
    if (!rawConfig || !rawConfig.sources) {
      console.error("Config file is invalid or missing 'sources' key. Returning default config.");
      return this.getDefaultConfig();
    }

    // 将YAML结构转换为TypeScript类型结构
    const normalizedConfig: DataSourceConfig = {
      enabledSources: [],
      search: {
        engines: []
      },
      feeds: {
        sources: rawConfig.sources.rss || []
      },
      cache: {
        enabled: rawConfig.cache?.enabled || false,
        ttl: rawConfig.cache?.ttl || {}
      }
    };

    // 处理搜索引擎配置
    if (rawConfig.sources.web_search) {
      const webSearch = rawConfig.sources.web_search;
      
      if (webSearch.zhipu?.enabled) {
        normalizedConfig.search!.engines.push('zhipu');
        normalizedConfig.enabledSources.push('web-search');
      }
      
      if (webSearch.duckduckgo?.enabled) {
        normalizedConfig.search!.engines.push('duckduckgo');
        normalizedConfig.enabledSources.push('web-search');
      }
      
      if (webSearch.searxng?.enabled) {
        normalizedConfig.search!.engines.push('searxng');
        normalizedConfig.enabledSources.push('web-search');
      }
    }

    // 处理新闻API配置
    if (rawConfig.sources.news_api) {
      const newsApi = rawConfig.sources.news_api;
      
      if (newsApi.gnews?.enabled || newsApi.newsapi?.enabled || newsApi.guardian?.enabled) {
        normalizedConfig.enabledSources.push('news-api');
      }
    }

    // 处理RSS配置
    if (rawConfig.sources.rss && Array.isArray(rawConfig.sources.rss)) {
      normalizedConfig.feeds!.sources = rawConfig.sources.rss.map((rss: any) => rss.url || rss);
      normalizedConfig.enabledSources.push('rss');
    }

    console.log('✅ 配置规范化完成，启用的数据源:', normalizedConfig.enabledSources);
    
    return normalizedConfig;
  }

  /**
   * 验证配置
   */
  private validateConfig(config: any): void {
    // Since we are not normalizing, this validation logic might fail.
    // This needs to be refactored along with the normalization.
    // For now, we can perform some basic checks.
    const webSearchConfig = config.sources?.web_search;
    if (webSearchConfig?.zhipu?.enabled && !process.env.ZHIPU_API_KEY) {
      console.warn('ZHIPU_API_KEY environment variable is not set, but Zhipu search is enabled.');
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): DataSourceConfig {
    // This default config is also not aligned with types.ts.
    // Providing a minimal structure to avoid crashes.
    return {
      enabledSources: [],
      search: {
        engines: [],
      },
      feeds: {
        sources: [],
      },
      cache: {
        enabled: false,
      },
    } as any;
  }
}

// 导出单例实例
export const configLoader = ConfigLoader.getInstance();