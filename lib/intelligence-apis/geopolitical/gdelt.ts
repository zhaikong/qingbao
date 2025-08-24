/**
 * GDELT Project API提供商
 * 
 * 功能：
 * - 全球事件监控
 * - 实时新闻分析
 * - 冲突事件追踪
 * - 地缘政治风险评估
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface GDELTArticle {
  url: string
  urltone: number
  domain: string
  urllangcode: string
  title: string
  seendate: string
  socialimage: string
  identifier: string
  language: string
  sourcecountry: string
}

interface GDELTDocResponse {
  articles: GDELTArticle[]
}

interface GDELTEvent {
  GLOBALEVENTID: string
  SQLDATE: string
  MonthYear: string
  Year: string
  FractionDate: number
  Actor1Code: string
  Actor1Name: string
  Actor1CountryCode: string
  Actor2Code: string
  Actor2Name: string
  Actor2CountryCode: string
  IsRootEvent: number
  EventCode: string
  EventBaseCode: string
  EventRootCode: string
  QuadClass: number
  GoldsteinScale: number
  NumMentions: number
  NumSources: number
  NumArticles: number
  AvgTone: number
  Actor1Geo_Type: number
  Actor1Geo_FullName: string
  Actor1Geo_CountryCode: string
  Actor1Geo_ADM1Code: string
  Actor1Geo_Lat: number
  Actor1Geo_Long: number
  Actor2Geo_Type: number
  Actor2Geo_FullName: string
  Actor2Geo_CountryCode: string
  Actor2Geo_ADM1Code: string
  Actor2Geo_Lat: number
  Actor2Geo_Long: number
  ActionGeo_Type: number
  ActionGeo_FullName: string
  ActionGeo_CountryCode: string
  ActionGeo_ADM1Code: string
  ActionGeo_Lat: number
  ActionGeo_Long: number
  DATEADDED: string
  SOURCEURL: string
}

export class GDELTProvider extends BaseAPIProvider {
  name = 'GDELT Project'
  category = 'geopolitical' as const
  
  rateLimit = {
    requests: 1000,
    period: 'hour' as const,
    remaining: 1000
  }

  private baseUrl = 'https://api.gdeltproject.org/api/v2'

  constructor() {
    super()
    this.enabled = true // GDELT是免费的，无需API密钥
  }

  validateConfig(): boolean {
    return true // 无需配置
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // GDELT是权威的全球事件数据库
  }

  protected getSourceUrl(): string {
    return 'https://www.gdeltproject.org/'
  }

  /**
   * 查询地缘政治情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `GDELT查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 查询文档/新闻
      const docResults = await this.queryDocuments(query, options)
      results.push(...docResults)

      // 查询事件数据
      const eventResults = await this.queryEvents(query, options)
      results.push(...eventResults)

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
   * 查询文档/新闻
   */
  private async queryDocuments(query: string, options: QueryOptions): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/doc/doc`
    const params = new URLSearchParams({
      query: query,
      mode: 'artlist',
      maxrecords: Math.min(options.maxResults || 50, 250).toString(),
      format: 'json',
      sort: 'datedesc'
    })

    // 添加时间范围过滤
    if (options.timeRange) {
      const startDate = options.timeRange.from.toISOString().split('T')[0].replace(/-/g, '')
      const endDate = options.timeRange.to.toISOString().split('T')[0].replace(/-/g, '')
      params.append('startdatetime', startDate + '000000')
      params.append('enddatetime', endDate + '235959')
    }

    try {
      const response = await this.makeRequest(`${url}?${params}`)
      const data: GDELTDocResponse = await response.json()

      const results: IntelligenceDataPoint[] = []

      if (data.articles) {
        for (const article of data.articles.slice(0, options.maxResults || 20)) {
          const tone = article.urltone
          let severity: 'low' | 'medium' | 'high' | 'critical'
          
          // 基于语调评分确定严重程度
          if (tone < -5) {
            severity = 'critical'
          } else if (tone < -2) {
            severity = 'high'
          } else if (tone < 0) {
            severity = 'medium'
          } else {
            severity = 'low'
          }

          results.push(this.createDataPoint(
            `gdelt-doc-${article.identifier}`,
            'geopolitical',
            'news_analysis',
            {
              title: article.title,
              description: `来源: ${article.domain} | 语调: ${tone.toFixed(2)} | 语言: ${article.language}`,
              indicators: [query],
              location: article.sourcecountry,
              url: article.url,
              tone: tone,
              domain: article.domain,
              language: article.language,
              seenDate: article.seendate,
              socialImage: article.socialimage
            },
            severity,
            Math.abs(tone) > 2 ? 0.8 : 0.6
          ))
        }
      }

      return results

    } catch (error: any) {
      this.log('warn', `文档查询失败: ${error.message}`)
      return []
    }
  }

  /**
   * 查询事件数据
   */
  private async queryEvents(query: string, options: QueryOptions): Promise<IntelligenceDataPoint[]> {
    // GDELT事件查询相对复杂，这里实现基础版本
    // 实际应用中可能需要更复杂的查询逻辑
    
    try {
      // 使用TV API作为事件数据的替代
      const url = `${this.baseUrl}/tv/tv`
      const params = new URLSearchParams({
        query: query,
        mode: 'clipgallery',
        maxrecords: Math.min(options.maxResults || 20, 100).toString(),
        format: 'json'
      })

      const response = await this.makeRequest(`${url}?${params}`)
      const data = await response.json()

      const results: IntelligenceDataPoint[] = []

      if (data.clips) {
        for (const clip of data.clips.slice(0, 10)) {
          results.push(this.createDataPoint(
            `gdelt-tv-${clip.id || Math.random().toString(36).substr(2, 9)}`,
            'geopolitical',
            'media_coverage',
            {
              title: `电视新闻报道: ${query}`,
              description: `频道: ${clip.station} | 时间: ${clip.date}`,
              indicators: [query],
              station: clip.station,
              date: clip.date,
              preview_url: clip.preview_url
            },
            'medium',
            0.7
          ))
        }
      }

      return results

    } catch (error: any) {
      this.log('warn', `事件查询失败: ${error.message}`)
      return []
    }
  }

  /**
   * 查询特定国家的事件
   */
  async queryCountryEvents(countryCode: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    const query = `country:${countryCode}`
    return this.query(query, options)
  }

  /**
   * 查询冲突事件
   */
  async queryConflictEvents(region: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    const conflictKeywords = ['conflict', 'war', 'violence', 'attack', 'terrorism', 'protest']
    const query = `${region} (${conflictKeywords.join(' OR ')})`
    return this.query(query, options)
  }

  /**
   * 查询政治事件
   */
  async queryPoliticalEvents(country: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    const politicalKeywords = ['election', 'government', 'policy', 'diplomatic', 'summit', 'treaty']
    const query = `${country} (${politicalKeywords.join(' OR ')})`
    return this.query(query, options)
  }

  /**
   * 获取全球热点事件
   */
  async getGlobalHotspots(options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    const hotspotKeywords = ['crisis', 'emergency', 'breaking', 'urgent', 'alert']
    const query = hotspotKeywords.join(' OR ')
    return this.query(query, { ...options, maxResults: 30 })
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/doc/doc`
      const params = new URLSearchParams({
        query: 'test',
        mode: 'artlist',
        maxrecords: '1',
        format: 'json'
      })

      const response = await this.makeRequest(`${url}?${params}`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}