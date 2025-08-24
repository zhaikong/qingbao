/**
 * ACLED (Armed Conflict Location & Event Data) API提供商
 * 
 * 功能：
 * - 武装冲突数据
 * - 政治暴力事件
 * - 抗议活动监控
 * - 地区稳定性分析
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface ACLEDAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ACLEDEvent {
  data_date: string
  iso: string
  event_id_cnty: string
  event_id_no_cnty: string
  event_date: string
  year: number
  time_precision: string
  event_type: string
  sub_event_type: string
  actor1: string
  assoc_actor_1: string
  inter1: number
  actor2: string
  assoc_actor_2: string
  inter2: number
  interaction: number
  region: string
  country: string
  admin1: string
  admin2: string
  admin3: string
  location: string
  latitude: number
  longitude: number
  geo_precision: string
  source: string
  source_scale: string
  notes: string
  fatalities: number
  timestamp: number
  iso3: string
}

interface ACLEDResponse {
  count: number
  next: string | null
  previous: string | null
  results: ACLEDEvent[]
}

export class ACLEDProvider extends BaseAPIProvider {
  name = 'ACLED'
  category = 'geopolitical' as const
  
  rateLimit = {
    requests: 100,
    period: 'hour' as const,
    remaining: 100
  }

  private email: string
  private password: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private baseUrl = 'https://acleddata.com'

  constructor(email: string, password: string) {
    super()
    this.email = email
    this.password = password
    this.enabled = !!(email && password)
  }

  validateConfig(): boolean {
    return !!(this.email && this.password)
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // ACLED是权威的冲突数据源
  }

  protected getSourceUrl(): string {
    return 'https://acleddata.com/'
  }

  /**
   * 简化认证 - 直接使用邮箱密码进行基础认证
   */
  private async authenticate(): Promise<boolean> {
    try {
      // 检查现有token是否仍然有效
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return true
      }

      this.log('info', '正在进行ACLED认证...')

      // 尝试直接访问API来验证认证
      const testResponse = await fetch(`${this.baseUrl}/api/acled/read?limit=1&format=json`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.email}:${this.password}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      })

      if (testResponse.ok) {
        this.log('info', 'ACLED基础认证成功')
        this.accessToken = 'basic-auth' // 标记认证成功
        this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000) // 24小时有效
        return true
      } else {
        throw new Error(`认证失败: ${testResponse.status} ${testResponse.statusText}`)
      }

    } catch (error: any) {
      this.log('error', 'ACLED认证失败', error.message)
      this.accessToken = null
      this.tokenExpiry = 0
      return false
    }
  }

  /**
   * 查询冲突情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `ACLED查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      // 认证
      const authenticated = await this.authenticate()
      if (!authenticated) {
        return this.createResponse(false, undefined, 'ACLED认证失败')
      }

      const results: IntelligenceDataPoint[] = []

      // 构建查询参数
      const queryParams = this.buildQueryParams(query, options)
      const events = await this.queryEvents(queryParams)
      
      for (const event of events) {
        results.push(this.convertEventToDataPoint(event))
      }

      // 缓存结果
      this.setCached(cacheKey, results, 1800000) // 30分钟缓存

      this.log('info', `查询完成，返回 ${results.length} 条结果`)
      return this.createResponse(true, results)

    } catch (error: any) {
      this.log('error', '查询失败', error.message)
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 构建查询参数
   */
  private buildQueryParams(query: string, options: QueryOptions): URLSearchParams {
    const params = new URLSearchParams()
    
    // 基础参数
    params.append('limit', Math.min(options.maxResults || 50, 500).toString())
    params.append('format', 'json')

    // 时间范围
    if (options.timeRange) {
      const startDate = options.timeRange.from.toISOString().split('T')[0]
      const endDate = options.timeRange.to.toISOString().split('T')[0]
      params.append('event_date', `${startDate}|${endDate}`)
    } else {
      // 默认查询最近30天
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      params.append('event_date', `${startDate}|${endDate}`)
    }

    // 地理过滤
    if (options.geoFilter && options.geoFilter.length > 0) {
      params.append('country', options.geoFilter.join('|'))
    }

    // 如果查询看起来像国家名，添加到国家过滤
    if (this.looksLikeCountryName(query)) {
      params.append('country', query)
    } else {
      // 否则在notes字段中搜索
      params.append('terms', query)
    }

    return params
  }

  /**
   * 判断查询是否像国家名
   */
  private looksLikeCountryName(query: string): boolean {
    const countryNames = [
      'china', 'usa', 'russia', 'ukraine', 'syria', 'afghanistan', 'iraq', 'iran',
      'israel', 'palestine', 'india', 'pakistan', 'myanmar', 'yemen', 'libya',
      'somalia', 'nigeria', 'mali', 'sudan', 'ethiopia'
    ]
    
    return countryNames.some(country => 
      query.toLowerCase().includes(country) || country.includes(query.toLowerCase())
    )
  }

  /**
   * 查询事件数据
   */
  private async queryEvents(params: URLSearchParams): Promise<ACLEDEvent[]> {
    const url = `${this.baseUrl}/api/acled/read?${params}`

    const response = await this.makeRequest(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.email}:${this.password}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    })

    const data: ACLEDResponse = await response.json()
    return data.results || []
  }

  /**
   * 将ACLED事件转换为标准数据点
   */
  private convertEventToDataPoint(event: ACLEDEvent): IntelligenceDataPoint {
    // 根据事件类型和伤亡人数确定严重程度
    let severity: 'low' | 'medium' | 'high' | 'critical'
    
    if (event.fatalities >= 50) {
      severity = 'critical'
    } else if (event.fatalities >= 10 || event.event_type === 'Violence against civilians') {
      severity = 'high'
    } else if (event.fatalities > 0 || event.event_type === 'Battles') {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    // 计算置信度
    const confidence = this.calculateEventConfidence(event)

    return this.createDataPoint(
      `acled-${event.event_id_cnty}`,
      'geopolitical',
      'conflict_event',
      {
        title: `${event.event_type}: ${event.location}, ${event.country}`,
        description: `${event.sub_event_type} | 伤亡: ${event.fatalities} | 参与者: ${event.actor1}${event.actor2 ? ` vs ${event.actor2}` : ''}`,
        indicators: [event.location, event.country, event.actor1, event.actor2].filter(Boolean),
        location: `${event.location}, ${event.admin1}, ${event.country}`,
        eventType: event.event_type,
        subEventType: event.sub_event_type,
        fatalities: event.fatalities,
        eventDate: event.event_date,
        actors: [event.actor1, event.actor2].filter(Boolean),
        coordinates: [event.latitude, event.longitude],
        source: event.source,
        notes: event.notes,
        rawData: event
      },
      severity,
      confidence
    )
  }

  /**
   * 计算事件置信度
   */
  private calculateEventConfidence(event: ACLEDEvent): number {
    let confidence = 0.7 // 基础置信度

    // 基于数据精度调整
    if (event.geo_precision === 'Exact') {
      confidence += 0.1
    } else if (event.geo_precision === 'Near') {
      confidence += 0.05
    }

    // 基于时间精度调整
    if (event.time_precision === 'Exact') {
      confidence += 0.1
    }

    // 基于来源规模调整
    if (event.source_scale === 'National') {
      confidence += 0.05
    } else if (event.source_scale === 'International') {
      confidence += 0.1
    }

    return Math.min(0.95, confidence)
  }

  /**
   * 查询特定国家的冲突事件
   */
  async queryCountryConflicts(country: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    return this.query(country, {
      ...options,
      geoFilter: [country]
    })
  }

  /**
   * 查询高伤亡事件
   */
  async queryHighCasualtyEvents(options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    const authenticated = await this.authenticate()
    if (!authenticated) {
      return this.createResponse(false, undefined, 'ACLED认证失败')
    }

    try {
      const params = new URLSearchParams()
      params.append('fatalities', '10|')  // 10人以上伤亡
      params.append('limit', '50')
      params.append('format', 'json')

      const events = await this.queryEvents(params)
      const results = events.map(event => this.convertEventToDataPoint(event))

      return this.createResponse(true, results)

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        return false
      }

      // 执行简单查询测试
      const params = new URLSearchParams()
      params.append('limit', '1')
      params.append('format', 'json')

      const response = await this.makeRequest(`${this.baseUrl}/api/acled/read?${params}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.email}:${this.password}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      return false
    }
  }
}