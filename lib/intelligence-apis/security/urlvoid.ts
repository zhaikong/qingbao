/**
 * URLVoid API提供商
 * 
 * 功能：
 * - URL安全检测
 * - 域名信誉查询
 * - 恶意网站检测
 * - 多引擎扫描结果
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface URLVoidResponse {
  success: boolean
  data?: {
    domain: string
    ip: string
    server: string
    domain_age: string
    domain_1st_registered: string
    domain_expires: string
    registrar: string
    registrant_country: string
    detections: {
      engines: Array<{
        engine: string
        detected: boolean
        elapsed: string
        reference: string
      }>
      count: number
      total: number
    }
    site_category: string
    response_time: number
  }
  error?: string
}

export class URLVoidProvider extends BaseAPIProvider {
  name = 'URLVoid'
  category = 'security' as const
  
  rateLimit = {
    requests: 1000,
    period: 'day' as const,
    remaining: 1000
  }

  private apiKey: string
  private baseUrl = 'http://api.urlvoid.com/api1000'

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
    this.enabled = !!apiKey
  }

  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'B' // URLVoid是可靠的URL检测服务
  }

  protected getSourceUrl(): string {
    return 'https://www.urlvoid.com/'
  }

  /**
   * 查询威胁情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `URLVoid查询: ${query}`)

      // 检查查询类型
      const queryType = this.detectQueryType(query)
      if (queryType === 'unknown') {
        return this.createResponse(false, undefined, '仅支持域名和URL查询')
      }

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      if (queryType === 'domain') {
        const domainResults = await this.queryDomain(query)
        results.push(...domainResults)
      } else if (queryType === 'url') {
        // 从URL提取域名
        const domain = this.extractDomainFromURL(query)
        if (domain) {
          const domainResults = await this.queryDomain(domain)
          results.push(...domainResults)
        }
      }

      // 缓存结果
      this.setCached(cacheKey, results, 600000) // 10分钟缓存

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
  private detectQueryType(query: string): 'domain' | 'url' | 'unknown' {
    if (/^https?:\/\//.test(query)) {
      return 'url'
    }
    
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(query)) {
      return 'domain'
    }
    
    return 'unknown'
  }

  /**
   * 从URL提取域名
   */
  private extractDomainFromURL(url: string): string | null {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (error) {
      return null
    }
  }

  /**
   * 查询域名
   */
  private async queryDomain(domain: string): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/${this.apiKey}/host/${domain}`

    try {
      const response = await this.makeRequest(url, {
        headers: {
          'Accept': 'application/json'
        }
      })

      // URLVoid API返回XML，需要解析
      const xmlText = await response.text()
      const parsedData = this.parseURLVoidXML(xmlText)

      if (!parsedData.success) {
        this.log('warn', `URLVoid查询失败: ${parsedData.error}`)
        return []
      }

      const data = parsedData.data!
      const results: IntelligenceDataPoint[] = []

      // 主要域名信息
      const detectionCount = data.detections.count
      const totalEngines = data.detections.total
      const detectionRate = totalEngines > 0 ? detectionCount / totalEngines : 0

      let severity: 'low' | 'medium' | 'high' | 'critical'
      if (detectionRate >= 0.5) {
        severity = 'critical'
      } else if (detectionRate >= 0.3) {
        severity = 'high'
      } else if (detectionRate >= 0.1) {
        severity = 'medium'
      } else {
        severity = 'low'
      }

      results.push(this.createDataPoint(
        `urlvoid-${domain}`,
        'security',
        'domain_reputation',
        {
          title: `URLVoid域名分析: ${domain}`,
          description: `检出率: ${detectionCount}/${totalEngines} | IP: ${data.ip} | 注册国家: ${data.registrant_country}`,
          indicators: [domain, data.ip].filter(Boolean),
          location: data.registrant_country,
          detectionCount: detectionCount,
          totalEngines: totalEngines,
          detectionRate: detectionRate,
          ip: data.ip,
          server: data.server,
          domainAge: data.domain_age,
          registrar: data.registrar,
          category: data.site_category,
          rawData: data
        },
        severity,
        detectionCount > 0 ? Math.min(0.9, 0.5 + detectionRate) : 0.3
      ))

      // 检测引擎详情
      if (data.detections.engines && detectionCount > 0) {
        const detectedEngines = data.detections.engines
          .filter(engine => engine.detected)
          .slice(0, 5) // 限制前5个

        for (const engine of detectedEngines) {
          results.push(this.createDataPoint(
            `urlvoid-engine-${domain}-${engine.engine}`,
            'security',
            'malicious_detection',
            {
              title: `${engine.engine} 检测结果`,
              description: `检测引擎 ${engine.engine} 将 ${domain} 标记为恶意`,
              indicators: [domain],
              engine: engine.engine,
              reference: engine.reference,
              elapsed: engine.elapsed
            },
            'medium',
            0.7
          ))
        }
      }

      return results

    } catch (error: any) {
      this.log('error', `域名查询失败: ${error.message}`)
      return []
    }
  }

  /**
   * 解析URLVoid XML响应
   */
  private parseURLVoidXML(xmlText: string): URLVoidResponse {
    try {
      // 简单的XML解析（生产环境建议使用专业的XML解析库）
      const success = !xmlText.includes('<error>')
      
      if (!success) {
        const errorMatch = xmlText.match(/<error>(.*?)<\/error>/)
        return {
          success: false,
          error: errorMatch ? errorMatch[1] : '未知错误'
        }
      }

      // 提取基本信息
      const domain = this.extractXMLValue(xmlText, 'domain') || ''
      const ip = this.extractXMLValue(xmlText, 'ip') || ''
      const server = this.extractXMLValue(xmlText, 'server') || ''
      const domainAge = this.extractXMLValue(xmlText, 'domain_age') || ''
      const domain1stRegistered = this.extractXMLValue(xmlText, 'domain_1st_registered') || ''
      const domainExpires = this.extractXMLValue(xmlText, 'domain_expires') || ''
      const registrar = this.extractXMLValue(xmlText, 'registrar') || ''
      const registrantCountry = this.extractXMLValue(xmlText, 'registrant_country') || ''
      const siteCategory = this.extractXMLValue(xmlText, 'site_category') || ''

      // 提取检测结果
      const detections = this.parseDetections(xmlText)

      return {
        success: true,
        data: {
          domain,
          ip,
          server,
          domain_age: domainAge,
          domain_1st_registered: domain1stRegistered,
          domain_expires: domainExpires,
          registrar,
          registrant_country: registrantCountry,
          detections,
          site_category: siteCategory,
          response_time: 0
        }
      }

    } catch (error: any) {
      return {
        success: false,
        error: `XML解析失败: ${error.message}`
      }
    }
  }

  /**
   * 从XML中提取值
   */
  private extractXMLValue(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1].trim() : null
  }

  /**
   * 解析检测结果
   */
  private parseDetections(xml: string): {
    engines: Array<{
      engine: string
      detected: boolean
      elapsed: string
      reference: string
    }>
    count: number
    total: number
  } {
    const engines: Array<{
      engine: string
      detected: boolean
      elapsed: string
      reference: string
    }> = []

    // 查找所有检测引擎结果
    const engineRegex = /<engine name="([^"]+)" detected="([^"]+)" elapsed="([^"]+)" reference="([^"]+)"/g
    let match

    while ((match = engineRegex.exec(xml)) !== null) {
      engines.push({
        engine: match[1],
        detected: match[2] === '1' || match[2].toLowerCase() === 'true',
        elapsed: match[3],
        reference: match[4]
      })
    }

    const detectedCount = engines.filter(engine => engine.detected).length

    return {
      engines,
      count: detectedCount,
      total: engines.length
    }
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      // 使用一个已知的安全域名进行测试
      const testDomain = 'google.com'
      const url = `${this.baseUrl}/${this.apiKey}/host/${testDomain}`

      const response = await this.makeRequest(url)
      const xmlText = await response.text()
      
      return !xmlText.includes('<error>')
    } catch (error) {
      return false
    }
  }
}