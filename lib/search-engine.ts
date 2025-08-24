// 搜索引擎集成服务
import { firecrawlClient } from './firecrawl-client'
import DataCollectionService from '../core/services/DataCollectionService.ts';

export interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
  source: string
  publishDate?: string
  relevanceScore: number
  metadata?: Record<string, any>
}

export interface NewsSource {
  name: string
  domain: string
  category: string
  language: string
  reliability: number // 1-10 可信度评分
}

// 全球优质信源配置
export const GLOBAL_NEWS_SOURCES: NewsSource[] = [
  // 国际主流媒体
  { name: 'BBC News', domain: 'bbc.com', category: 'international', language: 'en', reliability: 9 },
  { name: 'CNN', domain: 'cnn.com', category: 'international', language: 'en', reliability: 8 },
  { name: 'Reuters', domain: 'reuters.com', category: 'international', language: 'en', reliability: 9 },
  { name: 'Associated Press', domain: 'apnews.com', category: 'international', language: 'en', reliability: 9 },
  { name: 'The Guardian', domain: 'theguardian.com', category: 'international', language: 'en', reliability: 8 },
  { name: 'Financial Times', domain: 'ft.com', category: 'finance', language: 'en', reliability: 9 },
  { name: 'Wall Street Journal', domain: 'wsj.com', category: 'finance', language: 'en', reliability: 9 },
  
  // 中文媒体
  { name: '新华网', domain: 'xinhuanet.com', category: 'official', language: 'zh', reliability: 8 },
  { name: '人民网', domain: 'people.com.cn', category: 'official', language: 'zh', reliability: 8 },
  { name: '央视网', domain: 'cctv.com', category: 'official', language: 'zh', reliability: 8 },
  { name: '澎湃新闻', domain: 'thepaper.cn', category: 'news', language: 'zh', reliability: 7 },
  { name: '财新网', domain: 'caixin.com', category: 'finance', language: 'zh', reliability: 8 },
  
  // 专业机构
  { name: 'Nature', domain: 'nature.com', category: 'academic', language: 'en', reliability: 10 },
  { name: 'Science', domain: 'science.org', category: 'academic', language: 'en', reliability: 10 },
  { name: 'MIT Technology Review', domain: 'technologyreview.com', category: 'tech', language: 'en', reliability: 9 },
  { name: 'Harvard Business Review', domain: 'hbr.org', category: 'business', language: 'en', reliability: 9 },
  
  // 地区媒体
  { name: 'South China Morning Post', domain: 'scmp.com', category: 'regional', language: 'en', reliability: 8 },
  { name: 'Japan Times', domain: 'japantimes.co.jp', category: 'regional', language: 'en', reliability: 7 },
  { name: 'Times of India', domain: 'timesofindia.indiatimes.com', category: 'regional', language: 'en', reliability: 7 },
]

export class SearchEngineService {
  private firecrawl: any

  constructor() {
    this.firecrawl = firecrawlClient
  }

  /**
   * 综合搜索 - 优先使用真实数据源，Firecrawl作为备用
   */
  async comprehensiveSearch(
    query: string, 
    options: {
      maxResults?: number
      timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
      sources?: string[]
      language?: 'zh' | 'en' | 'all'
      includeContent?: boolean
      useRealDataSources?: boolean
    } = {}
  ): Promise<SearchResult[]> {
    const {
      maxResults = 20,
      timeRange = 'month',
      sources = [],
      language = 'all',
      includeContent = true,
      useRealDataSources = true
    } = options

    try {
      // 优先使用真实数据源（通过新的DataCollectionService）
      if (useRealDataSources) {
        console.log('🚀 Using new DataCollectionService for comprehensive search');
        
        const availableSources = await DataCollectionService.getAvailableSources();
        // We can filter sources here if needed, for now, use all available.
        const realResults = await DataCollectionService.collectData(query, availableSources);
        
        if (realResults.length > 0) {
          console.log(`✅ New DataCollectionService search successful, found ${realResults.length} results.`);
          return realResults;
        } else {
          console.warn('⚠️ New DataCollectionService returned no results, falling back to Firecrawl.');
        }
      }

      // 备用方案：使用Firecrawl搜索
      console.log('🔄 使用Firecrawl备用搜索')
      
      // 构建搜索查询
      let searchQuery = query
      
      // 添加时间限制
      if (timeRange !== 'all') {
        const timeFilters = {
          'day': 'past 24 hours',
          'week': 'past week', 
          'month': 'past month',
          'year': 'past year'
        }
        searchQuery += ` ${timeFilters[timeRange]}`
      }

      // 添加信源限制
      if (sources.length > 0) {
        const siteFilter = sources.map(source => `site:${source}`).join(' OR ')
        searchQuery += ` (${siteFilter})`
      }

      // 使用Firecrawl进行搜索
      const searchResults = await this.firecrawl.search({
        query: searchQuery,
        limit: maxResults,
        lang: language === 'zh' ? 'zh' : language === 'en' ? 'en' : undefined,
        scrapeOptions: includeContent ? {
          formats: ['markdown'],
          onlyMainContent: true
        } : undefined
      })

      // 处理搜索结果
      const results: SearchResult[] = []
      
      for (const result of searchResults.data || []) {
        const domain = new URL(result.url).hostname
        const source = this.getSourceInfo(domain)
        
        results.push({
          title: result.title || '',
          url: result.url,
          snippet: result.description || '',
          content: result.markdown || undefined,
          source: source?.name || domain,
          publishDate: result.publishedDate,
          relevanceScore: this.calculateRelevanceScore(result, query, source)
        })
      }

      // 按相关性排序
      const sortedResults = results.sort((a, b) => b.relevanceScore - a.relevanceScore)
      console.log(`✅ Firecrawl搜索完成，获得 ${sortedResults.length} 条结果`)
      
      return sortedResults

    } catch (error: any) {
      console.error('❌ 综合搜索失败:', error)
      throw new Error(`搜索服务暂时不可用: ${error?.message || '未知错误'}`)
    }
  }

  /**
   * 新闻搜索 - 专门搜索新闻内容
   */
  async searchNews(
    query: string,
    options: {
      maxResults?: number
      timeRange?: 'day' | 'week' | 'month'
      category?: string
      language?: 'zh' | 'en' | 'all'
    } = {}
  ): Promise<SearchResult[]> {
    const { category = 'all', ...searchOptions } = options
    
    // 筛选新闻源
    let newsSources = GLOBAL_NEWS_SOURCES
    if (category !== 'all') {
      newsSources = newsSources.filter(source => source.category === category)
    }
    
    const domains = newsSources.map(source => source.domain)
    
    return this.comprehensiveSearch(query, {
      ...searchOptions,
      sources: domains
    })
  }

  /**
   * 学术搜索 - 搜索学术论文和研究报告
   */
  async searchAcademic(
    query: string,
    options: {
      maxResults?: number
      timeRange?: 'month' | 'year' | 'all'
    } = {}
  ): Promise<SearchResult[]> {
    const academicSources = GLOBAL_NEWS_SOURCES
      .filter(source => source.category === 'academic')
      .map(source => source.domain)
    
    // 添加更多学术搜索源
    academicSources.push(
      'arxiv.org',
      'scholar.google.com',
      'researchgate.net',
      'ieee.org',
      'acm.org'
    )

    return this.comprehensiveSearch(`${query} research paper study`, {
      ...options,
      sources: academicSources
    })
  }

  /**
   * 深度研究 - 使用Firecrawl的深度研究功能
   */
  async deepResearch(
    query: string,
    options: {
      maxDepth?: number
      timeLimit?: number
      maxUrls?: number
    } = {}
  ): Promise<{
    analysis: string
    sources: SearchResult[]
    activities: any[]
  }> {
    const {
      maxDepth = 3,
      timeLimit = 120,
      maxUrls = 50
    } = options

    try {
      const result = await this.firecrawl.deepResearch({
        query,
        maxDepth,
        timeLimit,
        maxUrls
      })

      return {
        analysis: result.data?.finalAnalysis || '',
        sources: result.data?.sources?.map((source: any) => ({
          title: source.title || '',
          url: source.url,
          snippet: source.description || '',
          content: source.content || '',
          source: this.getSourceInfo(new URL(source.url).hostname)?.name || source.url,
          relevanceScore: source.relevanceScore || 0.5
        })) || [],
        activities: result.data?.activities || []
      }
    } catch (error: any) {
      console.error('深度研究失败:', error)
      throw new Error(`深度研究服务暂时不可用: ${error?.message || '未知错误'}`)
    }
  }

  /**
   * 获取信源信息
   */
  private getSourceInfo(domain: string): NewsSource | undefined {
    return GLOBAL_NEWS_SOURCES.find(source => 
      domain.includes(source.domain) || source.domain.includes(domain)
    )
  }

  /**
   * 计算相关性评分
   */
  private calculateRelevanceScore(
    result: any, 
    query: string, 
    source?: NewsSource
  ): number {
    let score = 0.5 // 基础分数

    // 标题匹配度
    if (result.title) {
      const titleMatch = this.calculateTextMatch(result.title.toLowerCase(), query.toLowerCase())
      score += titleMatch * 0.3
    }

    // 描述匹配度
    if (result.description) {
      const descMatch = this.calculateTextMatch(result.description.toLowerCase(), query.toLowerCase())
      score += descMatch * 0.2
    }

    // 信源可信度
    if (source) {
      score += (source.reliability / 10) * 0.2
    }

    // 发布时间新鲜度
    if (result.publishedDate) {
      const publishDate = new Date(result.publishedDate)
      const now = new Date()
      const daysDiff = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff <= 1) score += 0.2
      else if (daysDiff <= 7) score += 0.1
      else if (daysDiff <= 30) score += 0.05
    }

    return Math.min(score, 1.0)
  }

  /**
   * 计算文本匹配度
   */
  private calculateTextMatch(text: string, query: string): number {
    const queryWords = query.split(' ').filter(word => word.length > 2)
    const textWords = text.split(' ')
    
    let matches = 0
    for (const queryWord of queryWords) {
      if (textWords.some(textWord => textWord.includes(queryWord))) {
        matches++
      }
    }
    
    return queryWords.length > 0 ? matches / queryWords.length : 0
  }

  /**
   * 获取推荐信源
   */
  getRecommendedSources(category?: string, language?: string): NewsSource[] {
    let sources = GLOBAL_NEWS_SOURCES

    if (category) {
      sources = sources.filter(source => source.category === category)
    }

    if (language) {
      sources = sources.filter(source => source.language === language)
    }

    return sources.sort((a, b) => b.reliability - a.reliability)
  }
}

// 导出单例实例
export const searchEngineService = new SearchEngineService()

// 导出便捷函数
export const searchWeb = searchEngineService.comprehensiveSearch.bind(searchEngineService)
export const searchNews = searchEngineService.searchNews.bind(searchEngineService)
export const searchAcademic = searchEngineService.searchAcademic.bind(searchEngineService)
export const deepResearch = searchEngineService.deepResearch.bind(searchEngineService)
