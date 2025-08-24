import { search as zhipuSearch } from './search-engines/zhipu';
import { search as duckduckgoSearch } from './search-engines/duckduckgo';
import { search as searxngSearch } from './search-engines/searxng';
import { search as geminiSearch } from './search-engines/gemini-search';
import { SearchResult, Engine } from '@/lib/types';

const searchEngines: Record<Engine, (query: string) => Promise<SearchResult[]>> = {
  zhipu: zhipuSearch,
  duckduckgo: duckduckgoSearch,
  searxng: searxngSearch,
  gemini: geminiSearch,
};

// 统一搜索函数 - 新增Gemini网络搜索
export async function search(query: string, engines: Engine[] = ['gemini', 'zhipu', 'duckduckgo', 'searxng']): Promise<SearchResult[]> {
  const searchPromises = engines
    .filter(engine => searchEngines[engine]) // 确保引擎存在
    .map(engine => searchEngines[engine](query).catch(error => {
      console.error(`搜索引擎 ${engine} 执行失败:`, error.message);
      return []; // 如果某个引擎失败，返回空数组而不是让整个Promise.all失败
    }));

  const allResults = await Promise.all(searchPromises);
  const flattenedResults = allResults.flat();

  // 去重合并
  const uniqueResults = new Map<string, SearchResult>();
  for (const result of flattenedResults) {
    if (!uniqueResults.has(result.url)) {
      uniqueResults.set(result.url, result);
    }
  }

  return Array.from(uniqueResults.values());
}