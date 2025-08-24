/**
 * 网络安全情报数据源实现
 * 
 * 支持的服务：
 * 1. AlienVault OTX - 威胁情报平台
 * 2. VirusTotal API - 恶意软件检测
 * 3. AbuseIPDB - 恶意IP数据库
 * 4. URLVoid - URL安全检测
 */

import { BaseOSINTProvider, OSINTDataPoint, createOSINTDataPoint, OSINTApiConfig } from './osint-framework'

/**
 * AlienVault OTX提供商
 */
export class AlienVaultOTXProvider extends BaseOSINTProvider {
  constructor(apiKey: string) {
    const config: OSINTApiConfig = {
      name: 'AlienVault OTX',
      endpoint: 'https://otx.alienvault.com/api/v1',
      apiKey,
      rateLimit: { requests: 1, period: 1000 }, // 保守限制
      quota: { daily: 100000 },
      category: 'security',
      priority: 10,
      enabled: !!apiKey,
      tier: 'free',
      headers: {
        'X-OTX-API-KEY': apiKey,
        'User-Agent': 'IntelligencePlatform/2.0'
      },
      timeout: 15000
    }
    super(config)
  }

  async query(indicator: string, options?: { type?: 'ip' | 'domain' | 'url' | 'hash' }): Promise<OSINTDataPoint[]> {
    if (!this.checkQuota()) {
      throw new Error('AlienVault OTX daily quota exceeded')
    }

    await this.checkRateLimit()

    const type = options?.type || this.detectIndicatorType(indicator)
    let endpoint = ''

    switch (type) {
      case 'ip':
        endpoint = `/indicators/IPv4/${indicator}/general`
        break
      case 'domain':
        endpoint = `/indicators/domain/${indicator}/general`
        break
      case 'url':
        endpoint = `/indicators/url/${encodeURIComponent(indicator)}/general`
        break
      case 'hash':
        endpoint = `/indicators/file/${indicator}/general`
        break
      default:
        throw new Error(`Unsupported indicator type: ${type}`)
    }

    try {
      const response = await fetch(`${this.config.endpoint}${endpoint}`, {
        headers: this.config.headers,
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`AlienVault OTX API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, indicator)

    } catch (error: any) {
      console.error('AlienVault OTX query failed:', error)
      throw new Error(`AlienVault OTX query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, indicator: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.pulse_info && rawData.pulse_info.count > 0) {
      rawData.pulse_info.pulses.forEach((pulse: any) => {
        results.push(createOSINTDataPoint(
          'AlienVault OTX',
          'security',
          'threat_pulse',
          {
            indicator,
            pulse_name: pulse.name,
            description: pulse.description,
            tags: pulse.tags,
            malware_families: pulse.malware_families,
            attack_ids: pulse.attack_ids,
            created: pulse.created,
            author: pulse.author_name
          },
          this.calculateConfidence(pulse)
        ))
      })
    }

    // 添加基础指标信息
    if (rawData.sections) {
      results.push(createOSINTDataPoint(
        'AlienVault OTX',
        'security',
        'indicator_analysis',
        {
          indicator,
          reputation: rawData.reputation || 0,
          whois: rawData.whois,
          geo: rawData.country,
          sections: rawData.sections
        },
        rawData.reputation ? Math.max(0.3, 1 - rawData.reputation / 10) : 0.5
      ))
    }

    return results
  }

  private detectIndicatorType(indicator: string): 'ip' | 'domain' | 'url' | 'hash' {
    // IP地址检测
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(indicator)) return 'ip'
    
    // URL检测
    if (indicator.startsWith('http://') || indicator.startsWith('https://')) return 'url'
    
    // Hash检测 (MD5, SHA1, SHA256)
    if (/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(indicator)) return 'hash'
    
    // 默认域名
    return 'domain'
  }

  private calculateConfidence(pulse: any): number {
    let confidence = 0.5
    
    // 基于脉冲质量评分
    if (pulse.TLP === 'white') confidence += 0.1
    if (pulse.tags && pulse.tags.length > 0) confidence += 0.1
    if (pulse.malware_families && pulse.malware_families.length > 0) confidence += 0.2
    if (pulse.attack_ids && pulse.attack_ids.length > 0) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }
}

/**
 * VirusTotal提供商
 */
export class VirusTotalProvider extends BaseOSINTProvider {
  constructor(apiKey: string) {
    const config: OSINTApiConfig = {
      name: 'VirusTotal',
      endpoint: 'https://www.virustotal.com/vtapi/v2',
      apiKey,
      rateLimit: { requests: 1, period: 15000 }, // 每分钟4次
      quota: { daily: 1000 },
      category: 'security',
      priority: 9,
      enabled: !!apiKey,
      tier: 'free',
      timeout: 20000
    }
    super(config)
  }

  async query(resource: string, options?: { type?: 'url' | 'file' | 'ip' | 'domain' }): Promise<OSINTDataPoint[]> {
    if (!this.checkQuota()) {
      throw new Error('VirusTotal daily quota exceeded')
    }

    await this.checkRateLimit()

    const type = options?.type || this.detectResourceType(resource)
    let endpoint = ''
    let params = new URLSearchParams({
      apikey: this.config.apiKey!,
      resource
    })

    switch (type) {
      case 'url':
        endpoint = '/url/report'
        break
      case 'file':
        endpoint = '/file/report'
        break
      case 'ip':
        endpoint = '/ip-address/report'
        params = new URLSearchParams({
          apikey: this.config.apiKey!,
          ip: resource
        })
        break
      case 'domain':
        endpoint = '/domain/report'
        params = new URLSearchParams({
          apikey: this.config.apiKey!,
          domain: resource
        })
        break
      default:
        throw new Error(`Unsupported resource type: ${type}`)
    }

    try {
      const response = await fetch(`${this.config.endpoint}${endpoint}?${params}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`VirusTotal API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, resource)

    } catch (error: any) {
      console.error('VirusTotal query failed:', error)
      throw new Error(`VirusTotal query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, resource: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.response_code === 1) {
      // 检测结果
      const detectionRatio = rawData.positives / rawData.total
      const severity = this.calculateSeverity(detectionRatio)

      results.push(createOSINTDataPoint(
        'VirusTotal',
        'security',
        'malware_scan',
        {
          resource,
          scan_date: rawData.scan_date,
          total_engines: rawData.total,
          positive_detections: rawData.positives,
          detection_ratio: detectionRatio,
          permalink: rawData.permalink,
          scans: rawData.scans
        },
        this.calculateConfidence(rawData),
        severity
      ))

      // 如果有详细的扫描结果
      if (rawData.scans) {
        Object.entries(rawData.scans).forEach(([engine, result]: [string, any]) => {
          if (result.detected) {
            results.push(createOSINTDataPoint(
              'VirusTotal',
              'security',
              'engine_detection',
              {
                resource,
                engine,
                malware_name: result.result,
                version: result.version,
                update: result.update
              },
              0.8,
              'medium'
            ))
          }
        })
      }
    }

    return results
  }

  private detectResourceType(resource: string): 'url' | 'file' | 'ip' | 'domain' {
    if (resource.startsWith('http://') || resource.startsWith('https://')) return 'url'
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(resource)) return 'ip'
    if (/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(resource)) return 'file'
    return 'domain'
  }

  private calculateSeverity(detectionRatio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (detectionRatio >= 0.7) return 'critical'
    if (detectionRatio >= 0.4) return 'high'
    if (detectionRatio >= 0.1) return 'medium'
    return 'low'
  }

  private calculateConfidence(data: any): number {
    const detectionRatio = data.positives / data.total
    const engineCount = data.total
    
    let confidence = 0.5
    
    // 基于检测引擎数量
    if (engineCount >= 50) confidence += 0.2
    else if (engineCount >= 30) confidence += 0.1
    
    // 基于检测比率
    if (detectionRatio > 0.5) confidence += 0.3
    else if (detectionRatio > 0.1) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }
}

/**
 * AbuseIPDB提供商
 */
export class AbuseIPDBProvider extends BaseOSINTProvider {
  constructor(apiKey: string) {
    const config: OSINTApiConfig = {
      name: 'AbuseIPDB',
      endpoint: 'https://api.abuseipdb.com/api/v2',
      apiKey,
      rateLimit: { requests: 1, period: 1000 },
      quota: { daily: 1000 },
      category: 'security',
      priority: 8,
      enabled: !!apiKey,
      tier: 'free',
      headers: {
        'Key': apiKey,
        'Accept': 'application/json'
      },
      timeout: 10000
    }
    super(config)
  }

  async query(ipAddress: string): Promise<OSINTDataPoint[]> {
    if (!this.checkQuota()) {
      throw new Error('AbuseIPDB daily quota exceeded')
    }

    await this.checkRateLimit()

    // 验证IP地址格式
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddress)) {
      throw new Error('Invalid IP address format')
    }

    const params = new URLSearchParams({
      ipAddress,
      maxAgeInDays: '90',
      verbose: 'true'
    })

    try {
      const response = await fetch(`${this.config.endpoint}/check?${params}`, {
        headers: this.config.headers,
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`AbuseIPDB API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, ipAddress)

    } catch (error: any) {
      console.error('AbuseIPDB query failed:', error)
      throw new Error(`AbuseIPDB query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, ipAddress: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.data) {
      const data = rawData.data
      const abuseConfidence = data.abuseConfidencePercentage / 100
      const severity = this.calculateSeverity(abuseConfidence)

      results.push(createOSINTDataPoint(
        'AbuseIPDB',
        'security',
        'ip_reputation',
        {
          ip_address: ipAddress,
          abuse_confidence: abuseConfidence,
          country_code: data.countryCode,
          country_name: data.countryName,
          usage_type: data.usageType,
          isp: data.isp,
          domain: data.domain,
          total_reports: data.totalReports,
          num_distinct_users: data.numDistinctUsers,
          last_reported_at: data.lastReportedAt,
          is_public: data.isPublic,
          is_whitelisted: data.isWhitelisted
        },
        abuseConfidence > 0 ? Math.max(0.6, abuseConfidence) : 0.3,
        severity
      ))

      // 如果有报告记录
      if (data.reports && data.reports.length > 0) {
        data.reports.forEach((report: any) => {
          results.push(createOSINTDataPoint(
            'AbuseIPDB',
            'security',
            'abuse_report',
            {
              ip_address: ipAddress,
              reported_at: report.reportedAt,
              comment: report.comment,
              categories: report.categories,
              reporter_id: report.reporterId,
              reporter_country: report.reporterCountryCode
            },
            0.7
          ))
        })
      }
    }

    return results
  }

  private calculateSeverity(abuseConfidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (abuseConfidence >= 0.75) return 'critical'
    if (abuseConfidence >= 0.50) return 'high'
    if (abuseConfidence >= 0.25) return 'medium'
    return 'low'
  }
}

/**
 * URLVoid提供商
 */
export class URLVoidProvider extends BaseOSINTProvider {
  constructor(apiKey: string) {
    const config: OSINTApiConfig = {
      name: 'URLVoid',
      endpoint: 'http://api.urlvoid.com/api1000',
      apiKey,
      rateLimit: { requests: 1, period: 2000 },
      quota: { monthly: 1000 },
      category: 'security',
      priority: 7,
      enabled: !!apiKey,
      tier: 'free',
      timeout: 15000
    }
    super(config)
  }

  async query(domain: string): Promise<OSINTDataPoint[]> {
    if (!this.checkQuota()) {
      throw new Error('URLVoid monthly quota exceeded')
    }

    await this.checkRateLimit()

    // 提取域名（如果是URL）
    const cleanDomain = this.extractDomain(domain)

    try {
      const response = await fetch(
        `${this.config.endpoint}/${this.config.apiKey}/host/${cleanDomain}`,
        {
          signal: AbortSignal.timeout(this.config.timeout)
        }
      )

      if (!response.ok) {
        throw new Error(`URLVoid API error: ${response.status} ${response.statusText}`)
      }

      const text = await response.text()
      return this.normalizeData(text, cleanDomain)

    } catch (error: any) {
      console.error('URLVoid query failed:', error)
      throw new Error(`URLVoid query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: string, domain: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    try {
      // URLVoid返回XML，需要解析
      const detections = this.parseXMLDetections(rawData)
      const engineCount = this.parseXMLEngineCount(rawData)
      
      if (detections !== null && engineCount !== null) {
        const detectionRatio = detections / engineCount
        const severity = this.calculateSeverity(detectionRatio)

        results.push(createOSINTDataPoint(
          'URLVoid',
          'security',
          'domain_reputation',
          {
            domain,
            detections,
            engines: engineCount,
            detection_ratio: detectionRatio,
            raw_response: rawData
          },
          detectionRatio > 0 ? 0.8 : 0.4,
          severity
        ))
      }
    } catch (error) {
      console.error('URLVoid XML parsing failed:', error)
    }

    return results
  }

  private extractDomain(url: string): string {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return new URL(url).hostname
      }
      return url
    } catch {
      return url
    }
  }

  private parseXMLDetections(xml: string): number | null {
    const match = xml.match(/<detections>(\d+)<\/detections>/)
    return match ? parseInt(match[1]) : null
  }

  private parseXMLEngineCount(xml: string): number | null {
    const match = xml.match(/<engines>(\d+)<\/engines>/)
    return match ? parseInt(match[1]) : null
  }

  private calculateSeverity(detectionRatio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (detectionRatio >= 0.5) return 'critical'
    if (detectionRatio >= 0.3) return 'high'
    if (detectionRatio >= 0.1) return 'medium'
    return 'low'
  }
}

// 安全情报聚合器
export class SecurityIntelligenceAggregator {
  private providers: BaseOSINTProvider[] = []

  constructor() {
    // 根据环境变量初始化提供商
    if (process.env.ALIENVAULT_OTX_API_KEY) {
      this.providers.push(new AlienVaultOTXProvider(process.env.ALIENVAULT_OTX_API_KEY))
    }
    
    if (process.env.VIRUSTOTAL_API_KEY) {
      this.providers.push(new VirusTotalProvider(process.env.VIRUSTOTAL_API_KEY))
    }
    
    if (process.env.ABUSEIPDB_API_KEY) {
      this.providers.push(new AbuseIPDBProvider(process.env.ABUSEIPDB_API_KEY))
    }
    
    if (process.env.URLVOID_API_KEY) {
      this.providers.push(new URLVoidProvider(process.env.URLVOID_API_KEY))
    }
  }

  /**
   * 综合威胁情报查询
   */
  async queryThreatIntelligence(indicator: string): Promise<OSINTDataPoint[]> {
    console.log(`🔍 查询威胁情报: ${indicator}`)
    
    const results: OSINTDataPoint[] = []
    const promises = this.providers.map(async provider => {
      try {
        return await provider.query(indicator)
      } catch (error) {
        console.error(`${provider.getStatus().name} query failed:`, error)
        return []
      }
    })

    const allResults = await Promise.all(promises)
    results.push(...allResults.flat())

    // 按严重程度和置信度排序
    results.sort((a, b) => {
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
      const severityDiff = (severityOrder[b.severity || 'low'] || 0) - (severityOrder[a.severity || 'low'] || 0)
      
      if (severityDiff !== 0) return severityDiff
      return b.confidence - a.confidence
    })

    console.log(`✅ 威胁情报查询完成: ${results.length} 条结果`)
    return results
  }

  /**
   * 获取所有安全提供商状态
   */
  getProvidersStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    this.providers.forEach(provider => {
      const providerStatus = provider.getStatus()
      status[providerStatus.name] = providerStatus
    })
    return status
  }
}

// 导出实例
export const securityIntelligence = new SecurityIntelligenceAggregator()