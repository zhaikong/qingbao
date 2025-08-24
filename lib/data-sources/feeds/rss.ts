import { FeedSource, FeedItem, FeedSourceStatus } from './types';
import { fetchWithAxios } from '../../axios-network-utils';

/**
 * RSS 信源处理器
 */
export class RSSFeedHandler {
  private cache: Map<string, { items: FeedItem[]; lastUpdate: Date }> = new Map();

  /**
   * 获取 RSS 信源的项目
   */
  async fetchItems(
    source: FeedSource, 
    query?: string, 
    options: { limit: number } = { limit: 10 }
  ): Promise<FeedItem[]> {
    if (!source.url) {
      throw new Error(`RSS 源 ${source.name} 缺少 URL`);
    }

    console.log(`[RSSFeedHandler] 获取 RSS: ${source.url}`);

    try {
      // 检查缓存
      const cached = this.cache.get(source.id);
      const now = new Date();
      
      if (cached && (now.getTime() - cached.lastUpdate.getTime()) < 5 * 60 * 1000) {
        console.log(`[RSSFeedHandler] 使用缓存数据: ${source.name}`);
        return this.filterItems(cached.items, query, options.limit);
      }

      // 获取 RSS 数据，带重试机制
      const maxRetries = 2;
      const timeout = 60000; // 60秒超时，避免AbortError
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[RSSFeedHandler] 尝试获取 RSS (${attempt}/${maxRetries}): ${source.name}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetchWithAxios(source.url, {
            headers: {
              'Accept': 'application/rss+xml, application/xml, text/xml, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache'
            }
          });

          const xmlText = await response.text();
          const items = await this.parseRSS(xmlText, source);

          // 更新缓存
          this.cache.set(source.id, {
            items,
            lastUpdate: now
          });

          console.log(`[RSSFeedHandler] RSS 获取成功: ${source.name}, ${items.length} 条项目`);
          return this.filterItems(items, query, options.limit);
          
        } catch (error) {
          console.error(`[RSSFeedHandler] RSS 获取失败 (尝试 ${attempt}/${maxRetries}) ${source.url}:`, error);
          
          if (attempt === maxRetries) {
            // 最后一次尝试失败，检查是否有缓存
            const cached = this.cache.get(source.id);
            if (cached) {
              console.log(`[RSSFeedHandler] 使用过期缓存数据: ${source.name}`);
              return this.filterItems(cached.items, query, options.limit);
            }
            
            // 没有缓存，返回空结果而不是抛出错误
            console.warn(`[RSSFeedHandler] RSS 源 ${source.name} 完全失败，返回空结果`);
            return [];
          }
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      
      return [];
    } catch (error) {
      console.error(`[RSSFeedHandler] RSS 处理异常 ${source.url}:`, error);
      
      // 如果有缓存数据，返回缓存
      const cached = this.cache.get(source.id);
      if (cached) {
        console.log(`[RSSFeedHandler] 使用过期缓存数据: ${source.name}`);
        return this.filterItems(cached.items, query, options.limit);
      }
      
      return [];
    }
  }

  /**
   * 解析 RSS XML
   */
  private async parseRSS(xmlText: string, source: FeedSource): Promise<FeedItem[]> {
    // 简单的 XML 解析（生产环境建议使用专业的 XML 解析库）
    const items: FeedItem[] = [];
    
    try {
      // 提取 <item> 标签内容 - 改进正则表达式
      let itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
      
      // 如果没找到<item>，尝试查找<entry>（Atom格式）
      if (!itemMatches) {
        itemMatches = xmlText.match(/<entry[^>]*>([\s\S]*?)<\/entry>/gi);
        console.log(`[RSSFeedHandler] 尝试Atom格式解析: ${source.name}`);
      }
      
      if (!itemMatches) {
        console.warn(`[RSSFeedHandler] 未找到 RSS/Atom 项目: ${source.name}`);
        console.log(`[RSSFeedHandler] XML内容预览: ${xmlText.substring(0, 500)}...`);
        return [];
      }

      for (const itemXml of itemMatches) {
        try {
          const item = this.parseRSSItem(itemXml, source);
          if (item) {
            items.push(item);
          }
        } catch (error) {
          console.warn(`[RSSFeedHandler] 解析 RSS 项目失败:`, error);
        }
      }

      console.log(`[RSSFeedHandler] 解析到 ${items.length} 个项目: ${source.name}`);
      return items;
    } catch (error) {
      console.error(`[RSSFeedHandler] 解析 RSS XML 失败:`, error);
      return [];
    }
  }

  /**
   * 解析单个 RSS 项目
   */
  private parseRSSItem(itemXml: string, source: FeedSource): FeedItem | null {
    try {
      const title = this.extractXmlContent(itemXml, 'title');
      const link = this.extractXmlContent(itemXml, 'link');
      const description = this.extractXmlContent(itemXml, 'description');
      const pubDate = this.extractXmlContent(itemXml, 'pubDate');
      const author = this.extractXmlContent(itemXml, 'author') || 
                    this.extractXmlContent(itemXml, 'dc:creator');
      const category = this.extractXmlContent(itemXml, 'category');

      if (!title || !link) {
        return null;
      }

      // 清理 HTML 标签
      const cleanDescription = this.stripHtml(description || '');
      
      return {
        id: `rss-${source.id}-${this.generateId(link)}`,
        title: this.stripHtml(title),
        content: cleanDescription,
        url: link,
        publishedAt: this.parseDate(pubDate) || new Date().toISOString(),
        author: author ? this.stripHtml(author) : undefined,
        category: category ? this.stripHtml(category) : source.category,
        tags: this.extractTags(title + ' ' + cleanDescription),
        source: {
          id: source.id,
          name: source.name,
          type: source.type
        },
        metadata: {
          rssSource: source.url,
          originalPubDate: pubDate
        }
      };
    } catch (error) {
      console.warn(`[RSSFeedHandler] 解析 RSS 项目失败:`, error);
      return null;
    }
  }

  /**
   * 从 XML 中提取标签内容
   */
  private extractXmlContent(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * 清理 HTML 标签
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/&nbsp;/g, ' ') // 替换 &nbsp;
      .replace(/&amp;/g, '&') // 替换 &amp;
      .replace(/&lt;/g, '<') // 替换 &lt;
      .replace(/&gt;/g, '>') // 替换 &gt;
      .replace(/&quot;/g, '"') // 替换 &quot;
      .replace(/&#39;/g, "'") // 替换 &#39;
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
  }

  /**
   * 解析日期
   */
  private parseDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * 生成简单的 ID
   */
  private generateId(url: string): string {
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为 32 位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 提取标签
   */
  private extractTags(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && word.length < 15);
    
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
  }

  /**
   * 过滤项目
   */
  private filterItems(items: FeedItem[], query?: string, limit: number = 10): FeedItem[] {
    let filtered = [...items];

    // 关键词过滤
    if (query) {
      const keywords = query.toLowerCase().split(/\s+/);
      filtered = filtered.filter(item => {
        const searchText = (item.title + ' ' + item.content).toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      });
    }

    // 按发布时间排序
    filtered.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return filtered.slice(0, limit);
  }

  /**
   * 刷新源
   */
  async refresh(source: FeedSource): Promise<void> {
    // 清除缓存，强制重新获取
    this.cache.delete(source.id);
    await this.fetchItems(source, undefined, { limit: 50 });
  }

  /**
   * 获取源状态
   */
  async getStatus(source: FeedSource): Promise<FeedSourceStatus> {
    try {
      const items = await this.fetchItems(source, undefined, { limit: 1 });
      const cached = this.cache.get(source.id);
      
      return {
        id: source.id,
        available: true,
        lastUpdate: cached?.lastUpdate,
        itemCount: cached?.items.length || 0
      };
    } catch (error) {
      return {
        id: source.id,
        available: false,
        lastError: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
}