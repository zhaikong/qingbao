/**
 * 现有搜索引擎适配器
 * 
 * 将现有的搜索引擎代码适配到新的数据源架构中
 */

import { IntelligenceItem, SourceType } from '../types';
import { SearchResult } from '@/lib/types';
import { createHash } from 'crypto';

// 导入现有的搜索引擎
import * as zhipuSearch from '@/lib/search-engines/zhipu';
import * as duckduckgoSearch from '@/lib/search-engines/duckduckgo';
import * as searxngSearch from '@/lib/search-engines/searxng';

/**
 * 将现有的 SearchResult 转换为统一的 IntelligenceItem
 */
export function convertSearchResultToIntelligenceItem(
  result: SearchResult,
  query: string
): IntelligenceItem {
  // 生成唯一ID (基于URL的SHA256哈希)
  const id = createHash('sha256').update(result.url).digest('hex');
  
  // 计算相关性评分 (简单的关键词匹配)
  const relevanceScore = calculateRelevanceScore(result, query);
  
  // 获取信源可信度评分
  const credibilityScore = getSourceCredibilityScore(result.source);
  
  return {
    id,
    title: result.title,
    content: result.content,
    contentSnippet: result.content,
    url: result.url,
    publishedAt: result.publishDate || new Date().toISOString(),
    publishedDate: result.publishDate ? new Date(result.publishDate) : new Date(),
    source: {
      name: getSourceDisplayName(result.source),
      type: 'web-search',
      engine: result.source,
      reliability: getSourceReliability(result.source)
    },
    sourceType: 'web-search' as SourceType,
    sourceName: getSourceDisplayName(result.source),
    tags: extractTagsFromContent(result.content, query),
    relevanceScore,
    credibilityScore,
  };
}

/**
 * 计算相关性评分
 */
function calculateRelevanceScore(result: SearchResult, query: string): number {
  if (!query) return 0.5;
  
  const queryTerms = query.toLowerCase().split(/\s+/);
  const title = result.title.toLowerCase();
  const content = result.content.toLowerCase();
  
  let score = 0;
  let maxScore = queryTerms.length * 2; // 标题权重2，内容权重1
  
  queryTerms.forEach(term => {
    if (title.includes(term)) score += 2;
    if (content.includes(term)) score += 1;
  });
  
  return Math.min(score / maxScore, 1.0);
}

/**
 * 获取信源可信度评分
 */
function getSourceCredibilityScore(source: string): number {
  const credibilityMap: { [key: string]: number } = {
    'zhipu': 0.85,
    'duckduckgo': 0.75,
    'searxng': 0.70,
  };
  
  return credibilityMap[source] || 0.60;
}

/**
 * 获取信源显示名称
 */
function getSourceDisplayName(source: string): string {
  const nameMap: { [key: string]: string } = {
    'zhipu': '智谱搜索',
    'duckduckgo': 'DuckDuckGo',
    'searxng': 'SearXNG',
  };
  
  return nameMap[source] || source;
}

/**
 * 获取信源可靠性等级
 */
function getSourceReliability(source: string): 'high' | 'medium' | 'low' {
  const reliabilityMap: { [key: string]: 'high' | 'medium' | 'low' } = {
    'zhipu': 'high',
    'duckduckgo': 'medium',
    'searxng': 'medium',
  };
  
  return reliabilityMap[source] || 'low';
}

/**
 * 从内容中提取标签
 */
function extractTagsFromContent(content: string, query: string): string[] {
  const tags: string[] = [];
  
  // 添加查询关键词作为标签
  if (query) {
    tags.push(...query.split(/\s+/).filter(term => term.length > 2));
  }
  
  // 简单的关键词提取 (可以后续优化)
  const keywords = content.match(/\b[A-Za-z\u4e00-\u9fa5]{3,}\b/g);
  if (keywords) {
    tags.push(...keywords.slice(0, 5)); // 最多5个关键词
  }
  
  return Array.from(new Set(tags)); // 去重
}

/**
 * 现有搜索引擎适配器类
 */
export class LegacySearchAdapter {
  /**
   * 使用智谱搜索
   */
  async searchWithZhipu(query: string): Promise<IntelligenceItem[]> {
    try {
      const results = await zhipuSearch.search(query);
      return results.map(result => convertSearchResultToIntelligenceItem(result, query));
    } catch (error) {
      console.error('智谱搜索适配器错误:', error);
      return [];
    }
  }

  /**
   * 使用 DuckDuckGo 搜索
   */
  async searchWithDuckDuckGo(query: string): Promise<IntelligenceItem[]> {
    try {
      const results = await duckduckgoSearch.search(query);
      return results.map(result => convertSearchResultToIntelligenceItem(result, query));
    } catch (error) {
      console.error('DuckDuckGo搜索适配器错误:', error);
      return [];
    }
  }

  /**
   * 使用 SearXNG 搜索
   */
  async searchWithSearXNG(query: string): Promise<IntelligenceItem[]> {
    try {
      const results = await searxngSearch.search(query);
      return results.map(result => convertSearchResultToIntelligenceItem(result, query));
    } catch (error) {
      console.error('SearXNG搜索适配器错误:', error);
      return [];
    }
  }

  /**
   * 统一搜索接口
   */
  async search(query: string, engines: string[] = ['zhipu', 'duckduckgo']): Promise<IntelligenceItem[]> {
    const searchPromises: Promise<IntelligenceItem[]>[] = [];

    if (engines.includes('zhipu')) {
      searchPromises.push(this.searchWithZhipu(query));
    }
    
    if (engines.includes('duckduckgo')) {
      searchPromises.push(this.searchWithDuckDuckGo(query));
    }
    
    if (engines.includes('searxng')) {
      searchPromises.push(this.searchWithSearXNG(query));
    }

    // 并发执行所有搜索
    const results = await Promise.allSettled(searchPromises);
    
    // 合并所有成功的结果
    const allItems: IntelligenceItem[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      } else {
        console.error(`搜索引擎 ${engines[index]} 执行失败:`, result.reason);
      }
    });

    return allItems;
  }
}