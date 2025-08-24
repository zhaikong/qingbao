import { NextResponse } from 'next/server';
import { configLoader } from '@/lib/data-sources/config-loader';

export async function GET() {
  try {
    // config is now loaded with a structure that mirrors the YAML file.
    // We cast to `any` to bypass the currently misaligned DataSourceConfig type.
    const config: any = configLoader.getConfig();
    const groupedSources: { [key: string]: any[] } = {};

    // Process web search sources from config.sources.web_search
    if (config.sources?.web_search) {
      const category = 'AI搜索';
      if (!groupedSources[category]) {
        groupedSources[category] = [];
      }
      const webSearchConfig = config.sources.web_search;
      if (webSearchConfig.zhipu?.enabled) {
        groupedSources[category].push({ name: '智谱AI搜索', type: 'zhipu', category });
      }
      if (webSearchConfig.duckduckgo?.enabled) {
        groupedSources[category].push({ name: 'DuckDuckGo', type: 'duckduckgo', category });
      }
      if (webSearchConfig.searxng?.enabled) {
        groupedSources[category].push({ name: 'SearXNG', type: 'searxng', category });
      }
    }

    // Process RSS feed sources from config.sources.rss
    if (config.sources?.rss && Array.isArray(config.sources.rss)) {
      config.sources.rss.forEach((source: any) => {
        const category = source.category || '信源订阅';
        if (!groupedSources[category]) {
          groupedSources[category] = [];
        }
        groupedSources[category].push({
          name: source.name,
          type: 'rss',
          category: category,
          url: source.url,
        });
      });
    }
    
    return new Response(JSON.stringify(groupedSources), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return new Response(JSON.stringify({ details: (error as Error).message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}