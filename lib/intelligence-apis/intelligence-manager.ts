/**
 * 统一情报管理器
 * 
 * 整合所有情报API模块，提供统一的查询接口和跨域关联分析
 */

import { 
    IntelligenceDataPoint, 
    IntelligenceReport, 
    CorrelationResult, 
    QueryOptions, 
    APIProvider 
  } from './types'
  
  import { createSecurityProviders, querySecurityIntelligence } from './security'
  import { createGeopoliticalProviders, queryGeopoliticalIntelligence } from './geopolitical'
  import { createBusinessProviders, queryBusinessIntelligence } from './business'
  import { createNewsProviders, queryNewsIntelligence } from './news'
  
  export interface IntelligenceManagerOptions {
    enabledCategories?: ('security' | 'geopolitical' | 'business' | 'news')[]
    defaultMaxResults?: number
    enableCaching?: boolean
    enableCorrelationAnalysis?: boolean
  }
  
  export class IntelligenceManager {
    private providers: Map<string, APIProvider> = new Map()
    private options: IntelligenceManagerOptions
    private correlationCache: Map<string, CorrelationResult[]> = new Map()
  
    constructor(options: IntelligenceManagerOptions = {}) {
      this.options = {
        enabledCategories: ['security', 'geopolitical', 'business', 'news'],
        defaultMaxResults: 50,
        enableCaching: true,
        enableCorrelationAnalysis: true,
        ...options
      }
  
      this.initializeProviders()
    }
  
    /**
     * 初始化所有API提供商
     */
    private initializeProviders(): void {
      console.log('🔧 初始化情报API提供商...')
  
      const { enabledCategories } = this.options
  
      // 安全情报提供商
      if (enabledCategories?.includes('security')) {
        const securityProviders = createSecurityProviders()
        securityProviders.forEach(provider => {
          this.providers.set(provider.name, provider)
        })
        console.log(`✅ 已加载 ${securityProviders.length} 个安全情报提供商`)
      }
  
      // 地缘政治情报提供商
      if (enabledCategories?.includes('geopolitical')) {
        const geoProviders = createGeopoliticalProviders()
        geoProviders.forEach(provider => {
          this.providers.set(provider.name, provider)
        })
        console.log(`✅ 已加载 ${geoProviders.length} 个地缘政治情报提供商`)
      }
  
      // 商业情报提供商
      if (enabledCategories?.includes('business')) {
        const businessProviders = createBusinessProviders()
        businessProviders.forEach(provider => {
          this.providers.set(provider.name, provider)
        })
        console.log(`✅ 已加载 ${businessProviders.length} 个商业情报提供商`)
      }
  
      // 新闻情报提供商
      if (enabledCategories?.includes('news')) {
        const newsProviders = createNewsProviders()
        newsProviders.forEach(provider => {
          this.providers.set(provider.name, provider)
        })
        console.log(`✅ 已加载 ${newsProviders.length} 个新闻情报提供商`)
      }
  
      console.log(`🎯 情报管理器初始化完成，共加载 ${this.providers.size} 个API提供商`)
    }
  
    /**
     * 综合情报查询
     */
    async comprehensiveQuery(
      query: string,
      options: QueryOptions & {
        categories?: ('security' | 'geopolitical' | 'business' | 'news')[]
        providers?: string[]
        analysisType?: 'threat_assessment' | 'geopolitical_analysis' | 'business_intelligence' | 'comprehensive'
      } = {}
    ): Promise<IntelligenceReport> {
      const startTime = Date.now()
      console.log(`🔍 开始综合情报查询: "${query}"`)
  
      const {
        categories = this.options.enabledCategories || [],
        maxResults = this.options.defaultMaxResults,
        analysisType = 'comprehensive'
      } = options
  
      const allDataPoints: IntelligenceDataPoint[] = []
      const sources = { successful: [], failed: [], rateLimited: [] }
  
      // 并行查询各个类别
      const queryPromises = categories.map(async (category) => {
        try {
          console.log(`🔍 查询${category}情报...`)
          
          let categoryResults: any
          
          switch (category) {
            case 'security':
              categoryResults = await querySecurityIntelligence(query, {
                maxResults: Math.ceil(maxResults / categories.length),
                useCache: options.useCache
              })
              break
              
            case 'geopolitical':
              categoryResults = await queryGeopoliticalIntelligence(query, {
                maxResults: Math.ceil(maxResults / categories.length),
                useCache: options.useCache,
                timeRange: options.timeRange,
                geoFilter: options.geoFilter
              })
              break
              
            case 'business':
              categoryResults = await queryBusinessIntelligence(query, {
                maxResults: Math.ceil(maxResults / categories.length),
                useCache: options.useCache
              })
              break
              
            case 'news':
              categoryResults = await queryNewsIntelligence(query, {
                maxResults: Math.ceil(maxResults / categories.length),
                useCache: options.useCache,
                timeRange: options.timeRange
              })
              break
              
            default:
              return { data: [], sources: { successful: [], failed: [], rateLimited: [] } }
          }
  
          if (categoryResults.success) {
            sources.successful.push(...categoryResults.sources)
            console.log(`✅ ${category}: ${categoryResults.totalResults} 条结果`)
            return categoryResults.data || []
          } else {
            sources.failed.push(`${category}-aggregator`)
            console.warn(`❌ ${category}查询失败`)
            return []
          }
  
        } catch (error: any) {
          console.error(`❌ ${category}查询异常:`, error.message)
          sources.failed.push(`${category}-aggregator`)
          return []
        }
      })
  
      const categoryResults = await Promise.all(queryPromises)
      allDataPoints.push(...categoryResults.flat())
  
      // 数据处理和去重
      const processedData = this.processAndDeduplicateData(allDataPoints)
  
      // 跨域关联分析
      let correlations: CorrelationResult[] = []
      if (this.options.enableCorrelationAnalysis && processedData.length > 1) {
        correlations = await this.performCorrelationAnalysis(processedData, query)
      }
  
      // 威胁等级评估
      const overallThreatLevel = this.assessOverallThreatLevel(processedData)
  
      // 生成报告
      const report = this.generateIntelligenceReport(
        query,
        analysisType,
        processedData,
        correlations,
        overallThreatLevel,
        sources,
        startTime
      )
  
      console.log(`✅ 综合情报查询完成: ${report.summary.totalDataPoints} 条数据，威胁等级: ${report.summary.overallThreatLevel}`)
      
      return report
    }
  
    /**
     * 威胁评估专项查询
     */
    async threatAssessment(indicator: string, type?: 'ip' | 'domain' | 'url' | 'hash'): Promise<IntelligenceReport> {
      return this.comprehensiveQuery(indicator, {
        categories: ['security'],
        analysisType: 'threat_assessment',
        maxResults: 30,
        priority: 'high'
      })
    }
  
    /**
     * 地缘政治风险分析
     */
    async geopoliticalRiskAnalysis(region: string, timeRange?: { from: Date; to: Date }): Promise<IntelligenceReport> {
      return this.comprehensiveQuery(region, {
        categories: ['geopolitical', 'news'],
        analysisType: 'geopolitical_analysis',
        maxResults: 50,
        timeRange,
        geoFilter: [region]
      })
    }
  
    /**
     * 商业情报分析
     */
    async businessIntelligenceAnalysis(target: string): Promise<IntelligenceReport> {
      return this.comprehensiveQuery(target, {
        categories: ['business', 'news'],
        analysisType: 'business_intelligence',
        maxResults: 40
      })
    }
  
    /**
     * 数据处理和去重
     */
    private processAndDeduplicateData(dataPoints: IntelligenceDataPoint[]): IntelligenceDataPoint[] {
      console.log(`🔄 开始数据处理: ${dataPoints.length} 条原始数据`)
  
      // 1. 基于内容相似度去重
      const deduplicatedData = this.deduplicateByContent(dataPoints)
      
      // 2. 数据质量评分重新计算
      const qualityEnhancedData = this.enhanceDataQuality(deduplicatedData)
      
      // 3. 按置信度和时效性排序
      const sortedData = qualityEnhancedData.sort((a, b) => {
        const timeScore = (item: IntelligenceDataPoint) => {
          const age = Date.now() - new Date(item.timestamp).getTime()
          const days = age / (1000 * 60 * 60 * 24)
          return Math.max(0, 1 - days / 30) // 30天内的数据有时效性加分
        }
        
        const scoreA = a.confidence * 0.7 + timeScore(a) * 0.3
        const scoreB = b.confidence * 0.7 + timeScore(b) * 0.3
        
        return scoreB - scoreA
      })
  
      console.log(`✅ 数据处理完成: ${sortedData.length} 条高质量数据`)
      return sortedData
    }
  
    /**
     * 基于内容的去重
     */
    private deduplicateByContent(dataPoints: IntelligenceDataPoint[]): IntelligenceDataPoint[] {
      const seen = new Set<string>()
      const deduplicated: IntelligenceDataPoint[] = []
  
      for (const item of dataPoints) {
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
    private generateContentFingerprint(item: IntelligenceDataPoint): string {
      const keyContent = [
        item.source.name,
        item.category,
        item.subcategory,
        item.content.title.substring(0, 100),
        JSON.stringify(item.content.indicators).substring(0, 100)
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
    private enhanceDataQuality(dataPoints: IntelligenceDataPoint[]): IntelligenceDataPoint[] {
      return dataPoints.map(item => {
        let enhancedConfidence = item.confidence
  
        // 基于来源可信度调整
        const trustedSources = [
          'GDELT Project', 'World Bank', 'REST Countries',
          'AlienVault OTX', 'VirusTotal', 'AbuseIPDB',
          'Alpha Vantage', 'CoinGecko'
        ]
        
        if (trustedSources.some(source => item.source.name.includes(source))) {
          enhancedConfidence = Math.min(1.0, enhancedConfidence + 0.1)
        }
  
        // 基于数据完整性调整
        const dataCompleteness = this.calculateDataCompleteness(item.content)
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
    private calculateDataCompleteness(content: any): number {
      if (!content || typeof content !== 'object') return 0.3
  
      const fields = Object.keys(content)
      const nonEmptyFields = fields.filter(field => {
        const value = content[field]
        return value !== null && value !== undefined && value !== ''
      })
  
      return nonEmptyFields.length / Math.max(fields.length, 1)
    }
  
    /**
     * 跨域关联分析
     */
    private async performCorrelationAnalysis(
      dataPoints: IntelligenceDataPoint[], 
      query: string
    ): Promise<CorrelationResult[]> {
      console.log('🔗 开始跨域关联分析...')
  
      const cacheKey = `correlation-${query}-${dataPoints.length}`
      if (this.correlationCache.has(cacheKey)) {
        return this.correlationCache.get(cacheKey)!
      }
  
      const correlations: CorrelationResult[] = []
      const securityData = dataPoints.filter(item => item.category === 'security')
      const geoData = dataPoints.filter(item => item.category === 'geopolitical')
      const businessData = dataPoints.filter(item => item.category === 'business')
      const newsData = dataPoints.filter(item => item.category === 'news')
  
      // 安全-地缘政治关联
      if (securityData.length > 0 && geoData.length > 0) {
        const secGeoCorrelations = this.findSecurityGeopoliticalCorrelations(securityData, geoData)
        correlations.push(...secGeoCorrelations)
      }
  
      // 地缘政治-商业关联
      if (geoData.length > 0 && businessData.length > 0) {
        const geoBusinessCorrelations = this.findGeopoliticalBusinessCorrelations(geoData, businessData)
        correlations.push(...geoBusinessCorrelations)
      }
  
      // 安全-商业关联
      if (securityData.length > 0 && businessData.length > 0) {
        const secBusinessCorrelations = this.findSecurityBusinessCorrelations(securityData, businessData)
        correlations.push(...secBusinessCorrelations)
      }
  
      // 新闻关联分析
      if (newsData.length > 0) {
        const newsCorrelations = this.findNewsCorrelations(newsData, [...securityData, ...geoData, ...businessData])
        correlations.push(...newsCorrelations)
      }
  
      // 缓存结果
      this.correlationCache.set(cacheKey, correlations)
  
      console.log(`✅ 关联分析完成: 发现 ${correlations.length} 个关联关系`)
      return correlations
    }
  
    /**
     * 安全-地缘政治关联分析
     */
    private findSecurityGeopoliticalCorrelations(
      securityData: IntelligenceDataPoint[], 
      geoData: IntelligenceDataPoint[]
    ): CorrelationResult[] {
      const correlations: CorrelationResult[] = []
  
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
                relatedDataPoints: [secItem.id, geoItem.id],
                significance: secItem.severity === 'high' || geoItem.severity === 'high' ? 'high' : 'medium',
                recommendedActions: ['加强该地区安全监控', '评估政治稳定性影响']
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
    private findGeopoliticalBusinessCorrelations(
      geoData: IntelligenceDataPoint[], 
      businessData: IntelligenceDataPoint[]
    ): CorrelationResult[] {
      const correlations: CorrelationResult[] = []
  
      geoData.forEach(geoItem => {
        if (geoItem.severity === 'high' || geoItem.severity === 'critical') {
          const affectedRegion = this.extractLocation(geoItem)
          if (affectedRegion) {
            businessData.forEach(bizItem => {
              if (bizItem.subcategory === 'stock_quote' || bizItem.subcategory === 'crypto_analysis') {
                correlations.push({
                  type: 'geo-business',
                  confidence: 0.6,
                  description: `${affectedRegion}的政治事件可能影响相关市场表现`,
                  relatedDataPoints: [geoItem.id, bizItem.id],
                  significance: 'medium',
                  recommendedActions: ['监控市场波动', '评估投资风险']
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
    private findSecurityBusinessCorrelations(
      securityData: IntelligenceDataPoint[], 
      businessData: IntelligenceDataPoint[]
    ): CorrelationResult[] {
      const correlations: CorrelationResult[] = []
  
      securityData.forEach(secItem => {
        if (secItem.severity === 'high' || secItem.severity === 'critical') {
          businessData.forEach(bizItem => {
            if (bizItem.subcategory === 'company_profile' || bizItem.subcategory === 'stock_quote') {
              const companyName = this.extractCompanyName(bizItem)
              if (companyName && this.isSecurityThreatRelevant(secItem, companyName)) {
                correlations.push({
                  type: 'security-business',
                  confidence: 0.8,
                  description: `安全威胁可能影响${companyName}的业务安全`,
                  relatedDataPoints: [secItem.id, bizItem.id],
                  significance: 'high',
                  recommendedActions: ['加强企业安全防护', '评估业务连续性风险']
                })
              }
            }
          })
        }
      })
  
      return correlations
    }
  
    /**
     * 新闻关联分析
     */
    private findNewsCorrelations(
      newsData: IntelligenceDataPoint[], 
      otherData: IntelligenceDataPoint[]
    ): CorrelationResult[] {
      const correlations: CorrelationResult[] = []
  
      newsData.forEach(newsItem => {
        if (newsItem.content.importance === 'high') {
          otherData.forEach(otherItem => {
            const commonIndicators = this.findCommonIndicators(newsItem, otherItem)
            if (commonIndicators.length > 0) {
              correlations.push({
                type: 'cross-domain',
                confidence: 0.5,
                description: `新闻报道与${otherItem.category}情报存在共同关注点: ${commonIndicators.join(', ')}`,
                relatedDataPoints: [newsItem.id, otherItem.id],
                significance: 'medium',
                recommendedActions: ['关注媒体报道趋势', '验证信息准确性']
              })
            }
          })
        }
      })
  
      return correlations
    }
  
    /**
     * 评估整体威胁等级
     */
    private assessOverallThreatLevel(dataPoints: IntelligenceDataPoint[]): 'low' | 'medium' | 'high' | 'critical' {
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
     * 生成情报报告
     */
    private generateIntelligenceReport(
      query: string,
      analysisType: string,
      dataPoints: IntelligenceDataPoint[],
      correlations: CorrelationResult[],
      overallThreatLevel: 'low' | 'medium' | 'high' | 'critical',
      sources: any,
      startTime: number
    ): IntelligenceReport {
      
      const securityData = dataPoints.filter(item => item.category === 'security')
      const geoData = dataPoints.filter(item => item.category === 'geopolitical')
      const businessData = dataPoints.filter(item => item.category === 'business')
      const newsData = dataPoints.filter(item => item.category === 'news')
  
      // 提取关键发现
      const keyFindings = this.extractKeyFindings(dataPoints, correlations)
      
      // 生成建议
      const recommendations = this.generateRecommendations(dataPoints, overallThreatLevel, correlations)
  
      // 计算平均置信度
      const averageConfidence = dataPoints.length > 0 
        ? dataPoints.reduce((sum, item) => sum + item.confidence, 0) / dataPoints.length
        : 0
  
      return {
        id: `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query,
        analysisType: analysisType as any,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        
        summary: {
          totalDataPoints: dataPoints.length,
          averageConfidence,
          overallThreatLevel,
          keyFindings,
          recommendations
        },
        
        dataBreakdown: {
          security: {
            count: securityData.length,
            highRiskIndicators: securityData.filter(item => 
              item.severity === 'high' || item.severity === 'critical'
            ),
            threatSources: [...new Set(securityData.map(item => item.source.name))]
          },
          geopolitical: {
            count: geoData.length,
            activeEvents: geoData.filter(item => 
              item.subcategory === 'conflict_event' || 
              (item.severity === 'high' || item.severity === 'critical')
            ),
            affectedRegions: [...new Set(geoData.map(item => item.content.location).filter(Boolean))]
          },
          business: {
            count: businessData.length,
            marketIndicators: businessData.filter(item => 
              item.subcategory === 'stock_quote' || item.subcategory === 'crypto_analysis'
            ),
            financialRisks: this.extractFinancialRisks(businessData)
          },
          news: {
            count: newsData.length,
            breakingNews: newsData.filter(item => 
              item.content.importance === 'high'
            ),
            sentimentAnalysis: this.analyzeSentiment(newsData)
          }
        },
        
        correlations,
        rawData: dataPoints,
        sources
      }
    }
  
    // 辅助方法实现
    private extractLocation(item: IntelligenceDataPoint): string | null {
      return item.content.location || null
    }
  
    private locationsMatch(loc1: string, loc2: string): boolean {
      const normalize = (str: string) => str.toLowerCase().trim()
      return normalize(loc1) === normalize(loc2) || 
             normalize(loc1).includes(normalize(loc2)) || 
             normalize(loc2).includes(normalize(loc1))
    }
  
    private extractCompanyName(item: IntelligenceDataPoint): string | null {
      return item.content.companyName || item.content.name || null
    }
  
    private isSecurityThreatRelevant(secItem: IntelligenceDataPoint, companyName: string): boolean {
      const secData = JSON.stringify(secItem.content).toLowerCase()
      const company = companyName.toLowerCase()
      
      return secData.includes(company) || 
             secData.includes(company.replace(/\s+/g, '')) ||
             secData.includes(company.split(' ')[0])
    }
  
    private findCommonIndicators(item1: IntelligenceDataPoint, item2: IntelligenceDataPoint): string[] {
      const indicators1 = new Set(item1.content.indicators || [])
      const indicators2 = new Set(item2.content.indicators || [])
      
      return Array.from(indicators1).filter(indicator => indicators2.has(indicator))
    }
  
    private extractKeyFindings(dataPoints: IntelligenceDataPoint[], correlations: CorrelationResult[]): string[] {
      const findings: string[] = []
      
      const highSeverityCount = dataPoints.filter(item => 
        item.severity === 'high' || item.severity === 'critical'
      ).length
      
      if (highSeverityCount > 0) {
        findings.push(`发现 ${highSeverityCount} 个高风险指标`)
      }
      
      if (correlations.length > 0) {
        findings.push(`识别出 ${correlations.length} 个跨领域关联关系`)
      }
      
      const uniqueSources = new Set(dataPoints.map(item => item.source.name)).size
      if (uniqueSources >= 5) {
        findings.push(`数据来源广泛，覆盖 ${uniqueSources} 个独立信源`)
      }
      
      return findings
    }
  
    private generateRecommendations(
      dataPoints: IntelligenceDataPoint[], 
      threatLevel: string, 
      correlations: CorrelationResult[]
    ): string[] {
      const recommendations: string[] = []
      
      if (threatLevel === 'critical' || threatLevel === 'high') {
        recommendations.push('建议立即采取防护措施，加强安全监控')
        recommendations.push('建议通知相关安全团队，启动应急响应流程')
      }
      
      if (correlations.length > 0) {
        recommendations.push('建议重点关注发现的跨领域关联关系')
        
        // 添加具体的关联建议
        const actionSet = new Set<string>()
        correlations.forEach(corr => {
          corr.recommendedActions?.forEach(action => actionSet.add(action))
        })
        recommendations.push(...Array.from(actionSet))
      }
      
      const lowConfidenceItems = dataPoints.filter(item => item.confidence < 0.5).length
      if (lowConfidenceItems > dataPoints.length * 0.3) {
        recommendations.push('建议获取更多高质量数据源以提高分析准确性')
      }
      
      return recommendations
    }
  
    private extractFinancialRisks(businessData: IntelligenceDataPoint[]): string[] {
      const risks = new Set<string>()
      
      businessData.forEach(item => {
        if (item.subcategory === 'stock_quote' && item.content.changePercent && item.content.changePercent < -10) {
          risks.add('股价大幅下跌风险')
        }
        
        if (item.subcategory === 'crypto_analysis' && item.content.priceChange24h && item.content.priceChange24h < -20) {
          risks.add('加密货币市场波动风险')
        }
        
        if (item.content.riskFactors && Array.isArray(item.content.riskFactors)) {
          item.content.riskFactors.forEach((risk: string) => risks.add(risk))
        }
      })
      
      return Array.from(risks)
    }
  
    private analyzeSentiment(newsData: IntelligenceDataPoint[]): {
      positive: number
      negative: number
      neutral: number
    } {
      let positive = 0, negative = 0, neutral = 0
      
      newsData.forEach(item => {
        switch (item.content.sentiment) {
          case 'positive': positive++; break
          case 'negative': negative++; break
          case 'neutral': neutral++; break
          default: neutral++; break
        }
      })
      
      const total = positive + negative + neutral
      return {
        positive: total > 0 ? positive / total : 0,
        negative: total > 0 ? negative / total : 0,
        neutral: total > 0 ? neutral / total : 0
      }
    }
  
    /**
     * 获取系统状态
     */
    async getSystemStatus(): Promise<{
      totalProviders: number
      enabledProviders: number
      providersByCategory: Record<string, number>
      overallHealth: 'healthy' | 'degraded' | 'unhealthy'
      details: Record<string, any>
    }> {
      const details: Record<string, any> = {}
      let healthyProviders = 0
      const providersByCategory: Record<string, number> = {}
  
      for (const [name, provider] of this.providers) {
        try {
          const status = await provider.getStatus()
          details[name] = {
            category: provider.category,
            enabled: provider.enabled,
            available: status.available,
            rateLimit: provider.rateLimit
          }
  
          if (status.available) {
            healthyProviders++
          }
  
          providersByCategory[provider.category] = (providersByCategory[provider.category] || 0) + 1
  
        } catch (error: any) {
          details[name] = {
            category: provider.category,
            enabled: false,
            available: false,
            error: error.message
          }
        }
      }
  
      const totalProviders = this.providers.size
      const healthRatio = totalProviders > 0 ? healthyProviders / totalProviders : 0
  
      let overallHealth: 'healthy' | 'degraded' | 'unhealthy'
      if (healthRatio >= 0.8) {
        overallHealth = 'healthy'
      } else if (healthRatio >= 0.5) {
        overallHealth = 'degraded'
      } else {
        overallHealth = 'unhealthy'
      }
  
      return {
        totalProviders,
        enabledProviders: healthyProviders,
        providersByCategory,
        overallHealth,
        details
      }
    }
  
    /**
     * 清理缓存
     */
    clearAllCaches(): void {
      this.correlationCache.clear()
      
      // 清理各个提供商的缓存
      for (const provider of this.providers.values()) {
        if (provider.clearCache) {
          provider.clearCache()
        }
      }
      
      console.log('🧹 所有缓存已清理')
    }
  }
  
  // 导出单例实例
  export const intelligenceManager = new IntelligenceManager()
  
  // 便捷函数
  export async function performThreatAssessment(indicator: string): Promise<IntelligenceReport> {
    return intelligenceManager.threatAssessment(indicator)
  }
  
  export async function analyzeGeopoliticalRisk(region: string): Promise<IntelligenceReport> {
    return intelligenceManager.geopoliticalRiskAnalysis(region)
  }
  
  export async function analyzeBusinessIntelligence(target: string): Promise<IntelligenceReport> {
    return intelligenceManager.businessIntelligenceAnalysis(target)
  }
  
  export async function comprehensiveIntelligenceAnalysis(query: string): Promise<IntelligenceReport> {
    return intelligenceManager.comprehensiveQuery(query)
  }
  