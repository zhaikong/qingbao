/**
 * VirusTotal API提供商
 * 
 * 功能：
 * - 文件扫描分析
 * - URL安全检测
 * - IP/域名信誉查询
 * - 恶意软件检测
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface VTScanResult {
  scans: Record<string, {
    detected: boolean
    version: string
    result: string | null
    update: string
  }>
  scan_id: string
  sha1: string
  resource: string
  response_code: number
  scan_date: string
  permalink: string
  verbose_msg: string
  total: number
  positives: number
  sha256: string
  md5: string
}

interface VTURLScanResult {
  scan_id: string
  scan_date: string
  url: string
  response_code: number
  permalink: string
  verbose_msg: string
  filescan_id: string | null
  positives: number
  total: number
  scans: Record<string, {
    detected: boolean
    result: string
  }>
}

interface VTIPReport {
  response_code: number
  verbose_msg: string
  detected_urls: Array<{
    url: string
    positives: number
    total: number
    scan_date: string
  }>
  detected_downloaded_samples: Array<{
    date: string
    positives: number
    total: number
    sha256: string
  }>
  detected_communicating_samples: Array<{
    date: string
    positives: number
    total: number
    sha256: string
  }>
  resolutions: Array<{
    last_resolved: string
    hostname: string
  }>
  country: string
  as_owner: string
  asn: number
}

export class VirusTotalProvider extends BaseAPIProvider {
  name = 'VirusTotal'
  category = 'security' as const
  
  rateLimit = {
    requests: 1000,
    period: 'day' as const,
    remaining: 1000
  }

  private apiKey: string
  private baseUrl = 'https://www.virustotal.com/vtapi/v2'

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
    this.enabled = !!apiKey
  }

  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // VirusTotal是权威的恶意软件检测平台
  }

  protected getSourceUrl(): string {
    return 'https://www.virustotal.com/'
  }

  /**
   * 查询威胁情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `VirusTotal查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []
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
          this.log('warn', `不支持的查询类型: ${query}`)
          return this.createResponse(false, undefined, '不支持的查询类型')
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
  private detectQueryType(query: string): 'ip' | 'domain' | 'url' | 'hash' | 'unknown' {
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(query)) {
      return 'ip'
    }
    
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(query)) {
      return 'domain'
    }
    
    if (/^https?:\/\//.test(query)) {
      return 'url'
    }
    
    if (/^[a-fA-F0-9]{32}$/.test(query) || /^[a-fA-F0-9]{40}$/.test(query) || /^[a-fA-F0-9]{64}$/.test(query)) {
      return 'hash'
    }
    
    return 'unknown'
  }

  /**
   * 查询IP地址
   */
  private async queryIP(ip: string): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/ip-address/report`
    const params = new URLSearchParams({
      apikey: this.apiKey,
      ip: ip
    })

    const response = await this.makeRequest(`${url}?${params}`)
    const data: VTIPReport = await response.json()

    if (data.response_code !== 1) {
      return []
    }

    const results: IntelligenceDataPoint[] = []

    // 基础IP信息
    const detectedUrls = data.detected_urls || []
    const detectedSamples = data.detected_downloaded_samples || []
    
    results.push(this.createDataPoint(
      `vt-ip-${ip}`,
      'security',
      'ip_reputation',
      {
        title: `VirusTotal IP分析: ${ip}`,
        description: `检测到 ${detectedUrls.length} 个恶意URL，${detectedSamples.length} 个恶意样本`,
        indicators: [ip],
        location: data.country,
        asOwner: data.as_owner,
        asn: data.asn,
        detectedUrls: detectedUrls.length,
        detectedSamples: detectedSamples.length
      },
      detectedUrls.length > 5 || detectedSamples.length > 5 ? 'critical' : 
      detectedUrls.length > 0 || detectedSamples.length > 0 ? 'high' : 'low',
      detectedUrls.length > 0 || detectedSamples.length > 0 ? 0.9 : 0.3
    ))

    // 恶意URL详情
    for (const urlInfo of detectedUrls.slice(0, 5)) {
      results.push(this.createDataPoint(
        `vt-ip-url-${Buffer.from(urlInfo.url).toString('base64').slice(0, 16)}`,
        'security',
        'malicious_url',
        {
          title: `恶意URL检测`,
          description: `URL: ${urlInfo.url} | 检出率: ${urlInfo.positives}/${urlInfo.total}`,
          indicators: [urlInfo.url, ip],
          detectionRatio: `${urlInfo.positives}/${urlInfo.total}`,
          scanDate: urlInfo.scan_date
        },
        urlInfo.positives > urlInfo.total * 0.3 ? 'high' : 'medium',
        0.8
      ))
    }

    return results
  }

  /**
   * 查询域名
   */
  private async queryDomain(domain: string): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/domain/report`
    const params = new URLSearchParams({
      apikey: this.apiKey,
      domain: domain
    })

    const response = await this.makeRequest(`${url}?${params}`)
    const data: VTIPReport = await response.json()

    if (data.response_code !== 1) {
      return []
    }

    const results: IntelligenceDataPoint[] = []
    const detectedUrls = data.detected_urls || []

    results.push(this.createDataPoint(
      `vt-domain-${domain}`,
      'security',
      'domain_reputation',
      {
        title: `VirusTotal域名分析: ${domain}`,
        description: `检测到 ${detectedUrls.length} 个恶意URL`,
        indicators: [domain],
        detectedUrls: detectedUrls.length
      },
      detectedUrls.length > 3 ? 'high' : detectedUrls.length > 0 ? 'medium' : 'low',
      detectedUrls.length > 0 ? 0.8 : 0.3
    ))

    return results
  }

  /**
   * 查询URL
   */
  private async queryURL(url: string): Promise<IntelligenceDataPoint[]> {
    const apiUrl = `${this.baseUrl}/url/report`
    const params = new URLSearchParams({
      apikey: this.apiKey,
      resource: url
    })

    const response = await this.makeRequest(`${apiUrl}?${params}`)
    const data: VTURLScanResult = await response.json()

    if (data.response_code !== 1) {
      return []
    }

    const results: IntelligenceDataPoint[] = []

    results.push(this.createDataPoint(
      `vt-url-${Buffer.from(url).toString('base64').slice(0, 16)}`,
      'security',
      'url_scan',
      {
        title: `VirusTotal URL扫描`,
        description: `URL: ${url} | 检出率: ${data.positives}/${data.total}`,
        indicators: [url],
        detectionRatio: `${data.positives}/${data.total}`,
        scanDate: data.scan_date,
        permalink: data.permalink
      },
      data.positives > data.total * 0.3 ? 'critical' : 
      data.positives > 0 ? 'high' : 'low',
      data.positives > 0 ? 0.9 : 0.2
    ))

    // 检测引擎详情
    if (data.scans && data.positives > 0) {
      const detectedEngines = Object.entries(data.scans)
        .filter(([_, result]) => result.detected)
        .slice(0, 5)

      for (const [engine, result] of detectedEngines) {
        results.push(this.createDataPoint(
          `vt-url-engine-${engine}-${Buffer.from(url).toString('base64').slice(0, 8)}`,
          'security',
          'malware_detection',
          {
            title: `${engine} 检测结果`,
            description: `检测结果: ${result.result}`,
            indicators: [url],
            engine: engine,
            detectionResult: result.result
          },
          'medium',
          0.7
        ))
      }
    }

    return results
  }

  /**
   * 查询文件哈希
   */
  private async queryFileHash(hash: string): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/file/report`
    const params = new URLSearchParams({
      apikey: this.apiKey,
      resource: hash
    })

    const response = await this.makeRequest(`${url}?${params}`)
    const data: VTScanResult = await response.json()

    if (data.response_code !== 1) {
      return []
    }

    const results: IntelligenceDataPoint[] = []

    results.push(this.createDataPoint(
      `vt-file-${hash.slice(0, 16)}`,
      'security',
      'file_scan',
      {
        title: `VirusTotal文件扫描`,
        description: `文件哈希: ${hash} | 检出率: ${data.positives}/${data.total}`,
        indicators: [hash, data.md5, data.sha1, data.sha256].filter(Boolean),
        detectionRatio: `${data.positives}/${data.total}`,
        scanDate: data.scan_date,
        permalink: data.permalink
      },
      data.positives > data.total * 0.3 ? 'critical' : 
      data.positives > 0 ? 'high' : 'low',
      data.positives > 0 ? 0.95 : 0.1
    ))

    // 恶意软件检测详情
    if (data.scans && data.positives > 0) {
      const detectedEngines = Object.entries(data.scans)
        .filter(([_, result]) => result.detected)
        .slice(0, 10) // 显示前10个检测结果

      for (const [engine, result] of detectedEngines) {
        results.push(this.createDataPoint(
          `vt-file-engine-${engine}-${hash.slice(0, 8)}`,
          'security',
          'malware_detection',
          {
            title: `${engine} 恶意软件检测`,
            description: `检测结果: ${result.result}`,
            indicators: [hash],
            engine: engine,
            detectionResult: result.result,
            version: result.version,
            lastUpdate: result.update
          },
          'high',
          0.9
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
      // 使用一个已知的安全文件哈希进行测试
      const testHash = 'd41d8cd98f00b204e9800998ecf8427e' // 空文件的MD5
      const url = `${this.baseUrl}/file/report`
      const params = new URLSearchParams({
        apikey: this.apiKey,
        resource: testHash
      })

      const response = await this.makeRequest(`${url}?${params}`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}