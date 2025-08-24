/**
 * REST Countries API提供商
 * 
 * 功能：
 * - 国家基础信息
 * - 地理边界数据
 * - 经济指标
 * - 政治体制信息
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface Country {
  name: {
    common: string
    official: string
    nativeName?: Record<string, { official: string; common: string }>
  }
  tld?: string[]
  cca2: string
  ccn3?: string
  cca3: string
  cioc?: string
  independent?: boolean
  status: string
  unMember: boolean
  currencies?: Record<string, { name: string; symbol: string }>
  idd: {
    root?: string
    suffixes?: string[]
  }
  capital?: string[]
  altSpellings: string[]
  region: string
  subregion?: string
  languages?: Record<string, string>
  translations: Record<string, { official: string; common: string }>
  latlng: [number, number]
  landlocked: boolean
  borders?: string[]
  area: number
  demonyms?: Record<string, { f: string; m: string }>
  flag: string
  maps: {
    googleMaps: string
    openStreetMaps: string
  }
  population: number
  gini?: Record<string, number>
  fifa?: string
  car: {
    signs?: string[]
    side: string
  }
  timezones: string[]
  continents: string[]
  flags: {
    png: string
    svg: string
    alt?: string
  }
  coatOfArms: {
    png?: string
    svg?: string
  }
  startOfWeek: string
  capitalInfo: {
    latlng?: [number, number]
  }
  postalCode?: {
    format: string
    regex?: string
  }
}

export class RestCountriesProvider extends BaseAPIProvider {
  name = 'REST Countries'
  category = 'geopolitical' as const
  
  rateLimit = {
    requests: 1000,
    period: 'hour' as const,
    remaining: 1000
  }

  private baseUrl = 'https://restcountries.com/v3.1'

  constructor() {
    super()
    this.enabled = true // 免费API，无需配置
  }

  validateConfig(): boolean {
    return true
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // 官方国家数据，高度可靠
  }

  protected getSourceUrl(): string {
    return 'https://restcountries.com/'
  }

  /**
   * 查询国家信息
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `REST Countries查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 尝试不同的查询方式
      let countries: Country[] = []

      // 1. 按名称搜索
      try {
        countries = await this.searchByName(query)
      } catch (error) {
        this.log('warn', '按名称搜索失败，尝试其他方式')
      }

      // 2. 如果按名称搜索失败，尝试按代码搜索
      if (countries.length === 0 && query.length <= 3) {
        try {
          countries = await this.searchByCode(query)
        } catch (error) {
          this.log('warn', '按代码搜索失败')
        }
      }

      // 3. 如果还是没有结果，尝试按地区搜索
      if (countries.length === 0) {
        try {
          countries = await this.searchByRegion(query)
        } catch (error) {
          this.log('warn', '按地区搜索失败')
        }
      }

      // 转换为标准数据点
      for (const country of countries.slice(0, options.maxResults || 10)) {
        results.push(this.convertCountryToDataPoint(country))
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
   * 按名称搜索国家
   */
  private async searchByName(name: string): Promise<Country[]> {
    const url = `${this.baseUrl}/name/${encodeURIComponent(name)}`
    const response = await this.makeRequest(url)
    
    if (response.status === 404) {
      return []
    }
    
    return await response.json()
  }

  /**
   * 按代码搜索国家
   */
  private async searchByCode(code: string): Promise<Country[]> {
    const url = `${this.baseUrl}/alpha/${code.toUpperCase()}`
    const response = await this.makeRequest(url)
    
    if (response.status === 404) {
      return []
    }
    
    const country = await response.json()
    return Array.isArray(country) ? country : [country]
  }

  /**
   * 按地区搜索国家
   */
  private async searchByRegion(region: string): Promise<Country[]> {
    const url = `${this.baseUrl}/region/${encodeURIComponent(region)}`
    const response = await this.makeRequest(url)
    
    if (response.status === 404) {
      return []
    }
    
    return await response.json()
  }

  /**
   * 将国家数据转换为标准数据点
   */
  private convertCountryToDataPoint(country: Country): IntelligenceDataPoint {
    // 计算风险等级
    const riskLevel = this.assessCountryRisk(country)
    
    // 获取主要货币
    const mainCurrency = country.currencies ? Object.values(country.currencies)[0] : null
    
    // 获取主要语言
    const mainLanguage = country.languages ? Object.values(country.languages)[0] : null

    return this.createDataPoint(
      `restcountries-${country.cca3}`,
      'geopolitical',
      'country_profile',
      {
        title: `国家档案: ${country.name.common}`,
        description: `${country.name.official} | 人口: ${country.population.toLocaleString()} | 首都: ${country.capital?.[0] || 'N/A'}`,
        indicators: [
          country.name.common,
          country.name.official,
          country.cca2,
          country.cca3,
          ...(country.capital || [])
        ],
        location: `${country.region}${country.subregion ? `, ${country.subregion}` : ''}`,
        officialName: country.name.official,
        commonName: country.name.common,
        capital: country.capital,
        region: country.region,
        subregion: country.subregion,
        population: country.population,
        area: country.area,
        currencies: country.currencies,
        languages: country.languages,
        borders: country.borders,
        coordinates: country.latlng,
        independent: country.independent,
        unMember: country.unMember,
        landlocked: country.landlocked,
        timezones: country.timezones,
        flag: country.flags.svg,
        maps: country.maps,
        rawData: country
      },
      riskLevel.severity,
      0.9 // 官方数据，高置信度
    )
  }

  /**
   * 评估国家风险等级
   */
  private assessCountryRisk(country: Country): { severity: 'low' | 'medium' | 'high' | 'critical'; factors: string[] } {
    const riskFactors: string[] = []
    let riskScore = 0

    // 地理风险因素
    if (country.landlocked) {
      riskFactors.push('内陆国家')
      riskScore += 1
    }

    // 边界风险
    if (country.borders && country.borders.length > 6) {
      riskFactors.push('边界复杂')
      riskScore += 1
    }

    // 人口密度风险
    const populationDensity = country.population / country.area
    if (populationDensity > 500) {
      riskFactors.push('人口密度高')
      riskScore += 1
    }

    // 地区风险评估
    const highRiskRegions = ['Africa', 'Asia']
    const highRiskSubregions = [
      'Western Africa', 'Middle Africa', 'Eastern Africa',
      'Western Asia', 'Southern Asia', 'South-Eastern Asia'
    ]

    if (highRiskSubregions.includes(country.subregion || '')) {
      riskFactors.push('高风险地区')
      riskScore += 2
    } else if (highRiskRegions.includes(country.region)) {
      riskFactors.push('中等风险地区')
      riskScore += 1
    }

    // 政治稳定性（基于UN成员资格和独立性）
    if (!country.unMember) {
      riskFactors.push('非联合国成员')
      riskScore += 1
    }

    if (country.independent === false) {
      riskFactors.push('非独立地区')
      riskScore += 2
    }

    // 确定风险等级
    let severity: 'low' | 'medium' | 'high' | 'critical'
    if (riskScore >= 5) {
      severity = 'critical'
    } else if (riskScore >= 3) {
      severity = 'high'
    } else if (riskScore >= 1) {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    return { severity, factors: riskFactors }
  }

  /**
   * 获取所有国家
   */
  async getAllCountries(options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const url = `${this.baseUrl}/all`
      const response = await this.makeRequest(url)
      const countries: Country[] = await response.json()

      const results = countries
        .slice(0, options.maxResults || 50)
        .map(country => this.convertCountryToDataPoint(country))

      return this.createResponse(true, results)

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 按地区获取国家
   */
  async getCountriesByRegion(region: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    return this.query(region, options)
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/alpha/US`
      const response = await this.makeRequest(url)
      return response.ok
    } catch (error) {
      return false
    }
  }
}