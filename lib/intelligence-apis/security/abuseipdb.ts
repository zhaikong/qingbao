/**
 * AbuseIPDB API提供商
 * 
 * 功能：
 * - IP地址信誉查询
 * - 恶意IP检测
 * - IP滥用报告
 * - 地理位置信息
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface AbuseIPDBResponse {
  data: {
    ipAddress: string
    isPublic: boolean
    ipVersion: number
    isWhitelisted: boolean
    abuseConfidencePercentage: number
    countryCode: string
    countryName: string
    usageType: string
    isp: string
    domain: string
    totalReports: number
    numDistinctUsers: number
    lastReportedAt: string | null
  }
}

interface AbuseIPDBReportsResponse {
  data: {
    reports: Array<{
      reportedAt: string
      comment: string
      categories: number[]
      reporterId: number
      reporterCountryCode: string
      reporterCountryName: string
    }>
  }
}

export class AbuseIPDBProvider extends BaseAPIProvider {
  name = 'AbuseIPDB'
  category = 'security' as const
  
  rateLimit = {
    requests: 1000,
    period: 'day' as const,
    remaining: 1000
  }

  private apiKey: string
  private baseUrl = 'https://api.abuseipdb.com/api/v2'

  // 滥用类别映射
  private readonly abuseCategories: Record<number, string> = {
    1: 'DNS Compromise',
    2: 'DNS Poisoning',
    3: 'Fraud Orders',
    4: 'DDoS Attack',
    5: 'FTP Brute-Force',
    6: 'Ping of Death',
    7: 'Phishing',
    8: 'Fraud VoIP',
    9: 'Open Proxy',
    10: 'Web Spam',
    11: 'Email Spam',
    12: 'Blog Spam',
    13: 'VPN IP',
    14: 'Port Scan',
    15: 'Hacking',
    16: 'SQL Injection',
    17: 'Spoofing',
    18: 'Brute-Force',
    19: 'Bad Web Bot',
    20: 'Exploited Host',
    21: 'Web App Attack',
    22: 'SSH',
    23: 'IoT Targeted'
  }

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
    this.enabled = !!apiKey
  }

  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // AbuseIPDB是权威的IP信誉数据库
  }

  protected getSourceUrl(): string {
    return 'https://www.abuseipdb.com/'
  }

  /**
   * 查询威胁情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `AbuseIPDB查询: ${query}`)

      // 只支持IP地址查询
      if (!this.isValidIP(query)) {
        return this.createResponse(false, undefined, '仅支持IP地址查询')
      }

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 查询IP信誉
      const ipInfo = await this.queryIPReputation(query)
      if (ipInfo) {
        results.push(ipInfo)
      }

      // 查询滥用报告（如果有报告的话）
      if (ipInfo && ipInfo.content.rawData?.totalReports > 0) {
        const reports = await this.queryIPReports(query)
        results.push(...reports)
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
   * 验证IP地址格式
   */
  private isValidIP(ip: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)
  }

  /**
   * 查询IP信誉
   */
  private async queryIPReputation(ip: string): Promise<IntelligenceDataPoint | null> {
    const url = `${this.baseUrl}/check`
    const params = new URLSearchParams({
      ipAddress: ip,
      maxAgeInDays: '90',
      verbose: 'true'
    })

    const response = await this.makeRequest(`${url}?${params}`, {
      headers: {
        'Key': this.apiKey,
        'Accept': 'application/json'
      }
    })

    const result: AbuseIPDBResponse = await response.json()
    const data = result.data

    if (!data) {
      return null
    }

    // 计算威胁等级
    const abuseConfidence = data.abuseConfidencePercentage
    let severity: 'low' | 'medium' | 'high' | 'critical'
    
    if (abuseConfidence >= 75) {
      severity = 'critical'
    } else if (abuseConfidence >= 50) {
      severity = 'high'
    } else if (abuseConfidence >= 25) {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    return this.createDataPoint(
      `abuseipdb-${ip}`,
      'security',
      'ip_reputation',
      {
        title: `AbuseIPDB IP信誉分析: ${ip}`,
        description: `滥用置信度: ${abuseConfidence}% | 报告数: ${data.totalReports} | 位置: ${data.countryName}`,
        indicators: [ip],
        location: `${data.countryName} (${data.countryCode})`,
        abuseConfidence: abuseConfidence,
        totalReports: data.totalReports,
        distinctReporters: data.numDistinctUsers,
        isWhitelisted: data.isWhitelisted,
        usageType: data.usageType,
        isp: data.isp,
        domain: data.domain,
        lastReported: data.lastReportedAt,
        rawData: data
      },
      severity,
      abuseConfidence > 0 ? Math.min(0.95, 0.5 + (abuseConfidence / 100)) : 0.3
    )
  }

  /**
   * 查询IP滥用报告
   */
  private async queryIPReports(ip: string): Promise<IntelligenceDataPoint[]> {
    const url = `${this.baseUrl}/reports`
    const params = new URLSearchParams({
      ipAddress: ip,
      maxAgeInDays: '90',
      perPage: '25'
    })

    try {
      const response = await this.makeRequest(`${url}?${params}`, {
        headers: {
          'Key': this.apiKey,
          'Accept': 'application/json'
        }
      })

      const result: AbuseIPDBReportsResponse = await response.json()
      const reports = result.data?.reports || []
      const results: IntelligenceDataPoint[] = []

      // 按类别分组报告
      const categoryGroups: Record<string, any[]> = {}
      
      for (const report of reports.slice(0, 10)) { // 限制前10个报告
        for (const categoryId of report.categories) {
          const categoryName = this.abuseCategories[categoryId] || `Category ${categoryId}`
          
          if (!categoryGroups[categoryName]) {
            categoryGroups[categoryName] = []
          }
          
          categoryGroups[categoryName].push(report)
        }
      }

      // 为每个类别创建数据点
      for (const [categoryName, categoryReports] of Object.entries(categoryGroups)) {
        const latestReport = categoryReports[0]
        
        results.push(this.createDataPoint(
          `abuseipdb-report-${ip}-${categoryName.replace(/\s+/g, '-').toLowerCase()}`,
          'security',
          'abuse_report',
          {
            title: `滥用报告: ${categoryName}`,
            description: `IP ${ip} 被报告进行 ${categoryName} 活动，共 ${categoryReports.length} 次报告`,
            indicators: [ip],
            category: categoryName,
            reportCount: categoryReports.length,
            latestReport: latestReport.reportedAt,
            reporterCountry: latestReport.reporterCountryName,
            comment: latestReport.comment
          },
          this.getCategorySeverity(categoryName),
          0.8
        ))
      }

      return results

    } catch (error: any) {
      this.log('warn', `获取IP报告失败: ${error.message}`)
      return []
    }
  }

  /**
   * 根据滥用类别确定威胁等级
   */
  private getCategorySeverity(category: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityCategories = [
      'DDoS Attack', 'Hacking', 'SQL Injection', 'Exploited Host', 
      'Web App Attack', 'Brute-Force', 'SSH'
    ]
    
    const mediumSeverityCategories = [
      'Phishing', 'Fraud Orders', 'Port Scan', 'Spoofing', 
      'Bad Web Bot', 'IoT Targeted'
    ]
    
    if (highSeverityCategories.includes(category)) {
      return 'high'
    } else if (mediumSeverityCategories.includes(category)) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      // 使用一个已知的测试IP进行检查
      const testIP = '8.8.8.8' // Google DNS
      const url = `${this.baseUrl}/check`
      const params = new URLSearchParams({
        ipAddress: testIP,
        maxAgeInDays: '90'
      })

      const response = await this.makeRequest(`${url}?${params}`, {
        headers: {
          'Key': this.apiKey,
          'Accept': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      return false
    }
  }
}