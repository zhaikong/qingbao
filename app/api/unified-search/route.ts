import { NextRequest, NextResponse } from 'next/server';
import { DataSourceManager } from '@/lib/data-sources/manager';
import { createCacheManager } from '@/lib/data-sources/cache';
import { configLoader } from '@/lib/data-sources/config-loader';
import { YamlConfig } from '@/lib/data-sources/config-adapter';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// 全局数据源管理器实例
let dataSourceManager: DataSourceManager | null = null;

/**
 * 加载 YAML 配置
 */
function loadYamlConfig(): YamlConfig {
  try {
    const configPath = join(process.cwd(), 'config', 'data-sources.yaml');
    const configFile = readFileSync(configPath, 'utf8');
    return yaml.load(configFile) as YamlConfig;
  } catch (error) {
    console.error('Failed to load YAML config:', error);
    // 返回默认配置
    return {
      sources: {
        web_search: {
          zhipu: { enabled: true, credibility: 0.85, engine: 'search_pro' },
          duckduckgo: { enabled: true, credibility: 0.75 },
          searxng: { enabled: false, credibility: 0.70 }
        },
        rss: []
      },
      cache: {
        enabled: true,
        ttl: {
          web_search: 3600,
          rss: 900
        }
      }
    };
  }
}

/**
 * 获取数据源管理器实例
 */
function getDataSourceManager(): DataSourceManager {
  if (!dataSourceManager) {
    // 加载 YAML 配置
    const yamlConfig = loadYamlConfig();
    
    // 保持向后兼容的旧配置格式
    const config = configLoader.getConfig();
    
    // 构建符合 CacheConfig 接口的配置
    const cacheConfig = {
      type: 'memory' as const,
      enabled: yamlConfig.cache?.enabled ?? true,
      defaultTTL: yamlConfig.cache?.ttl?.web_search ?? 300,
      ttl: {
        webSearch: yamlConfig.cache?.ttl?.web_search ?? 300,
        rss: yamlConfig.cache?.ttl?.rss ?? 600,
        newsApi: 300,
        socialMedia: 300
      }
    };
    
    const cacheManager = createCacheManager(cacheConfig);
    
    dataSourceManager = new DataSourceManager({
      config,
      cacheManager,
      yamlConfig // 传递 YAML 配置
    });
  }
  return dataSourceManager;
}

/**
 * 统一搜索接口 - 支持联网搜索和信源订阅
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      enableWebSearch = true,
      enableFeeds = true,
      maxResults = 50,
      useCache = true
    } = body;

    // 验证参数
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '查询参数是必需的且不能为空' 
        },
        { status: 400 }
      );
    }

    const manager = getDataSourceManager();

    // 执行搜索
    const sources = [];
    if (enableWebSearch) sources.push('web');
    if (enableFeeds) sources.push('feeds');
    
    const result = await manager.search(query.trim(), {
      sources,
      limit: maxResults,
      useCache
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('统一搜索接口错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '搜索服务暂时不可用',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取最新信源内容
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const useCache = searchParams.get('useCache') !== 'false';

    const manager = getDataSourceManager();

    // 获取最新信源内容
    const result = await manager.getLatestItems({
      limit: maxResults
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('获取最新信源错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '信源服务暂时不可用',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * 清除缓存
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern') || undefined;

    const manager = getDataSourceManager();
    await manager.clearCache();

    return NextResponse.json({
      success: true,
      message: '已清除所有缓存'
    });

  } catch (error) {
    console.error('清除缓存错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '清除缓存失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取系统状态和缓存统计
 */
export async function OPTIONS(request: NextRequest) {
  try {
    const manager = getDataSourceManager();
    const cacheStats = manager.getCacheStats();
    const config = configLoader.getConfig();

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        config: {
          enabledSources: config.enabledSources,
          search: config.search,
          feeds: config.feeds,
          cache: config.cache,
          merge: config.merge
        },
        cacheStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取系统状态错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取系统状态失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}