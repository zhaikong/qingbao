import https from 'https';
import { SearchResult, Engine } from '@/lib/types';

// 允许通过环境变量配置SearXNG实例，提供一个默认值
const SEARXNG_INSTANCE_URL = process.env.SEARXNG_INSTANCE_URL || 'https://searx.be';

// SearXNG搜索实现
export async function search(query: string): Promise<SearchResult[]> {
  const url = `${SEARXNG_INSTANCE_URL}/search?q=${encodeURIComponent(query)}&format=json`;

  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'IntelligencePlatform/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.results && Array.isArray(response.results)) {
            const results: SearchResult[] = response.results.map((item: any) => ({
              title: item.title,
              url: item.url,
              content: item.content || '',
              source: 'searxng' as Engine,
              publishDate: item.publishedDate,
            }));
            resolve(results);
          } else {
            resolve([]);
          }
        } catch (error) {
          console.error('解析SearXNG响应失败:', error);
          resolve([]);
        }
      });
    }).on('error', (error) => {
      console.error('请求SearXNG API失败:', error);
      reject(error);
    });
  });
}