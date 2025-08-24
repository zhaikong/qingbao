/**
 * 地缘政治情报数据源实现
 * 
 * 支持的服务：
 * 1. GDELT Project - 全球事件数据库
 * 2. ACLED - 武装冲突位置和事件数据
 * 3. REST Countries API - 国家基础信息
 * 4. World Bank Open Data - 经济和发展数据
 */

import { BaseOSINTProvider, OSINTDataPoint, createOSINTDataPoint, OSINTApiConfig } from './osint-framework'

/**
 * GDELT项目提供商
 */
export class GDELTProvider extends BaseOSINTProvider {
  constructor() {
    const config: OSINTApiConfig = {
      name: 'GDELT Project',
      endpoint: 'http://api.gdeltproject.org/api/v2',
      rateLimit: { requests: 1, period: 2000 }, // 保守限制
      quota: { daily: 10000 }, // 理论上无限制，但设置合理限制
      category: 'geopolitics',
      priority: 10,
      enabled: true,
      tier: 'free',
      timeout: 30000
    }
    super(config)
  }

  async query(query: string, options?: {
    mode?: 'artlist' | 'timeline' | 'tonechart'
    timeRange?: { from: Date; to: Date }
    maxRecords?: number
    theme?: string
    geo?: string
  }): Promise<OSINTDataPoint[]> {
    await this.checkRateLimit()

    const {
      mode = 'artlist',
      maxRecords = 250,
      timeRange,
      theme,
      geo
    } = options || {}

    const params = new URLSearchParams({
      query: query,
      mode: mode,
      maxrecords: maxRecords.toString(),
      format: 'json'
    })

    // 添加时间范围
    if (timeRange) {
      const startDate = timeRange.from.toISOString().split('T')[0].replace(/-/g, '')
      const endDate = timeRange.to.toISOString().split('T')[0].replace(/-/g, '')
      params.append('startdatetime', startDate + '000000')
      params.append('enddatetime', endDate + '235959')
    }

    // 添加主题过滤
    if (theme) {
      params.append('theme', theme)
    }

    // 添加地理过滤
    if (geo) {
      params.append('geo', geo)
    }

    try {
      const response = await fetch(`${this.config.endpoint}/doc/doc?${params}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`GDELT API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, query)

    } catch (error: any) {
      console.error('GDELT query failed:', error)
      throw new Error(`GDELT query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, query: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.articles && Array.isArray(rawData.articles)) {
      rawData.articles.forEach((article: any) => {
        const confidence = this.calculateConfidence(article)
        const severity = this.calculateSeverity(article)

        results.push(createOSINTDataPoint(
          'GDELT Project',
          'geopolitics',
          'global_event',
          {
            title: article.title,
            url: article.url,
            domain: article.domain,
            language: article.language,
            seendate: article.seendate,
            socialimage: article.socialimage,
            tone: article.tone,
            themes: article.themes?.split(';') || [],
            locations: article.locations?.split(';') || [],
            persons: article.persons?.split(';') || [],
            organizations: article.organizations?.split(';') || [],
            quotations: article.quotations ? article.quotations.split('|') : []
          },
          confidence,
          severity
        ))
      })
    }

    return results
  }

  /**
   * 查询TV新闻数据
   */
  async queryTVNews(query: string, options?: {
    mode?: 'clipgallery' | 'timeline'
    market?: string
    timeRange?: { from: Date; to: Date }
  }): Promise<OSINTDataPoint[]> {
    await this.checkRateLimit()

    const { mode = 'clipgallery', market = 'National', timeRange } = options || {}

    const params = new URLSearchParams({
      query: query,
      mode: mode,
      format: 'json',
      market: market
    })

    if (timeRange) {
      const startDate = timeRange.from.toISOString().split('T')[0].replace(/-/g, '')
      const endDate = timeRange.to.toISOString().split('T')[0].replace(/-/g, '')
      params.append('startdatetime', startDate + '000000')
      params.append('enddatetime', endDate + '235959')
    }

    try {
      const response = await fetch(`${this.config.endpoint}/tv/tv?${params}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`GDELT TV API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeTVData(data, query)

    } catch (error: any) {
      console.error('GDELT TV query failed:', error)
      throw new Error(`GDELT TV query failed: ${error.message}`)
    }
  }

  private normalizeTVData(rawData: any, query: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.clips && Array.isArray(rawData.clips)) {
      rawData.clips.forEach((clip: any) => {
        results.push(createOSINTDataPoint(
          'GDELT TV',
          'geopolitics',
          'tv_news_clip',
          {
            title: clip.title,
            station: clip.station,
            date: clip.date,
            url: clip.url,
            preview_url: clip.preview_url,
            snippet: clip.snippet,
            show: clip.show
          },
          0.7
        ))
      })
    }

    return results
  }

  private calculateConfidence(article: any): number {
    let confidence = 0.5

    // 基于数据完整性
    if (article.title && article.title.length > 20) confidence += 0.1
    if (article.tone && parseFloat(article.tone) !== 0) confidence += 0.1
    if (article.themes && article.themes.split(';').length > 1) confidence += 0.1
    if (article.locations && article.locations.split(';').length > 0) confidence += 0.1
    if (article.language === 'ENGLISH') confidence += 0.1

    // 基于来源域名
    const domain = article.domain?.toLowerCase() || ''
    if (domain.includes('reuters') || domain.includes('bbc') || domain.includes('ap.org')) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  private calculateSeverity(article: any): 'low' | 'medium' | 'high' | 'critical' {
    const themes = article.themes?.toLowerCase() || ''
    const title = article.title?.toLowerCase() || ''

    // 基于主题判断严重程度
    if (themes.includes('war') || themes.includes('conflict') || themes.includes('terror')) {
      return 'critical'
    }
    if (themes.includes('crisis') || themes.includes('protest') || title.includes('emergency')) {
      return 'high'
    }
    if (themes.includes('politics') || themes.includes('government')) {
      return 'medium'
    }

    return 'low'
  }
}

/**
 * ACLED提供商（冲突数据）
 */
export class ACLEDProvider extends BaseOSINTProvider {
  constructor(apiKey?: string, email?: string) {
    const config: OSINTApiConfig = {
      name: 'ACLED',
      endpoint: 'https://api.acleddata.com/acled/read',
      apiKey,
      rateLimit: { requests: 1, period: 3000 },
      quota: { daily: 1000 },
      category: 'geopolitics',
      priority: 9,
      enabled: !!apiKey && !!email,
      tier: 'free',
      headers: apiKey && email ? {
        'Accept': 'application/json'
      } : undefined,
      timeout: 20000
    }
    super(config)
    
    if (email) {
      this.config.headers = { ...this.config.headers, 'User-Agent': `IntelligencePlatform-${email}` }
    }
  }

  async query(region: string, options?: {
    eventType?: string
    dateRange?: { from: Date; to: Date }
    limit?: number
  }): Promise<OSINTDataPoint[]> {
    if (!this.config.apiKey) {
      throw new Error('ACLED API key not configured')
    }

    await this.checkRateLimit()

    const { eventType, dateRange, limit = 100 } = options || {}

    const params = new URLSearchParams({
      key: this.config.apiKey!,
      format: 'json',
      limit: limit.toString()
    })

    // 添加地区过滤
    if (region) {
      params.append('region', region)
    }

    // 添加事件类型过滤
    if (eventType) {
      params.append('event_type', eventType)
    }

    // 添加日期范围
    if (dateRange) {
      params.append('event_date', `${dateRange.from.toISOString().split('T')[0]}|${dateRange.to.toISOString().split('T')[0]}`)
    }

    try {
      const response = await fetch(`${this.config.endpoint}?${params}`, {
        headers: this.config.headers,
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`ACLED API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, region)

    } catch (error: any) {
      console.error('ACLED query failed:', error)
      throw new Error(`ACLED query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, region: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.data && Array.isArray(rawData.data)) {
      rawData.data.forEach((event: any) => {
        const severity = this.calculateSeverity(event)
        const confidence = this.calculateConfidence(event)

        results.push(createOSINTDataPoint(
          'ACLED',
          'geopolitics',
          'conflict_event',
          {
            event_type: event.event_type,
            sub_event_type: event.sub_event_type,
            actor1: event.actor1,
            actor2: event.actor2,
            inter1: event.inter1,
            inter2: event.inter2,
            country: event.country,
            admin1: event.admin1,
            admin2: event.admin2,
            location: event.location,
            latitude: parseFloat(event.latitude) || null,
            longitude: parseFloat(event.longitude) || null,
            geo_precision: event.geo_precision,
            source: event.source,
            source_scale: event.source_scale,
            notes: event.notes,
            fatalities: parseInt(event.fatalities) || 0,
            timestamp: event.timestamp,
            event_date: event.event_date
          },
          confidence,
          severity
        ))
      })
    }

    return results
  }

  private calculateSeverity(event: any): 'low' | 'medium' | 'high' | 'critical' {
    const fatalities = parseInt(event.fatalities) || 0
    const eventType = event.event_type?.toLowerCase() || ''

    if (fatalities > 50 || eventType.includes('battle')) return 'critical'
    if (fatalities > 10 || eventType.includes('violence')) return 'high'
    if (fatalities > 0 || eventType.includes('protest')) return 'medium'
    return 'low'
  }

  private calculateConfidence(event: any): number {
    let confidence = 0.5

    // 基于数据完整性
    if (event.source && event.source.length > 5) confidence += 0.1
    if (event.geo_precision && parseInt(event.geo_precision) <= 2) confidence += 0.2
    if (event.notes && event.notes.length > 20) confidence += 0.1
    if (event.source_scale === 'National' || event.source_scale === 'International') confidence += 0.1

    return Math.min(confidence, 1.0)
  }
}

/**
 * REST Countries API提供商
 */
export class RestCountriesProvider extends BaseOSINTProvider {
  constructor() {
    const config: OSINTApiConfig = {
      name: 'REST Countries',
      endpoint: 'https://restcountries.com/v3.1',
      rateLimit: { requests: 1, period: 1000 },
      quota: { daily: 5000 },
      category: 'geopolitics',
      priority: 6,
      enabled: true,
      tier: 'free',
      timeout: 10000
    }
    super(config)
  }

  async query(countryQuery: string, options?: {
    searchBy?: 'name' | 'code' | 'region' | 'capital'
  }): Promise<OSINTDataPoint[]> {
    await this.checkRateLimit()

    const { searchBy = 'name' } = options || {}
    let endpoint = ''

    switch (searchBy) {
      case 'name':
        endpoint = `/name/${encodeURIComponent(countryQuery)}`
        break
      case 'code':
        endpoint = `/alpha/${countryQuery}`
        break
      case 'region':
        endpoint = `/region/${encodeURIComponent(countryQuery)}`
        break
      case 'capital':
        endpoint = `/capital/${encodeURIComponent(countryQuery)}`
        break
      default:
        endpoint = `/name/${encodeURIComponent(countryQuery)}`
    }

    try {
      const response = await fetch(`${this.config.endpoint}${endpoint}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        if (response.status === 404) {
          return [] // 国家未找到
        }
        throw new Error(`REST Countries API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, countryQuery)

    } catch (error: any) {
      console.error('REST Countries query failed:', error)
      throw new Error(`REST Countries query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, countryQuery: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    const countries = Array.isArray(rawData) ? rawData : [rawData]

    countries.forEach((country: any) => {
      results.push(createOSINTDataPoint(
        'REST Countries',
        'geopolitics',
        'country_profile',
        {
          name: country.name?.common,
          official_name: country.name?.official,
          native_names: country.name?.nativeName,
          cca2: country.cca2,
          cca3: country.cca3,
          ccn3: country.ccn3,
          capital: country.capital,
          region: country.region,
          subregion: country.subregion,
          languages: country.languages,
          currencies: country.currencies,
          population: country.population,
          area: country.area,
          borders: country.borders,
          timezones: country.timezones,
          continents: country.continents,
          flags: country.flags,
          coats_of_arms: country.coatOfArms,
          independent: country.independent,
          un_member: country.unMember,
          landlocked: country.landlocked
        },
        0.9 // 官方数据，高置信度
      ))
    })

    return results
  }
}

/**
 * World Bank Open Data提供商
 */
export class WorldBankProvider extends BaseOSINTProvider {
  constructor() {
    const config: OSINTApiConfig = {
      name: 'World Bank',
      endpoint: 'https://api.worldbank.org/v2',
      rateLimit: { requests: 1, period: 1000 },
      quota: { daily: 10000 },
      category: 'geopolitics',
      priority: 8,
      enabled: true,
      tier: 'free',
      timeout: 15000
    }
    super(config)
  }

  async query(countryCode: string, options?: {
    indicator?: string
    dateRange?: { from: number; to: number }
    perPage?: number
  }): Promise<OSINTDataPoint[]> {
    await this.checkRateLimit()

    const {
      indicator = 'NY.GDP.MKTP.CD', // 默认查询GDP
      dateRange,
      perPage = 100
    } = options || {}

    const params = new URLSearchParams({
      format: 'json',
      per_page: perPage.toString()
    })

    if (dateRange) {
      params.append('date', `${dateRange.from}:${dateRange.to}`)
    }

    try {
      const response = await fetch(
        `${this.config.endpoint}/country/${countryCode}/indicator/${indicator}?${params}`,
        {
          signal: AbortSignal.timeout(this.config.timeout)
        }
      )

      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, countryCode, indicator)

    } catch (error: any) {
      console.error('World Bank query failed:', error)
      throw new Error(`World Bank query failed: ${error.message}`)
    }
  }

  /**
   * 查询多个经济指标
   */
  async queryEconomicIndicators(countryCode: string): Promise<OSINTDataPoint[]> {
    const indicators = [
      'NY.GDP.MKTP.CD', // GDP
      'SP.POP.TOTL',    // 人口
      'NY.GDP.PCAP.CD', // 人均GDP
      'SL.UEM.TOTL.ZS', // 失业率
      'FP.CPI.TOTL.ZG'  // 通胀率
    ]

    const results: OSINTDataPoint[] = []

    for (const indicator of indicators) {
      try {
        const indicatorData = await this.query(countryCode, {
          indicator,
          dateRange: { from: 2020, to: 2023 }
        })
        results.push(...indicatorData)
      } catch (error) {
        console.warn(`Failed to fetch ${indicator} for ${countryCode}:`, error)
      }
    }

    return results
  }

  protected normalizeData(rawData: any, countryCode: string, indicator: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (Array.isArray(rawData) && rawData.length > 1) {
      const indicatorData = rawData[1] // World Bank API返回格式：[metadata, data]

      if (Array.isArray(indicatorData)) {
        indicatorData.forEach((dataPoint: any) => {
          if (dataPoint.value !== null) {
            results.push(createOSINTDataPoint(
              'World Bank',
              'geopolitics',
              'economic_indicator',
              {
                country_code: countryCode,
                country_name: dataPoint.country?.value,
                indicator_id: indicator,
                indicator_name: dataPoint.indicator?.value,
                date: dataPoint.date,
                value: dataPoint.value,
                unit: dataPoint.unit || null,
                obs_status: dataPoint.obs_status,
                decimal: dataPoint.decimal
              },
              0.9 // 官方经济数据，高置信度
            ))
          }
        })
      }
    }

    return results
  }
}

/**
 * 地缘政治情报聚合器
 */
export class GeopoliticalIntelligenceAggregator {
  private gdelt: GDELTProvider
  private acled?: ACLEDProvider
  private restCountries: RestCountriesProvider
  private worldBank: WorldBankProvider

  constructor() {
    this.gdelt = new GDELTProvider()
    this.restCountries = new RestCountriesProvider()
    this.worldBank = new WorldBankProvider()

    // ACLED需要API密钥
    if (process.env.ACLED_API_KEY && process.env.ACLED_EMAIL) {
      this.acled = new ACLEDProvider(process.env.ACLED_API_KEY, process.env.ACLED_EMAIL)
    }
  }

  /**
   * 综合地缘政治分析
   */
  async analyzeRegion(region: string, options?: {
    includeConflicts?: boolean
    includeEconomics?: boolean
    timeRange?: { from: Date; to: Date }
  }): Promise<OSINTDataPoint[]> {
    console.log(`🌍 分析地区: ${region}`)

    const { includeConflicts = true, includeEconomics = true, timeRange } = options || {}
    const results: OSINTDataPoint[] = []

    // 1. GDELT全球事件数据
    try {
      const gdeltResults = await this.gdelt.query(region, {
        mode: 'artlist',
        maxRecords: 100,
        timeRange
      })
      results.push(...gdeltResults)
      console.log(`✅ GDELT: ${gdeltResults.length} 条事件`)
    } catch (error) {
      console.error('GDELT查询失败:', error)
    }

    // 2. ACLED冲突数据
    if (includeConflicts && this.acled) {
      try {
        const acledResults = await this.acled.query(region, {
          dateRange: timeRange,
          limit: 50
        })
        results.push(...acledResults)
        console.log(`✅ ACLED: ${acledResults.length} 条冲突事件`)
      } catch (error) {
        console.error('ACLED查询失败:', error)
      }
    }

    // 3. 国家基础信息
    try {
      const countryResults = await this.restCountries.query(region, {
        searchBy: 'region'
      })
      results.push(...countryResults)
      console.log(`✅ REST Countries: ${countryResults.length} 个国家`)
    } catch (error) {
      console.error('REST Countries查询失败:', error)
    }

    return results
  }

  /**
   * 国家深度分析
   */
  async analyzeCountry(countryCode: string): Promise<OSINTDataPoint[]> {
    console.log(`🏛️ 分析国家: ${countryCode}`)

    const results: OSINTDataPoint[] = []

    // 1. 国家基础信息
    try {
      const countryInfo = await this.restCountries.query(countryCode, {
        searchBy: 'code'
      })
      results.push(...countryInfo)
    } catch (error) {
      console.error('国家信息查询失败:', error)
    }

    // 2. 经济指标
    try {
      const economicData = await this.worldBank.queryEconomicIndicators(countryCode)
      results.push(...economicData)
    } catch (error) {
      console.error('经济数据查询失败:', error)
    }

    // 3. 相关事件
    try {
      const events = await this.gdelt.query(countryCode, {
        maxRecords: 50
      })
      results.push(...events)
    } catch (error) {
      console.error('事件数据查询失败:', error)
    }

    return results
  }

  /**
   * 获取所有提供商状态
   */
  getProvidersStatus(): Record<string, any> {
    const providers = [this.gdelt, this.restCountries, this.worldBank]
    if (this.acled) providers.push(this.acled)

    const status: Record<string, any> = {}
    providers.forEach(provider => {
      const providerStatus = provider.getStatus()
      status[providerStatus.name] = providerStatus
    })

    return status
  }
}

// 导出实例
export const geopoliticalIntelligence = new GeopoliticalIntelligenceAggregator()