/**
 * 开源情报(OSINT)统一接口框架
 * 
 * 核心功能：
 * 1. 统一的API接口抽象
 * 2. 多维度情报数据采集
 * 3. 自动错误处理和重试
 * 4. 速率限制和配额管理
 * 5. 数据标准化和质量评估
 * 6. 付费接口扩展支持
 */

export interface OSINTApiConfig {
  name: string
  endpoint: string
  apiKey?: string
  rateLimit: {
    requests: number
    period: number // 毫秒
  }
  quota: {
    daily?: number
    monthly?: number
  }
  category: 'security' | 'geopolitics' | 'business' | 'news' | 'reference'
  priority: number
  enabled: boolean
  tier: 'free' | 'premium' | 'enterprise'
  headers?: Record<string, string>
  timeout: number
}

export interface OSINTDataPoint {
  id: string
  source: string
  category: string
  type: string
  timestamp: string
  confidence: number // 0-1
  severity?: 'low' | 'medium' | 'high' | 'critical'
  data: any
  metadata: {
    collection_method: string
    geolocation?: string
    tags: string[]
    reliability_score: number
  }
}

export interface OSINTQueryOptions {
  categories?: string[]
  timeRange?: {
    from: Date
    to: Date
  }
  maxResults?: number
  minConfidence?: number
  priority?: 'low' | 'medium' | 'high' | 'critical'
  includePaid?: boolean
  geoFilter?: string[]
}

export interface OSINTQueryResult {
  query: string
  options: OSINTQueryOptions
  results: OSINTDataPoint[]
  totalFound: number
  sources: {
    successful: string[]
    failed: string[]
    rateLimited: string[]
  }
  metadata: {
    executionTime: number
    confidence: number
    coverage: {
      security: number
      geopolitics: number
      business: number
      news: number
      reference: number
    }
  }
}

/**
 * OSINT API基础抽象类
 */
export abstract class BaseOSINTProvider {
  protected config: OSINTApiConfig
  protected lastRequest: number = 0
  protected requestCount: number = 0
  protected dailyCount: number = 0

  constructor(config: OSINTApiConfig) {
    this.config = config
  }

  /**
   * 检查速率限制
   */
  protected async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequest

    if (timeSinceLastRequest < this.config.rateLimit.period) {
      const waitTime = this.config.rateLimit.period - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequest = Date.now()
    this.requestCount++
    this.dailyCount++
  }

  /**
   * 检查配额限制
   */
  protected checkQuota(): boolean {
    if (this.config.quota.daily && this.dailyCount >= this.config.quota.daily) {
      return false
    }
    return true
  }

  /**
   * 标准化数据格式
   */
  protected abstract normalizeData(rawData: any, query: string): OSINTDataPoint[]

  /**
   * 执行查询
   */
  abstract query(query: string, options?: any): Promise<OSINTDataPoint[]>

  /**
   * 获取提供商状态
   */
  getStatus(): {
    name: string
    enabled: boolean
    category: string
    tier: string
    quotaUsed: { daily: number; monthly?: number }
    lastError?: string
  } {
    return {
      name: this.config.name,
      enabled: this.config.enabled,
      category: this.config.category,
      tier: this.config.tier,
      quotaUsed: {
        daily: this.dailyCount
      }
    }
  }

  /**
   * 重置每日计数器
   */
  resetDailyCounter(): void {
    this.dailyCount = 0
  }
}

/**
 * OSINT管理器
 */
export class OSINTManager {
  private providers: Map<string, BaseOSINTProvider> = new Map()
  private cache: Map<string, { data: OSINTDataPoint[]; timestamp: number; ttl: number }> = new Map()

  /**
   * 注册OSINT提供商
   */
  registerProvider(provider: BaseOSINTProvider): void {
    this.providers.set(provider.getStatus().name, provider)
  }

  /**
   * 统一查询接口
   */
  async query(query: string, options: OSINTQueryOptions = {}): Promise<OSINTQueryResult> {
    console.log(`🔍 开始OSINT查询: "${query}"`)
    console.log(`📋 查询选项:`, options)

    const startTime = Date.now()
    const results: OSINTDataPoint[] = []
    const sources = {
      successful: [] as string[],
      failed: [] as string[],
      rateLimited: [] as string[]
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(query, options)
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`💾 OSINT缓存命中: ${query}`)
      return this.buildQueryResult(query, options, cached.data, sources, startTime)
    }

    // 过滤可用的提供商
    const availableProviders = Array.from(this.providers.values()).filter(provider => {
      const status = provider.getStatus()
      
      // 检查是否启用
      if (!status.enabled) return false
      
      // 检查类别过滤
      if (options.categories && !options.categories.includes(status.category)) return false
      
      // 检查是否包含付费服务
      if (!options.includePaid && status.tier !== 'free') return false
      
      return true
    })

    console.log(`📡 可用提供商 (${availableProviders.length}个):`, 
      availableProviders.map(p => p.getStatus().name))

    // 并行查询所有提供商
    const queryPromises = availableProviders.map(async provider => {
      try {
        console.log(`🔍 查询 ${provider.getStatus().name}...`)
        const providerResults = await provider.query(query, options)
        sources.successful.push(provider.getStatus().name)
        return providerResults
      } catch (error: any) {
        const providerName = provider.getStatus().name
        console.error(`❌ ${providerName} 查询失败:`, error.message)
        
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          sources.rateLimited.push(providerName)
        } else {
          sources.failed.push(providerName)
        }
        
        return []
      }
    })

    const allResults = await Promise.all(queryPromises)
    results.push(...allResults.flat())

    // 数据后处理
    const processedResults = this.postProcessResults(results, options)

    // 缓存结果
    this.cache.set(cacheKey, {
      data: processedResults,
      timestamp: Date.now(),
      ttl: 300000 // 5分钟缓存
    })

    console.log(`✅ OSINT查询完成: ${processedResults.length} 条结果`)
    
    return this.buildQueryResult(query, options, processedResults, sources, startTime)
  }

  /**
   * 按类别查询
   */
  async queryByCategory(
    category: 'security' | 'geopolitics' | 'business' | 'news' | 'reference',
    query: string,
    options: Omit<OSINTQueryOptions, 'categories'> = {}
  ): Promise<OSINTQueryResult> {
    return this.query(query, { ...options, categories: [category] })
  }

  /**
   * 威胁情报查询
   */
  async queryThreatIntelligence(
    indicator: string,
    type: 'ip' | 'domain' | 'url' | 'hash' = 'ip'
  ): Promise<OSINTQueryResult> {
    return this.queryByCategory('security', indicator, {
      maxResults: 50,
      minConfidence: 0.7,
      priority: 'high'
    })
  }

  /**
   * 地缘政治事件查询
   */
  async queryGeopoliticalEvents(
    topic: string,
    region?: string
  ): Promise<OSINTQueryResult> {
    const geoFilter = region ? [region] : undefined
    return this.queryByCategory('geopolitics', topic, {
      maxResults: 100,
      geoFilter,
      timeRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 过去7天
        to: new Date()
      }
    })
  }

  /**
   * 商业情报查询
   */
  async queryBusinessIntelligence(
    company: string,
    includeFinancial: boolean = true
  ): Promise<OSINTQueryResult> {
    return this.queryByCategory('business', company, {
      maxResults: 30,
      includePaid: includeFinancial
    })
  }

  /**
   * 获取所有提供商状态
   */
  getProvidersStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    
    this.providers.forEach((provider, name) => {
      status[name] = provider.getStatus()
    })
    
    return status
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 OSINT缓存已清理')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // 简化实现，实际需要追踪命中率
    }
  }

  // 私有辅助方法
  private generateCacheKey(query: string, options: OSINTQueryOptions): string {
    return `osint:${query}:${JSON.stringify(options)}`
  }

  private postProcessResults(results: OSINTDataPoint[], options: OSINTQueryOptions): OSINTDataPoint[] {
    let processed = results

    // 按置信度过滤
    if (options.minConfidence) {
      processed = processed.filter(item => item.confidence >= options.minConfidence!)
    }

    // 去重（基于ID或内容哈希）
    const seen = new Set<string>()
    processed = processed.filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })

    // 按置信度和时间排序
    processed.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence
      if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // 限制结果数量
    if (options.maxResults) {
      processed = processed.slice(0, options.maxResults)
    }

    return processed
  }

  private buildQueryResult(
    query: string,
    options: OSINTQueryOptions,
    results: OSINTDataPoint[],
    sources: any,
    startTime: number
  ): OSINTQueryResult {
    const categories = ['security', 'geopolitics', 'business', 'news', 'reference']
    const coverage: any = {}
    
    categories.forEach(category => {
      const categoryResults = results.filter(r => r.category === category)
      coverage[category] = categoryResults.length
    })

    const confidence = results.length > 0 
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0

    return {
      query,
      options,
      results,
      totalFound: results.length,
      sources,
      metadata: {
        executionTime: Date.now() - startTime,
        confidence,
        coverage
      }
    }
  }
}

// 导出单例实例
export const osintManager = new OSINTManager()

// 工具函数
export function createOSINTDataPoint(
  source: string,
  category: string,
  type: string,
  data: any,
  confidence: number = 0.8
): OSINTDataPoint {
  return {
    id: `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source,
    category,
    type,
    timestamp: new Date().toISOString(),
    confidence,
    data,
    metadata: {
      collection_method: 'api',
      tags: [],
      reliability_score: confidence
    }
  }
}