/**
 * GNews API提供商
 * 
 * 功能：
 * - 全球新闻搜索
 * - 多语言支持
 * - 实时新闻
 * - 新闻分类
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface GNewsArticle {
  title: string
  description: string
  content: string
  url: string
  image: string
  publishedAt: string
  source: {
    name: string
    url: string
  }
}

interface GNewsResponse {
  totalArticles: number
  articles: GNewsArticle[]
}

export class GNewsProvider extends BaseAPIProvider {
  name = 'GNews'
  category = 'news' as const
  
  rateLimit = {
    requests: 100,
    period: 'day' as const,
    remaining: 100
  }

  private apiToken: string
  private baseUrl = 'https://gnews.io/api/v4'

  constructor(apiToken: string) {
    super()
    this.apiToken = apiToken
    this.enabled = !!apiToken
  }

  validateConfig(): boolean {
    return !!this.apiToken && this.apiToken.length > 0
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'B' // GNews是可靠的新闻聚合服务
  }

  protected getSourceUrl(): string {
    return 'https://gnews.io/'
  }

  /**
   * 查询新闻情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `GNews查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 搜索新闻
      const articles = await this.searchNews(query, options)
      
      for (const article of articles) {
        results.push(this.convertArticleToDataPoint(article, query))
      }

      // 缓存结果
      this.setCached(cacheKey, results, 900000) // 15分钟缓存

      this.log('info', `查询完成，返回 ${results.length} 条结果`)
      return this.createResponse(true, results)

    } catch (error: any) {
      this.log('error', '查询失败', error.message)
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 搜索新闻
   */
  private async searchNews(query: string, options: QueryOptions): Promise<GNewsArticle[]> {
    const params = new URLSearchParams({
      q: query,
      token: this.apiToken,
      lang: 'en', // 默认英文，可以根据需要调整
      country: 'us', // 默认美国，可以根据需要调整
      max: Math.min(options.maxResults || 10, 10).toString() // GNews免费版限制10条
    })

    // 添加时间范围
    if (options.timeRange) {
      const fromDate = options.timeRange.from.toISOString().split('T')[0]
      const toDate = options.timeRange.to.toISOString().split('T')[0]
      params.append('from', fromDate)
      params.append('to', toDate)
    }

    const url = `${this.baseUrl}/search?${params}`
    const response = await this.makeRequest(url)
    const data: GNewsResponse = await response.json()

    return data.articles || []
  }

  /**
   * 将文章转换为标准数据点
   */
  private convertArticleToDataPoint(article: GNewsArticle, query: string): IntelligenceDataPoint {
    // 分析新闻情绪和重要性
    const sentiment = this.analyzeSentiment(article.title, article.description)
    const importance = this.assessImportance(article, query)

    return this.createDataPoint(
      `gnews-${Buffer.from(article.url).toString('base64').slice(0, 16)}`,
      'news',
      'news_article',
      {
        title: article.title,
        description: article.description,
        indicators: [query],
        url: article.url,
        content: article.content,
        imageUrl: article.image,
        publishedAt: article.publishedAt,
        sourceName: article.source.name,
        sourceUrl: article.source.url,
        sentiment: sentiment,
        importance: importance,
        language: 'en',
        rawData: article
      },
      this.getSeverityFromSentiment(sentiment, importance),
      0.7
    )
  }

  /**
   * 分析新闻情绪
   */
  private analyzeSentiment(title: string, description: string): 'positive' | 'negative' | 'neutral' {
    const text = `${title} ${description}`.toLowerCase()
    
    const positiveWords = [
      'success', 'growth', 'increase', 'rise', 'gain', 'profit', 'win', 'achieve',
      'breakthrough', 'improve', 'boost', 'surge', 'soar', 'rally', 'advance'
    ]
    
    const negativeWords = [
      'crisis', 'crash', 'fall', 'decline', 'loss', 'fail', 'threat', 'risk',
      'attack', 'conflict', 'war', 'violence', 'disaster', 'emergency', 'collapse'
    ]

    let positiveScore = 0
    let negativeScore = 0

    for (const word of positiveWords) {
      if (text.includes(word)) positiveScore++
    }

    for (const word of negativeWords) {
      if (text.includes(word)) negativeScore++
    }

    if (positiveScore > negativeScore) return 'positive'
    if (negativeScore > positiveScore) return 'negative'
    return 'neutral'
  }

  /**
   * 评估新闻重要性
   */
  private assessImportance(article: GNewsArticle, query: string): 'low' | 'medium' | 'high' {
    let score = 0

    // 标题中包含查询词
    if (article.title.toLowerCase().includes(query.toLowerCase())) {
      score += 2
    }

    // 描述中包含查询词
    if (article.description.toLowerCase().includes(query.toLowerCase())) {
      score += 1
    }

    // 知名新闻源
    const majorSources = [
      'Reuters', 'BBC', 'CNN', 'Associated Press', 'Bloomberg', 'Financial Times',
      'Wall Street Journal', 'New York Times', 'Washington Post', 'Guardian'
    ]
    
    if (majorSources.some(source => article.source.name.includes(source))) {
      score += 2
    }

    // 发布时间（越新越重要）
    const publishedTime = new Date(article.publishedAt).getTime()
    const now = Date.now()
    const hoursAgo = (now - publishedTime) / (1000 * 60 * 60)
    
    if (hoursAgo < 1) score += 2
    else if (hoursAgo < 6) score += 1

    if (score >= 4) return 'high'
    if (score >= 2) return 'medium'
    return 'low'
  }

  /**
   * 根据情绪和重要性确定严重程度
   */
  private getSeverityFromSentiment(
    sentiment: 'positive' | 'negative' | 'neutral',
    importance: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (sentiment === 'negative' && importance === 'high') {
      return 'critical'
    }
    if (sentiment === 'negative' && importance === 'medium') {
      return 'high'
    }
    if (importance === 'high') {
      return 'medium'
    }
    return 'low'
  }

  /**
   * 获取头条新闻
   */
  async getTopHeadlines(options: {
    category?: 'general' | 'world' | 'nation' | 'business' | 'technology' | 'entertainment' | 'sports' | 'science' | 'health'
    country?: string
    maxResults?: number
  } = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const params = new URLSearchParams({
        token: this.apiToken,
        lang: 'en',
        country: options.country || 'us',
        max: Math.min(options.maxResults || 10, 10).toString()
      })

      if (options.category) {
        params.append('category', options.category)
      }

      const url = `${this.baseUrl}/top-headlines?${params}`
      const response = await this.makeRequest(url)
      const data: GNewsResponse = await response.json()

      const results: IntelligenceDataPoint[] = []

      for (const article of data.articles || []) {
        results.push(this.convertArticleToDataPoint(article, 'headlines'))
      }

      return this.createResponse(true, results)

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 按类别搜索新闻
   */
  async searchByCategory(
    category: 'general' | 'world' | 'nation' | 'business' | 'technology' | 'entertainment' | 'sports' | 'science' | 'health',
    options: QueryOptions = {}
  ): Promise<APIResponse<IntelligenceDataPoint[]>> {
    return this.getTopHeadlines({
      category,
      maxResults: options.maxResults
    })
  }

  /**
   * 按国家搜索新闻
   */
  async searchByCountry(countryCode: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    return this.getTopHeadlines({
      country: countryCode,
      maxResults: options.maxResults
    })
  }

  /**
   * 多语言新闻搜索
   */
  async searchMultiLanguage(
    query: string,
    languages: string[] = ['en', 'zh', 'es', 'fr'],
    options: QueryOptions = {}
  ): Promise<APIResponse<IntelligenceDataPoint[]>> {
    const allResults: IntelligenceDataPoint[] = []

    for (const lang of languages) {
      try {
        const params = new URLSearchParams({
          q: query,
          token: this.apiToken,
          lang: lang,
          max: Math.min(Math.ceil((options.maxResults || 10) / languages.length), 5).toString()
        })

        const url = `${this.baseUrl}/search?${params}`
        const response = await this.makeRequest(url)
        const data: GNewsResponse = await response.json()

        for (const article of data.articles || []) {
          const dataPoint = this.convertArticleToDataPoint(article, query)
          dataPoint.content.language = lang
          allResults.push(dataPoint)
        }

        // 避免过于频繁的请求
        await this.sleep(200)

      } catch (error: any) {
        this.log('warn', `语言 ${lang} 搜索失败: ${error.message}`)
      }
    }

    return this.createResponse(true, allResults)
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        q: 'test',
        token: this.apiToken,
        lang: 'en',
        max: '1'
      })

      const url = `${this.baseUrl}/search?${params}`
      const response = await this.makeRequest(url)
      
      return response.ok
    } catch (error) {
      return false
    }
  }
}