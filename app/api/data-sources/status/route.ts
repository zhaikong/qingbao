import { NextResponse } from 'next/server';
import { DataSourceManager } from '@/lib/data-sources/manager';
import { CacheManager } from '@/lib/data-sources/cache';
import { loadConfig } from '@/lib/data-sources/config-adapter';

// 初始化缓存和配置
const cacheManager = new CacheManager();
const yamlConfig = loadConfig();

// 初始化数据源管理器
const dataSourceManager = new DataSourceManager({
  config: {}, // 旧的config可以为空，因为我们将依赖yamlConfig
  cacheManager,
  yamlConfig,
});

export async function GET() {
  try {
    const status = await dataSourceManager.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('获取数据源状态失败:', error);
    return NextResponse.json(
      { error: '获取数据源状态失败' },
      { status: 500 }
    );
  }
}