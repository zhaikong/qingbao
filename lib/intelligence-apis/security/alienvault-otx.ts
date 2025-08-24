/**
 * AlienVault OTX (Open Threat Exchange) API提供商
 * 
 * 功能：
 * - 威胁情报查询
 * - IOC检测
 * - 威胁脉冲获取
 * - 恶意IP/域名/URL检测
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface OTXIndicator {
  id: string
  indicator: string
  type: string
  created: string
  content: string
  title: string
  description: string
  access_type: string
  access_reason: string
}

interface OTXPulse {
  id: string
  name: string
  description: string
  author_name: string
  created: string
  modified: string
  references: string[]
  tags: string[]
  malware_families: string[]
  attack_ids: string[]
  industries: string[]
  targeted_countries: string[]
  indicators: OTXIndicator[]
}

interface OTXGeneralInfo {
  reputation: number
  country: string
  city: string
  region: string
  continent_code: string
  asn: string
  sections: string[]
  pulse_info: {
    count: number
    pulses: OTXPulse[]
  }
}

export class AlienVaultOTXProvider extends BaseAPIProvider {
  name = 'AlienVault OTX'
  category = 'security' as const
  
  rateLimit = {
    requests: 100000,
    period: 'day' as const,
    remaining: 100000
  }

  private apiKey: string
  private baseUrl = 'https://otx.alienvault.com/api/v1'

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
    this.enabled = !!apiKey
  }

  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // AlienVault OTX是高质量威胁情报源
  }

  protected getSourceUrl(): string {
    return 'https://otx.alienvault.com/'
  }

  /**
   * 查询威胁情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `查询威胁情报: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 检测查询类型并执行相应的查询
      const queryType = this.detectQueryType(query)
      
      switch (queryType) {
        case 'ip':
          const ipResults = await this.queryIP(query)
          results.push(...ipResults)
          break
          
        case 'domain':
          const domainResults = await this.queryDomain(query)
          results.push(...domainResults)
          break
          
        case 'url':
          const urlResults = await this.queryURL(query)
          results.push(...urlResults)
          break
          
        case 'hash':
          const hashResults = await this.queryFileHash(query)
          results.push(...hashResults)
          break
          
        default:
          // 通用搜索
          const generalResults = await this.searchPulses(query, options)
          results.push(...generalResults)
      }

      // 缓存结果
      this.setCached(cacheKey, results, 300000) // 5分钟缓存

      this.log('info', `查询完成，返回 ${results.length} 条结果`)
      return this.createResponse(true, results)

    } catch (error: any) {
      this.log('error', '查询失败', error.message)
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 检测查询类型
   */
  private detectQueryType(query: string): 'ip' | 'domain' | 'url' | 'hash' | 'general' {
    // IP地址
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(query)) {
      return 'ip'
    }
    
    // 域名
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(query)) {
      return 'domain'
    }
    
    // URL
    if (/^https?:\/\//.test(query)) {
      return 'url'
    }
    
    // 文件哈希 (MD5, SHA1, SHA256)
    if (/^[a-fA-F0-9]{32}$/.test(query) || /^[a-fA-F0-9]{40}$/.test(query) || /^[a-fA-F0-9]{64}$/.test(query)) {
      return 'hash'
    }
    
    return 'general'
  }

  /**
   * 查询IP地址威胁情报
   */
  private async queryIP(ip: string): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/indicators/IPv4/${ip}/general`
    
    const response = await this.makeRequest(url, {
      headers: {
        'X-OTX-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

    const data: OTXGeneralInfo = await response.json()
    const results: IntelligenceDataPoint[] = []

    // 基础IP信息
    results.push(this.createDataPoint(
      `otx-ip-${ip}`,
      'security',
      'ip_reputation',
      {
        title: `IP地址威胁分析: ${ip}`,
        description: `位置: ${data.city}, ${data.country} | ASN: ${data.asn} | 威胁脉冲: ${data.pulse_info.count}`,
        indicators: [ip],
        location: `${data.city}, ${data.country}`,
        reputation: data.reputation,
        asn: data.asn,
        pulseCount: data.pulse_info.count
      },
      data.reputation < -50 ? 'critical' : data.reputation < 0 ? 'high' : 'low',
      data.pulse_info.count > 0 ? 0.9 : 0.5
    ))

    // 威胁脉冲信息
    for (const pulse of data.pulse_info.pulses.slice(0, 5)) { // 限制前5个
      results.push(this.createDataPoint(
        `otx-pulse-${pulse.id}`,
        'security',
        'threat_pulse',
        {
          title: pulse.name,
          description: pulse.description,
          indicators: pulse.indicators.map(ind => ind.indicator),
          tags: pulse.tags,
          malwareFamilies: pulse.malware_families,
          targetedCountries: pulse.targeted_countries,
          author: pulse.author_name,
          created: pulse.created
        },
        pulse.malware_families.length > 0 ? 'high' : 'medium',
        0.8
      ))
    }

    return results
  }

  /**
   * 查询域名威胁情报
   */
  private async queryDomain(domain: string): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/indicators/domain/${domain}/general`
    
    const response = await this.makeRequest(url, {
      headers: {
        'X-OTX-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

    const data: OTXGeneralInfo = await response.json()
    const results: IntelligenceDataPoint[] = []

    // 域名威胁信息
    results.push(this.createDataPoint(
      `otx-domain-${domain}`,
      'security',
      'domain_reputation',
      {
        title: `域名威胁分析: ${domain}`,
        description: `威胁脉冲: ${data.pulse_info.count}`,
        indicators: [domain],
        pulseCount: data.pulse_info.count
      },
      data.pulse_info.count > 5 ? 'high' : data.pulse_info.count > 0 ? 'medium' : 'low',
      data.pulse_info.count > 0 ? 0.8 : 0.4
    ))

    // 相关威胁脉冲
    for (const pulse of data.pulse_info.pulses.slice(0, 3)) {
      results.push(this.createDataPoint(
        `otx-domain-pulse-${pulse.id}`,
        'security',
        'threat_pulse',
        {
          title: pulse.name,
          description: pulse.description,
          indicators: [domain],
          tags: pulse.tags,
          malwareFamilies: pulse.malware_families
        },
        'medium',
        0.7
      ))
    }

    return results
  }

  /**
   * 查询URL威胁情报
   */
  private async queryURL(url: string): Promise<IntelligenceDataPoint[]> {
    const encodedUrl = encodeURIComponent(url)
    const apiUrl = `${this.baseUrl}/indicators/url/${encodedUrl}/general`
    
    const response = await this.makeRequest(apiUrl, {
      headers: {
        'X-OTX-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

    const data: OTXGeneralInfo = await response.json()
    const results: IntelligenceDataPoint[] = []

    results.push(this.createDataPoint(
      `otx-url-${Buffer.from(url).toString('base64').slice(0, 16)}`,
      'security',
      'url_reputation',
      {
        title: `URL威胁分析`,
        description: `URL: ${url} | 威胁脉冲: ${data.pulse_info.count}`,
        indicators: [url],
        pulseCount: data.pulse_info.count
      },
      data.pulse_info.count > 0 ? 'high' : 'low',
      data.pulse_info.count > 0 ? 0.8 : 0.3
    ))

    return results
  }

  /**
   * 查询文件哈希威胁情报
   */
  private async queryFileHash(hash: string): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/indicators/file/${hash}/general`
    
    const response = await this.makeRequest(url, {
      headers: {
        'X-OTX-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

    const data: OTXGeneralInfo = await response.json()
    const results: IntelligenceDataPoint[] = []

    results.push(this.createDataPoint(
      `otx-hash-${hash.slice(0, 16)}`,
      'security',
      'file_reputation',
      {
        title: `文件哈希威胁分析`,
        description: `哈希: ${hash} | 威胁脉冲: ${data.pulse_info.count}`,
        indicators: [hash],
        pulseCount: data.pulse_info.count
      },
      data.pulse_info.count > 0 ? 'critical' : 'low',
      data.pulse_info.count > 0 ? 0.9 : 0.2
    ))

    return results
  }

  /**
   * 搜索威胁脉冲
   */
  private async searchPulses(query: string, options: QueryOptions): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/pulses/subscribed`
    const params = new URLSearchParams({
      limit: (options.maxResults || 20).toString(),
      q: query
    })

    const response = await this.makeRequest(`${url}?${params}`, {
      headers: {
        'X-OTX-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    const results: IntelligenceDataPoint[] = []

    if (data.results) {
      for (const pulse of data.results) {
        results.push(this.createDataPoint(
          `otx-search-${pulse.id}`,
          'security',
          'threat_intelligence',
          {
            title: pulse.name,
            description: pulse.description,
            tags: pulse.tags || [],
            malwareFamilies: pulse.malware_families || [],
            targetedCountries: pulse.targeted_countries || [],
            author: pulse.author_name,
            created: pulse.created,
            indicators: pulse.indicators ? pulse.indicators.map((ind: any) => ind.indicator) : []
          },
          pulse.malware_families && pulse.malware_families.length > 0 ? 'high' : 'medium',
          0.7
        ))
      }
    }

    return results
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/user/me`
      const response = await this.makeRequest(url, {
        headers: {
          'X-OTX-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      })
      
      return response.ok
    } catch (error) {
      return false
    }
  }
}