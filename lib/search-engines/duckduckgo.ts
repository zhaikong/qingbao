import { SearchResult, Engine } from '@/lib/types';
import { fetchWithAxios } from '../axios-network-utils';

// DuckDuckGo搜索实现，带重试机制
export async function search(query: string): Promise<SearchResult[]> {
  const maxRetries = 2;
  const timeout = 60000; // 60秒超时，避免AbortError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DuckDuckGo] 尝试搜索 (${attempt}/${maxRetries}): ${query}`);
      
      // 使用增强的网络工具，自动处理超时和连接问题
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetchWithAxios(url, {
        headers: { 
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        const results: SearchResult[] = data.RelatedTopics
          .filter((item: any) => item.FirstURL && item.Text)
          .map((item: any) => ({
            title: item.Text.split(' - ')[0] || item.Text.substring(0, 100),
            url: item.FirstURL,
            content: item.Text,
            source: 'duckduckgo' as Engine,
          }));
        
        console.log(`[DuckDuckGo] 搜索成功，返回 ${results.length} 条结果`);
        return results;
      } else {
        console.log(`[DuckDuckGo] 搜索完成，但无相关结果`);
        return [];
      }
      
    } catch (error) {
      console.error(`[DuckDuckGo] 搜索失败 (尝试 ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        // 最后一次尝试失败，返回空结果而不是抛出错误
        console.warn(`[DuckDuckGo] 所有重试都失败，返回空结果`);
        return [];
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return [];
}
