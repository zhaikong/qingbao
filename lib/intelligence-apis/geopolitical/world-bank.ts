/**
 * World Bank Open Data API提供商
 * 
 * 功能：
 * - 经济指标数据
 * - 发展统计
 * - 人口统计
 * - 社会指标
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface WorldBankIndicator {
  id: string
  name: string
  unit: string
  source: {
    id: string
    value: string
  }
  sourceNote: string
  sourceOrganization: string
  topics: Array<{
    id: string
    value: string
  }>
}

interface WorldBankDataPoint {
  indicator: {
    id: string
    value: string
  }
  country: {
    id: string
    value: string
  }
  countryiso3code: string
  date: string
  value: number | null
  unit: string
  obs_status: string
  decimal: number
}

interface WorldBankCountry {
  id: string
  iso2Code: string
  name: string
  region: {
    id: string
    iso2code: string
    value: string
  }
  adminregion: {
    id: string
    iso2code: string
    value: string
  }
  incomeLevel: {
    id: string
    iso2code: string
    value: string
  }
  lendingType: {
    id: string
    iso2code: string
    value: string
  }
  capitalCity: string
  longitude: string
  latitude: string
}

export class WorldBankProvider extends BaseAPIProvider {
  name = 'World Bank'
  category = 'geopolitical' as const
  
  rateLimit = {
    requests: 1000,
    period: 'hour' as const,
    remaining: 1000
  }

  private baseUrl = 'https://api.worldbank.org/v2'

  // 重要经济指标
  private readonly keyIndicators = {
    'NY.GDP.MKTP.CD': 'GDP (current US$)',
    'NY.GDP.PCAP.CD': 'GDP per capita (current US$)',
    'SP.POP.TOTL': 'Population, total',
    'SL.UEM.TOTL.ZS': 'Unemployment, total (% of total labor force)',
    'FP.CPI.TOTL.ZG': 'Inflation, consumer prices (annual %)',
    'NE.TRD.GNFS.ZS': 'Trade (% of GDP)',
    'GC.DOD.TOTL.GD.ZS': 'Central government debt, total (% of GDP)',
    'BX.KLT.DINV.WD.GD.ZS': 'Foreign direct investment, net inflows (% of GDP)',
    'SI.POV.GINI': 'Gini index',
    'HD.HCI.OVRL': 'Human Capital Index'
  }

  constructor() {
    super()
    this.enabled = true // 免费API，无需配置
  }

  validateConfig(): boolean {
    return true
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // 世界银行官方数据，最高可靠性
  }

  protected getSourceUrl(): string {
    return 'https://data.worldbank.org/'
  }

  /**
   * 查询经济情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `World Bank查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 尝试将查询识别为国家
      const countryCode = await this.resolveCountryCode(query)
      
      if (countryCode) {
        // 查询国家的关键经济指标
        const economicData = await this.getCountryEconomicData(countryCode, options)
        results.push(...economicData)
      } else {
        // 搜索相关指标
        const indicatorData = await this.searchIndicators(query, options)
        results.push(...indicatorData)
      }

      // 缓存结果
      this.setCached(cacheKey, results, 3600000) // 1小时缓存

      this.log('info', `查询完成，返回 ${results.length} 条结果`)
      return this.createResponse(true, results)

    } catch (error: any) {
      this.log('error', '查询失败', error.message)
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 解析国家代码
   */
  private async resolveCountryCode(query: string): Promise<string | null> {
    try {
      // 如果已经是3位代码，直接返回
      if (/^[A-Z]{3}$/.test(query.toUpperCase())) {
        return query.toUpperCase()
      }

      // 搜索国家
      const url = `${this.baseUrl}/country?format=json&per_page=300`
      const response = await this.makeRequest(url)
      const data = await response.json()
      
      if (!Array.isArray(data) || data.length < 2) {
        return null
      }

      const countries: WorldBankCountry[] = data[1]
      const queryLower = query.toLowerCase()

      // 查找匹配的国家
      const matchedCountry = countries.find(country => 
        country.name.toLowerCase().includes(queryLower) ||
        country.id.toLowerCase() === queryLower ||
        country.iso2Code.toLowerCase() === queryLower
      )

      return matchedCountry ? matchedCountry.id : null

    } catch (error) {
      this.log('warn', '国家代码解析失败')
      return null
    }
  }

  /**
   * 获取国家经济数据
   */
  private async getCountryEconomicData(countryCode: string, options: QueryOptions): Promise<IntelligenceDataPoint[]> {
    const results: IntelligenceDataPoint[] = []
    const currentYear = new Date().getFullYear()
    const startYear = options.timeRange?.from.getFullYear() || (currentYear - 5)
    const endYear = options.timeRange?.to.getFullYear() || currentYear

    // 查询关键指标
    for (const [indicatorId, indicatorName] of Object.entries(this.keyIndicators)) {
      try {
        const data = await this.getIndicatorData(countryCode, indicatorId, startYear, endYear)
        
        if (data.length > 0) {
          const latestData = data[0] // 数据按年份降序排列
          
          if (latestData.value !== null) {
            results.push(this.createDataPoint(
              `worldbank-${countryCode}-${indicatorId}-${latestData.date}`,
              'geopolitical',
              'economic_indicator',
              {
                title: `${indicatorName} - ${latestData.country.value}`,
                description: `${latestData.date}年数据: ${this.formatValue(latestData.value, latestData.unit)}`,
                indicators: [countryCode, latestData.country.value],
                location: latestData.country.value,
                indicatorId: indicatorId,
                indicatorName: indicatorName,
                value: latestData.value,
                unit: latestData.unit,
                year: latestData.date,
                trend: this.calculateTrend(data),
                rawData: latestData
              },
              this.assessIndicatorSeverity(indicatorId, latestData.value),
              0.9
            ))
          }
        }

        // 避免过于频繁的请求
        await this.sleep(100)

      } catch (error: any) {
        this.log('warn', `获取指标 ${indicatorId} 失败: ${error.message}`)
      }
    }

    return results
  }

  /**
   * 获取指标数据
   */
  private async getIndicatorData(
    countryCode: string, 
    indicatorId: string, 
    startYear: number, 
    endYear: number
  ): Promise<WorldBankDataPoint[]> {
    const url = `${this.baseUrl}/country/${countryCode}/indicator/${indicatorId}?format=json&date=${startYear}:${endYear}&per_page=100`
    
    const response = await this.makeRequest(url)
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length < 2) {
      return []
    }

    return data[1] || []
  }

  /**
   * 搜索指标
   */
  private async searchIndicators(query: string, options: QueryOptions): Promise<IntelligenceDataPoint[]> {
    try {
      const url = `${this.baseUrl}/indicator?format=json&per_page=50`
      const response = await this.makeRequest(url)
      const data = await response.json()
      
      if (!Array.isArray(data) || data.length < 2) {
        return []
      }

      const indicators: WorldBankIndicator[] = data[1]
      const queryLower = query.toLowerCase()

      // 查找相关指标
      const relevantIndicators = indicators.filter(indicator =>
        indicator.name.toLowerCase().includes(queryLower) ||
        indicator.sourceNote.toLowerCase().includes(queryLower)
      ).slice(0, options.maxResults || 10)

      const results: IntelligenceDataPoint[] = []

      for (const indicator of relevantIndicators) {
        results.push(this.createDataPoint(
          `worldbank-indicator-${indicator.id}`,
          'geopolitical',
          'economic_indicator_info',
          {
            title: `经济指标: ${indicator.name}`,
            description: indicator.sourceNote,
            indicators: [indicator.id],
            indicatorId: indicator.id,
            indicatorName: indicator.name,
            unit: indicator.unit,
            source: indicator.sourceOrganization,
            topics: indicator.topics.map(t => t.value),
            rawData: indicator
          },
          'low',
          0.7
        ))
      }

      return results

    } catch (error: any) {
      this.log('warn', `指标搜索失败: ${error.message}`)
      return []
    }
  }

  /**
   * 计算趋势
   */
  private calculateTrend(data: WorldBankDataPoint[]): 'increasing' | 'decreasing' | 'stable' | 'unknown' {
    if (data.length < 2) return 'unknown'

    const validData = data.filter(d => d.value !== null).slice(0, 3)
    if (validData.length < 2) return 'unknown'

    const recent = validData[0].value!
    const previous = validData[1].value!
    const change = (recent - previous) / previous

    if (Math.abs(change) < 0.02) return 'stable'
    return change > 0 ? 'increasing' : 'decreasing'
  }

  /**
   * 评估指标严重程度
   */
  private assessIndicatorSeverity(indicatorId: string, value: number): 'low' | 'medium' | 'high' | 'critical' {
    switch (indicatorId) {
      case 'SL.UEM.TOTL.ZS': // 失业率
        if (value > 15) return 'critical'
        if (value > 10) return 'high'
        if (value > 5) return 'medium'
        return 'low'

      case 'FP.CPI.TOTL.ZG': // 通胀率
        if (Math.abs(value) > 10) return 'critical'
        if (Math.abs(value) > 5) return 'high'
        if (Math.abs(value) > 2) return 'medium'
        return 'low'

      case 'GC.DOD.TOTL.GD.ZS': // 政府债务占GDP比例
        if (value > 100) return 'critical'
        if (value > 80) return 'high'
        if (value > 60) return 'medium'
        return 'low'

      case 'SI.POV.GINI': // 基尼系数
        if (value > 50) return 'high'
        if (value > 40) return 'medium'
        return 'low'

      default:
        return 'low'
    }
  }

  /**
   * 格式化数值
   */
  private formatValue(value: number, unit: string): string {
    if (value >= 1e12) {
      return `${(value / 1e12).toFixed(2)}万亿`
    } else if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}十亿`
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}百万`
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}千`
    } else {
      return value.toFixed(2)
    }
  }

  /**
   * 获取国家概览
   */
  async getCountryOverview(countryCode: string): Promise<APIResponse<IntelligenceDataPoint[]>> {
    return this.query(countryCode, { maxResults: 20 })
  }

  /**
   * 比较国家指标
   */
  async compareCountries(countryCodes: string[], indicatorId: string): Promise<APIResponse<IntelligenceDataPoint[]>> {
    const results: IntelligenceDataPoint[] = []
    const currentYear = new Date().getFullYear()

    for (const countryCode of countryCodes) {
      try {
        const data = await this.getIndicatorData(countryCode, indicatorId, currentYear - 1, currentYear)
        
        if (data.length > 0 && data[0].value !== null) {
          const indicatorName = this.keyIndicators[indicatorId as keyof typeof this.keyIndicators] || indicatorId
          
          results.push(this.createDataPoint(
            `worldbank-compare-${countryCode}-${indicatorId}`,
            'geopolitical',
            'country_comparison',
            {
              title: `${indicatorName} - ${data[0].country.value}`,
              description: `对比数据: ${this.formatValue(data[0].value, data[0].unit)}`,
              indicators: [countryCode],
              location: data[0].country.value,
              value: data[0].value,
              indicatorId: indicatorId,
              indicatorName: indicatorName
            },
            'medium',
            0.9
          ))
        }
      } catch (error: any) {
        this.log('warn', `国家 ${countryCode} 对比数据获取失败`)
      }
    }

    return this.createResponse(true, results)
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/country/US/indicator/NY.GDP.MKTP.CD?format=json&date=2022&per_page=1`
      const response = await this.makeRequest(url)
      return response.ok
    } catch (error) {
      return false
    }
  }
}