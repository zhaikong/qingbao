/**
 * 统一OSINT数据聚合器
 * 
 * 核心功能：
 * 1. 多维度情报数据统一管理
 * 2. 智能数据融合和去重
 * 3. 跨领域关联分析
 * 4. 威胁等级评估
 * 5. 自动化报告生成
 * 6. 实时监控和预警
 */

import { 
  osintManager, 
  OSINTDataPoint, 
  OSINTQueryResult, 
  OSINTQueryOptions 
} from './osint-framework'

import { 
  securityIntelligence,
  AlienVaultOTXProvider,
  VirusTotalProvider,
  AbuseIPDBProvider,
  URLVoidProvider
} from './osint-security-providers'

import {
  geopoliticalIntelligence,
  GDELTProvider,
  ACLEDProvider,
  RestCountriesProvider,
  WorldBankProvider
} from './osint-geopolitics-providers'

import {
  businessIntelligence,
  AlphaVantageProvider,
  PolygonProvider,
  OpenCorporatesProvider,
  CoinGeckoProvider,
  BusinessNewsProvider
} from './osint-business-providers'

export interface OSINTAnalysisReport {
  query: string
  analysisType: 'threat_assessment' | 'geopolitical_analysis' | 'business_intelligence' | 'comprehensive'
  timestamp: string
  executionTime: number
  
  summary: {
    totalDataPoints: number
    confidence: number
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
    keyFindings: string[]
    recommendations: string[]
  }
  
  dataBreakdown: {
    security: {
      count: number
      highRiskIndicators: OSINTDataPoint[]
      threatSources: string[]
    }
    geopolitical: {
      count: number
      activeConflicts: OSINTDataPoint[]
      politicalRisks: string[]
    }
    business: {
      count: number
      marketIndicators: OSINTDataPoint[]
      financialRisks: string[]
    }
    correlations: Array<{
      type: 'security-geo' | 'geo-business' | 'security-business'
      confidence: number
      description: string
      relatedDataPoints: string[]
    }>
  }
  
  rawData: OSINTDataPoint[]
  sources: {
    successful: string[]
    failed: string[]
    rateLimited: string[]
  }
}

export interface OSINTMonitoringRule {
  id: string
  name: string
  description: string
  enabled: boolean
  categories: ('security' | 'geopolitics' | 'business')[]
  keywords: string[]
  geoFilter?: string[]
  severity?: ('low' | 'medium' | 'high' | 'critical')[]
  checkInterval: number // 分钟
  lastCheck?: string
  alertThreshold: number
  notifications: {
    email?: string[]
    webhook?: string
  }
}

/**
 * 统一OSINT聚合器
 */
export class UnifiedOSINTAggregator {
  private monitoringRules: Map<string, OSINTMonitoringRule> = new Map()
  private alertHistory: Map<string, any[]> = new Map()

  constructor() {
    this.initializeProviders()
  }

  /**
   * 初始化所有OSINT提供商
   */
  private initializeProviders(): void {
    console.log('🔧 初始化OSINT提供商...')

    // 安全情报提供商
    if (process.env.ALIENVAULT_OTX_API_KEY) {
      osintManager.registerProvider(new AlienVaultOTXProvider(process.env.ALIENVAULT_OTX_API_KEY))
    }
    if (process.env.VIRUSTOTAL_API_KEY) {
      osintManager.registerProvider(new VirusTotalProvider(process.env.VIRUSTOTAL_API_KEY))
    }
    if (process.env.ABUSEIPDB_API_KEY) {
      osintManager.registerProvider(new AbuseIPDBProvider(process.env.ABUSEIPDB_API_KEY))
    }
    if (process.env.URLVOID_API_KEY) {
      osintManager.registerProvider(new URLVoidProvider(process.env.URLVOID_API_KEY))
    }

    // 地缘政治提供商
    osintManager.registerProvider(new GDELTProvider())
    osintManager.registerProvider(new RestCountriesProvider())
    osintManager.registerProvider(new WorldBankProvider())
    
    if (process.env.ACLED_API_KEY && process.env.ACLED_EMAIL) {
      osintManager.registerProvider(new ACLEDProvider(process.env.ACLED_API_KEY, process.env.ACLED_EMAIL))
    }

    // 商业情报提供商
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      osintManager.registerProvider(new AlphaVantageProvider(process.env.ALPHA_VANTAGE_API_KEY))
    }
    if (process.env.POLYGON_API_KEY) {
      osintManager.registerProvider(new PolygonProvider(process.env.POLYGON_API_KEY))
    }
    if (process.env.OPENCORPORATES_API_TOKEN) {
      osintManager.registerProvider(new OpenCorporatesProvider(process.env.OPENCORPORATES_API_TOKEN))
    }
    
    osintManager.registerProvider(new CoinGeckoProvider())
    
    if (process.env.NEWSAPI_KEY) {
      osintManager.registerProvider(new BusinessNewsProvider(process.env.NEWSAPI_KEY))
    }

    console.log('✅ OSINT提供商初始化完成')
  }

  /**
   * 综合情报分析
   */
  async comprehensiveAnalysis(
    query: string,
    options: {
      analysisType?: 'threat_assessment' | 'geopolitical_analysis' | 'business_intelligence' | 'comprehensive'
      includeCategories?: ('security' | 'geopolitics' | 'business')[]
      maxResults?: number
      minConfidence?: number
      timeRange?: { from: Date; to: Date }
      geoFilter?: string[]
      urgency?: 'low' | 'medium' | 'high' | 'critical'
    } = {}
  ): Promise<OSINTAnalysisReport> {
    
    const {
      analysisType = 'comprehensive',
      includeCategories = ['security', 'geopolitics', 'business'],
      maxResults = 100,
      minConfidence = 0.3,
      timeRange,
      geoFilter,
      urgency = 'medium'
    } = options

    console.log(`🔍 开始综合OSINT分析: "${query}"`)
    console.log(`📋 分析类型: ${analysisType}`)
    console.log(`📊 包含类别: ${includeCategories.join(', ')}`)

    const startTime = Date.now()
    let allDataPoints: OSINTDataPoint[] = []
    const sources = { successful: [], failed: [], rateLimited: [] }

    // 并行查询所有相关类别
    const queryPromises = includeCategories.map(async category => {
      try {
        console.log(`🔍 查询${category}情报...`)
        
        const categoryResults = await osintManager.queryByCategory(category, query, {
          maxResults: Math.ceil(maxResults / includeCategories.length),
          minConfidence,
          timeRange,
          geoFilter,
          priority: urgency
        })

        sources.successful.push(...categoryResults.sources.successful)
        sources.failed.push(...categoryResults.sources.failed)
        sources.rateLimited.push(...categoryResults.sources.rateLimited)

        console.log(`✅ ${category}: ${categoryResults.results.length} 条结果`)
        return categoryResults.results

      } catch (error: any) {
        console.error(`❌ ${category}查询失败:`, error.message)
        sources.failed.push(`${category}-aggregator`)
        return []
      }
    })

    const categoryResults = await Promise.all(queryPromises)
    allDataPoints = categoryResults.flat()

    // 智能数据融合和去重
    const processedData = this.intelligentDataFusion(allDataPoints)

    // 跨领域关联分析
    const correlations = this.crossDomainCorrelationAnalysis(processedData)

    // 威胁等级评估
    const threatLevel = this.assessOverallThreatLevel(processedData)

    // 生成分析报告
    const report = await this.generateAnalysisReport(
      query,
      analysisType,
      processedData,
      correlations,
      threatLevel,
      sources,
      startTime
    )

    console.log(`✅ 综合OSINT分析完成: ${report.summary.totalDataPoints} 条数据，威胁等级: ${report.summary.threatLevel}`)
    
    return report
  }

  /**
   * 威胁评估专项分析
   */
  async threatAssessment(indicator: string, type?: 'ip' | 'domain' | 'url' | 'hash'): Promise<OSINTAnalysisReport> {
    return this.comprehensiveAnalysis(indicator, {
      analysisType: 'threat_assessment',
      includeCategories: ['security'],
      maxResults: 50,
      minConfidence: 0.5,
      urgency: 'high'
    })
  }

  /**
   * 地缘政治风险分析
   */
  async geopoliticalRiskAnalysis(region: string, timeRange?: { from: Date; to: Date }): Promise<OSINTAnalysisReport> {
    return this.comprehensiveAnalysis(region, {
      analysisType: 'geopolitical_analysis',
      includeCategories: ['geopolitics'],
      maxResults: 100,
      timeRange,
      geoFilter: [region]
    })
  }

  /**
   * 商业情报分析
   */
  async businessIntelligenceAnalysis(target: string): Promise<OSINTAnalysisReport> {
    return this.comprehensiveAnalysis(target, {
      analysisType: 'business_intelligence',
      includeCategories: ['business'],
      maxResults: 50,
      minConfidence: 0.4
    })
  }

  /**
   * 智能数据融合
   */
  private intelligentDataFusion(dataPoints: OSINTDataPoint[]): OSINTDataPoint[] {
    console.log(`🔄 开始智能数据融合: ${dataPoints.length} 条原始数据`)

    // 1. 基于内容相似度去重
    const deduplicatedData = this.deduplicateByContent(dataPoints)
    
    // 2. 数据质量评分重新计算
    const qualityEnhancedData = this.enhanceDataQuality(deduplicatedData)
    
    // 3. 按置信度和时效性排序
    const sortedData = qualityEnhancedData.sort((a, b) => {
      const timeScore = (item: OSINTDataPoint) => {
        const age = Date.now() - new Date(item.timestamp).getTime()
        const days = age / (1000 * 60 * 60 * 24)
        return Math.max(0, 1 - days / 30) // 30天内的数据有时效性加分
      }
      
      const scoreA = a.confidence * 0.7 + timeScore(a) * 0.3
      const scoreB = b.confidence * 0.7 + timeScore(b) * 0.3
      
      return scoreB - scoreA
    })

    console.log(`✅ 数据融合完成: ${sortedData.length} 条高质量数据`)
    return sortedData
  }

  /**
   * 基于内容的去重
   */
  private deduplicateByContent(dataPoints: OSINTDataPoint[]): OSINTDataPoint[] {
    const seen = new Set<string>()
    const deduplicated: OSINTDataPoint[] = []

    for (const item of dataPoints) {
      // 生成内容指纹
      const fingerprint = this.generateContentFingerprint(item)
      
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint)
        deduplicated.push(item)
      }
    }

    return deduplicated
  }

  /**
   * 生成内容指纹
   */
  private generateContentFingerprint(item: OSINTDataPoint): string {
    const keyContent = [
      item.source,
      item.type,
      JSON.stringify(item.data).substring(0, 200)
    ].join('|')
    
    // 简单哈希函数
    let hash = 0
    for (let i = 0; i < keyContent.length; i++) {
      const char = keyContent.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    return hash.toString(36)
  }

  /**
   * 增强数据质量
   */
  private enhanceDataQuality(dataPoints: OSINTDataPoint[]): OSINTDataPoint[] {
    return dataPoints.map(item => {
      // 重新计算置信度
      let enhancedConfidence = item.confidence

      // 基于来源可信度调整
      const trustedSources = [
        'GDELT Project', 'World Bank', 'REST Countries',
        'AlienVault OTX', 'VirusTotal', 'Alpha Vantage'
      ]
      
      if (trustedSources.some(source => item.source.includes(source))) {
        enhancedConfidence = Math.min(1.0, enhancedConfidence + 0.1)
      }

      // 基于数据完整性调整
      const dataCompleteness = this.calculateDataCompleteness(item.data)
      enhancedConfidence = enhancedConfidence * (0.7 + dataCompleteness * 0.3)

      return {
        ...item,
        confidence: enhancedConfidence,
        metadata: {
          ...item.metadata,
          reliability_score: enhancedConfidence,
          tags: [...item.metadata.tags, 'enhanced']
        }
      }
    })
  }

  /**
   * 计算数据完整性
   */
  private calculateDataCompleteness(data: any): number {
    if (!data || typeof data !== 'object') return 0.3

    const fields = Object.keys(data)
    const nonEmptyFields = fields.filter(field => {
      const value = data[field]
      return value !== null && value !== undefined && value !== ''
    })

    return nonEmptyFields.length / Math.max(fields.length, 1)
  }

  /**
   * 跨领域关联分析
   */
  private crossDomainCorrelationAnalysis(dataPoints: OSINTDataPoint[]): any[] {
    console.log('🔗 开始跨领域关联分析...')

    const correlations: any[] = []
    const securityData = dataPoints.filter(item => item.category === 'security')
    const geoData = dataPoints.filter(item => item.category === 'geopolitics')
    const businessData = dataPoints.filter(item => item.category === 'business')

    // 安全-地缘政治关联
    if (securityData.length > 0 && geoData.length > 0) {
      const secGeoCorrelation = this.findSecurityGeopoliticalCorrelations(securityData, geoData)
      correlations.push(...secGeoCorrelation)
    }

    // 地缘政治-商业关联
    if (geoData.length > 0 && businessData.length > 0) {
      const geoBusinessCorrelation = this.findGeopoliticalBusinessCorrelations(geoData, businessData)
      correlations.push(...geoBusinessCorrelation)
    }

    // 安全-商业关联
    if (securityData.length > 0 && businessData.length > 0) {
      const secBusinessCorrelation = this.findSecurityBusinessCorrelations(securityData, businessData)
      correlations.push(...secBusinessCorrelation)
    }

    console.log(`✅ 关联分析完成: 发现 ${correlations.length} 个关联关系`)
    return correlations
  }

  /**
   * 安全-地缘政治关联分析
   */
  private findSecurityGeopoliticalCorrelations(securityData: OSINTDataPoint[], geoData: OSINTDataPoint[]): any[] {
    const correlations: any[] = []

    // 查找地理位置重叠的安全威胁和政治事件
    securityData.forEach(secItem => {
      const secLocation = this.extractLocation(secItem)
      if (secLocation) {
        geoData.forEach(geoItem => {
          const geoLocation = this.extractLocation(geoItem)
          if (geoLocation && this.locationsMatch(secLocation, geoLocation)) {
            correlations.push({
              type: 'security-geo',
              confidence: 0.7,
              description: `安全威胁与${geoLocation}的政治事件存在地理关联`,
              relatedDataPoints: [secItem.id, geoItem.id]
            })
          }
        })
      }
    })

    return correlations
  }

  /**
   * 地缘政治-商业关联分析
   */
  private findGeopoliticalBusinessCorrelations(geoData: OSINTDataPoint[], businessData: OSINTDataPoint[]): any[] {
    const correlations: any[] = []

    // 查找政治事件对市场的影响
    geoData.forEach(geoItem => {
      if (geoItem.severity === 'high' || geoItem.severity === 'critical') {
        const affectedRegion = this.extractLocation(geoItem)
        if (affectedRegion) {
          businessData.forEach(bizItem => {
            if (bizItem.type === 'stock_price' || bizItem.type === 'market_data') {
              correlations.push({
                type: 'geo-business',
                confidence: 0.6,
                description: `${affectedRegion}的政治事件可能影响相关市场表现`,
                relatedDataPoints: [geoItem.id, bizItem.id]
              })
            }
          })
        }
      }
    })

    return correlations
  }

  /**
   * 安全-商业关联分析
   */
  private findSecurityBusinessCorrelations(securityData: OSINTDataPoint[], businessData: OSINTDataPoint[]): any[] {
    const correlations: any[] = []

    // 查找网络安全威胁对企业的影响
    securityData.forEach(secItem => {
      if (secItem.severity === 'high' || secItem.severity === 'critical') {
        businessData.forEach(bizItem => {
          if (bizItem.type === 'company_overview' || bizItem.type === 'stock_price') {
            const companyName = this.extractCompanyName(bizItem)
            if (companyName && this.isSecurityThreatRelevant(secItem, companyName)) {
              correlations.push({
                type: 'security-business',
                confidence: 0.8,
                description: `安全威胁可能影响${companyName}的业务安全`,
                relatedDataPoints: [secItem.id, bizItem.id]
              })
            }
          }
        })
      }
    })

    return correlations
  }

  /**
   * 评估整体威胁等级
   */
  private assessOverallThreatLevel(dataPoints: OSINTDataPoint[]): 'low' | 'medium' | 'high' | 'critical' {
    const severityCounts = {
      critical: dataPoints.filter(item => item.severity === 'critical').length,
      high: dataPoints.filter(item => item.severity === 'high').length,
      medium: dataPoints.filter(item => item.severity === 'medium').length,
      low: dataPoints.filter(item => item.severity === 'low').length
    }

    const highConfidenceItems = dataPoints.filter(item => item.confidence >= 0.8).length
    const totalItems = dataPoints.length

    // 威胁等级评估算法
    if (severityCounts.critical > 0 && highConfidenceItems / totalItems > 0.3) {
      return 'critical'
    }
    if (severityCounts.high > 2 || (severityCounts.critical > 0 && highConfidenceItems > 0)) {
      return 'high'
    }
    if (severityCounts.medium > 3 || severityCounts.high > 0) {
      return 'medium'
    }
    return 'low'
  }

  /**
   * 生成分析报告
   */
  private async generateAnalysisReport(
    query: string,
    analysisType: string,
    dataPoints: OSINTDataPoint[],
    correlations: any[],
    threatLevel: 'low' | 'medium' | 'high' | 'critical',
    sources: any,
    startTime: number
  ): Promise<OSINTAnalysisReport> {
    
    const securityData = dataPoints.filter(item => item.category === 'security')
    const geoData = dataPoints.filter(item => item.category === 'geopolitics')
    const businessData = dataPoints.filter(item => item.category === 'business')

    // 提取关键发现
    const keyFindings = this.extractKeyFindings(dataPoints, correlations)
    
    // 生成建议
    const recommendations = this.generateRecommendations(dataPoints, threatLevel, correlations)

    // 计算平均置信度
    const avgConfidence = dataPoints.length > 0 
      ? dataPoints.reduce((sum, item) => sum + item.confidence, 0) / dataPoints.length
      : 0

    return {
      query,
      analysisType: analysisType as any,
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      
      summary: {
        totalDataPoints: dataPoints.length,
        confidence: avgConfidence,
        threatLevel,
        keyFindings,
        recommendations
      },
      
      dataBreakdown: {
        security: {
          count: securityData.length,
          highRiskIndicators: securityData.filter(item => 
            item.severity === 'high' || item.severity === 'critical'
          ),
          threatSources: [...new Set(securityData.map(item => item.source))]
        },
        geopolitical: {
          count: geoData.length,
          activeConflicts: geoData.filter(item => 
            item.type === 'conflict_event' || 
            (item.severity === 'high' || item.severity === 'critical')
          ),
          politicalRisks: this.extractPoliticalRisks(geoData)
        },
        business: {
          count: businessData.length,
          marketIndicators: businessData.filter(item => 
            item.type === 'stock_price' || item.type === 'market_data'
          ),
          financialRisks: this.extractFinancialRisks(businessData)
        },
        correlations
      },
      
      rawData: dataPoints,
      sources
    }
  }

  // 辅助方法实现
  private extractLocation(item: OSINTDataPoint): string | null {
    const data = item.data
    
    // 尝试从各种字段提取位置信息
    if (data.country) return data.country
    if (data.location) return data.location
    if (data.geo) return data.geo
    if (data.admin1) return data.admin1
    if (data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
      return data.locations[0]
    }
    
    return null
  }

  private locationsMatch(loc1: string, loc2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().trim()
    return normalize(loc1) === normalize(loc2) || 
           normalize(loc1).includes(normalize(loc2)) || 
           normalize(loc2).includes(normalize(loc1))
  }

  private extractCompanyName(item: OSINTDataPoint): string | null {
    const data = item.data
    
    if (data.name) return data.name
    if (data.symbol) return data.symbol
    if (data.company_name) return data.company_name
    
    return null
  }

  private isSecurityThreatRelevant(secItem: OSINTDataPoint, companyName: string): boolean {
    const secData = JSON.stringify(secItem.data).toLowerCase()
    const company = companyName.toLowerCase()
    
    return secData.includes(company) || 
           secData.includes(company.replace(/\s+/g, '')) ||
           secData.includes(company.split(' ')[0])
  }

  private extractKeyFindings(dataPoints: OSINTDataPoint[], correlations: any[]): string[] {
    const findings: string[] = []
    
    // 基于数据统计的发现
    const highSeverityCount = dataPoints.filter(item => 
      item.severity === 'high' || item.severity === 'critical'
    ).length
    
    if (highSeverityCount > 0) {
      findings.push(`发现 ${highSeverityCount} 个高风险指标`)
    }
    
    // 基于关联分析的发现
    if (correlations.length > 0) {
      findings.push(`识别出 ${correlations.length} 个跨领域关联关系`)
    }
    
    // 基于数据源多样性的发现
    const uniqueSources = new Set(dataPoints.map(item => item.source)).size
    if (uniqueSources >= 5) {
      findings.push(`数据来源广泛，覆盖 ${uniqueSources} 个独立信源`)
    }
    
    return findings
  }

  private generateRecommendations(
    dataPoints: OSINTDataPoint[], 
    threatLevel: string, 
    correlations: any[]
  ): string[] {
    const recommendations: string[] = []
    
    if (threatLevel === 'critical' || threatLevel === 'high') {
      recommendations.push('建议立即采取防护措施，加强安全监控')
      recommendations.push('建议通知相关安全团队，启动应急响应流程')
    }
    
    if (correlations.length > 0) {
      recommendations.push('建议重点关注发现的跨领域关联关系')
    }
    
    const lowConfidenceItems = dataPoints.filter(item => item.confidence < 0.5).length
    if (lowConfidenceItems > dataPoints.length * 0.3) {
      recommendations.push('建议获取更多高质量数据源以提高分析准确性')
    }
    
    return recommendations
  }

  private extractPoliticalRisks(geoData: OSINTDataPoint[]): string[] {
    const risks = new Set<string>()
    
    geoData.forEach(item => {
      if (item.severity === 'high' || item.severity === 'critical') {
        const location = this.extractLocation(item)
        if (location) {
          risks.add(`${location}地区政治不稳定`)
        }
      }
      
      if (item.type === 'conflict_event') {
        risks.add('武装冲突风险')
      }
    })
    
    return Array.from(risks)
  }

  private extractFinancialRisks(businessData: OSINTDataPoint[]): string[] {
    const risks = new Set<string>()
    
    businessData.forEach(item => {
      if (item.type === 'stock_price' && item.data.change_24h && item.data.change_24h < -10) {
        risks.add('股价大幅下跌风险')
      }
      
      if (item.type === 'crypto_price' && item.data.change_24h && item.data.change_24h < -20) {
        risks.add('加密货币市场波动风险')
      }
    })
    
    return Array.from(risks)
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): {
    osintManager: any
    securityIntelligence: any
    geopoliticalIntelligence: any
    businessIntelligence: any
    totalProviders: number
    enabledProviders: number
  } {
    const osintStatus = osintManager.getProvidersStatus()
    const securityStatus = securityIntelligence.getProvidersStatus()
    const geoStatus = geopoliticalIntelligence.getProvidersStatus()
    const businessStatus = businessIntelligence.getProvidersStatus()
    
    const allStatuses = { ...osintStatus, ...securityStatus, ...geoStatus, ...businessStatus }
    const totalProviders = Object.keys(allStatuses).length
    const enabledProviders = Object.values(allStatuses).filter((status: any) => status.enabled).length
    
    return {
      osintManager: osintStatus,
      securityIntelligence: securityStatus,
      geopoliticalIntelligence: geoStatus,
      businessIntelligence: businessStatus,
      totalProviders,
      enabledProviders
    }
  }

  /**
   * 清理缓存
   */
  clearAllCaches(): void {
    osintManager.clearCache()
    console.log('🧹 所有OSINT缓存已清理')
  }
}

// 导出统一聚合器实例
export const unifiedOSINTAggregator = new UnifiedOSINTAggregator()

// 便捷函数
export async function performThreatAssessment(indicator: string): Promise<OSINTAnalysisReport> {
  return unifiedOSINTAggregator.threatAssessment(indicator)
}

export async function analyzeGeopoliticalRisk(region: string): Promise<OSINTAnalysisReport> {
  return unifiedOSINTAggregator.geopoliticalRiskAnalysis(region)
}

export async function analyzeBusinessIntelligence(target: string): Promise<OSINTAnalysisReport> {
  return unifiedOSINTAggregator.businessIntelligenceAnalysis(target)
}

export async function comprehensiveOSINTAnalysis(query: string): Promise<OSINTAnalysisReport> {
  return unifiedOSINTAggregator.comprehensiveAnalysis(query)
}