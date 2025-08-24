/**
 * 付费接口扩展机制
 * 
 * 核心功能：
 * 1. 付费API提供商管理
 * 2. 动态订阅和计费
 * 3. 服务降级和回退
 * 4. 使用量监控和警报
 * 5. 成本控制和预算管理
 * 6. SLA监控和质量保证
 */

import { BaseOSINTProvider, OSINTDataPoint, OSINTApiConfig, createOSINTDataPoint } from './osint-framework'

// 付费服务层级定义
export type ServiceTier = 'free' | 'basic' | 'professional' | 'enterprise' | 'premium'

// 计费模式
export type BillingModel = 'per_request' | 'monthly_quota' | 'annual_subscription' | 'usage_based' | 'credit_based'

// 付费服务配置
export interface PaidServiceConfig extends OSINTApiConfig {
  billing: {
    model: BillingModel
    costPerRequest?: number // 每次请求费用（美元）
    monthlyFee?: number // 月费
    annualFee?: number // 年费
    freeQuota?: number // 免费额度
    premiumQuota?: number // 付费额度
    overage_rate?: number // 超额费率
  }
  sla: {
    uptime: number // 99.9%
    responseTime: number // 毫秒
    dataFreshness: number // 数据新鲜度（分钟）
    accuracy: number // 准确率
  }
  features: {
    realTimeUpdates?: boolean
    historicalData?: boolean
    customFields?: boolean
    bulkQueries?: boolean
    whiteLabeling?: boolean
    apiSupport?: 'basic' | 'priority' | 'dedicated'
  }
}

// 使用情况跟踪
export interface UsageTracking {
  providerId: string
  requestCount: number
  totalCost: number
  lastUsed: string
  monthlySpend: number
  quotaRemaining: number
  performanceMetrics: {
    averageResponseTime: number
    successRate: number
    errorRate: number
    dataQualityScore: number
  }
}

// 订阅管理
export interface Subscription {
  id: string
  providerId: string
  tier: ServiceTier
  status: 'active' | 'suspended' | 'cancelled' | 'trial'
  startDate: string
  endDate?: string
  autoRenewal: boolean
  features: string[]
  billing: {
    nextBillDate: string
    lastBillAmount: number
    paymentMethod: string
  }
}

/**
 * 付费OSINT提供商基类
 */
export abstract class PaidOSINTProvider extends BaseOSINTProvider {
  protected paidConfig: PaidServiceConfig
  protected usage: UsageTracking
  protected subscription: Subscription | null = null

  constructor(config: PaidServiceConfig) {
    super(config)
    this.paidConfig = config
    this.usage = this.initializeUsageTracking()
  }

  /**
   * 检查订阅状态
   */
  protected checkSubscription(): boolean {
    if (!this.subscription) return false
    
    if (this.subscription.status !== 'active') {
      console.warn(`${this.config.name} 订阅状态异常: ${this.subscription.status}`)
      return false
    }

    if (this.subscription.endDate && new Date(this.subscription.endDate) < new Date()) {
      console.warn(`${this.config.name} 订阅已过期`)
      return false
    }

    return true
  }

  /**
   * 检查预算限制
   */
  protected checkBudgetLimit(estimatedCost: number = 0): boolean {
    const monthlyBudget = process.env[`${this.config.name.toUpperCase()}_MONTHLY_BUDGET`]
    if (monthlyBudget) {
      const budget = parseFloat(monthlyBudget)
      if (this.usage.monthlySpend + estimatedCost > budget) {
        console.warn(`${this.config.name} 月度预算即将超限: $${this.usage.monthlySpend} + $${estimatedCost} > $${budget}`)
        return false
      }
    }
    return true
  }

  /**
   * 记录使用情况和费用
   */
  protected recordUsage(requestCost: number): void {
    this.usage.requestCount++
    this.usage.totalCost += requestCost
    this.usage.monthlySpend += requestCost
    this.usage.lastUsed = new Date().toISOString()
    
    // 更新配额
    if (this.paidConfig.billing.premiumQuota) {
      this.usage.quotaRemaining = Math.max(0, this.usage.quotaRemaining - 1)
    }
  }

  /**
   * 计算请求成本
   */
  protected calculateRequestCost(): number {
    switch (this.paidConfig.billing.model) {
      case 'per_request':
        return this.paidConfig.billing.costPerRequest || 0
      case 'credit_based':
        return this.paidConfig.billing.costPerRequest || 0
      case 'usage_based':
        return this.paidConfig.billing.costPerRequest || 0
      default:
        return 0
    }
  }

  /**
   * 性能监控
   */
  protected recordPerformanceMetrics(responseTime: number, success: boolean, dataQuality: number): void {
    const metrics = this.usage.performanceMetrics
    
    // 更新平均响应时间
    metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2
    
    // 更新成功率
    const totalRequests = this.usage.requestCount
    if (success) {
      metrics.successRate = ((metrics.successRate * (totalRequests - 1)) + 1) / totalRequests
    } else {
      metrics.successRate = (metrics.successRate * (totalRequests - 1)) / totalRequests
      metrics.errorRate = 1 - metrics.successRate
    }
    
    // 更新数据质量评分
    metrics.dataQualityScore = (metrics.dataQualityScore + dataQuality) / 2
  }

  /**
   * 获取增强状态信息
   */
  getEnhancedStatus(): {
    basic: ReturnType<BaseOSINTProvider['getStatus']>
    subscription: Subscription | null
    usage: UsageTracking
    costProjection: {
      dailyAverage: number
      monthlyEstimate: number
      annualEstimate: number
    }
    sla: {
      uptimeActual: number
      responseTimeActual: number
      slaCompliance: boolean
    }
  } {
    const basic = this.getStatus()
    
    const costProjection = {
      dailyAverage: this.usage.monthlySpend / new Date().getDate(),
      monthlyEstimate: this.usage.monthlySpend * (30 / new Date().getDate()),
      annualEstimate: this.usage.monthlySpend * (365 / new Date().getDate())
    }

    const sla = {
      uptimeActual: this.usage.performanceMetrics.successRate * 100,
      responseTimeActual: this.usage.performanceMetrics.averageResponseTime,
      slaCompliance: this.checkSLACompliance()
    }

    return {
      basic,
      subscription: this.subscription,
      usage: this.usage,
      costProjection,
      sla
    }
  }

  private initializeUsageTracking(): UsageTracking {
    return {
      providerId: this.config.name,
      requestCount: 0,
      totalCost: 0,
      lastUsed: new Date().toISOString(),
      monthlySpend: 0,
      quotaRemaining: this.paidConfig.billing.premiumQuota || 0,
      performanceMetrics: {
        averageResponseTime: 0,
        successRate: 1.0,
        errorRate: 0,
        dataQualityScore: 0.8
      }
    }
  }

  private checkSLACompliance(): boolean {
    const metrics = this.usage.performanceMetrics
    const sla = this.paidConfig.sla

    return metrics.successRate >= sla.uptime / 100 &&
           metrics.averageResponseTime <= sla.responseTime &&
           metrics.dataQualityScore >= sla.accuracy
  }
}

/**
 * 付费接口管理器
 */
export class PaidInterfaceManager {
  private providers: Map<string, PaidOSINTProvider> = new Map()
  private subscriptions: Map<string, Subscription> = new Map()
  private budgetAlerts: Map<string, number> = new Map()
  private costThresholds: Map<string, number> = new Map()

  /**
   * 注册付费提供商
   */
  registerPaidProvider(provider: PaidOSINTProvider): void {
    this.providers.set(provider.getStatus().name, provider)
    
    // 设置预算警报
    const budgetEnvVar = `${provider.getStatus().name.toUpperCase()}_MONTHLY_BUDGET`
    const budget = process.env[budgetEnvVar]
    if (budget) {
      this.budgetAlerts.set(provider.getStatus().name, parseFloat(budget) * 0.8) // 80%警报
      this.costThresholds.set(provider.getStatus().name, parseFloat(budget))
    }
  }

  /**
   * 智能提供商选择
   */
  selectOptimalProvider(
    category: string, 
    requirements: {
      maxCost?: number
      minAccuracy?: number
      maxResponseTime?: number
      requiresRealTime?: boolean
    } = {}
  ): PaidOSINTProvider | null {
    
    const categoryProviders = Array.from(this.providers.values())
      .filter(provider => provider.getStatus().category === category)

    let bestProvider: PaidOSINTProvider | null = null
    let bestScore = 0

    for (const provider of categoryProviders) {
      const status = provider.getEnhancedStatus()
      
      // 检查基本要求
      if (!status.basic.enabled) continue
      if (requirements.maxCost && status.usage.monthlySpend > requirements.maxCost) continue
      if (requirements.minAccuracy && status.usage.performanceMetrics.dataQualityScore < requirements.minAccuracy) continue
      if (requirements.maxResponseTime && status.usage.performanceMetrics.averageResponseTime > requirements.maxResponseTime) continue

      // 计算综合评分
      const score = this.calculateProviderScore(provider, requirements)
      
      if (score > bestScore) {
        bestScore = score
        bestProvider = provider
      }
    }

    return bestProvider
  }

  /**
   * 成本优化建议
   */
  generateCostOptimizationSuggestions(): {
    provider: string
    currentSpend: number
    suggestedPlan: ServiceTier
    potentialSavings: number
    reasoning: string
  }[] {
    const suggestions: any[] = []

    this.providers.forEach((provider, name) => {
      const status = provider.getEnhancedStatus()
      const monthlySpend = status.usage.monthlySpend
      const requestCount = status.usage.requestCount

      // 分析使用模式
      if (monthlySpend > 100 && requestCount > 1000) {
        // 建议升级到包月套餐
        suggestions.push({
          provider: name,
          currentSpend: monthlySpend,
          suggestedPlan: 'professional' as ServiceTier,
          potentialSavings: monthlySpend * 0.2,
          reasoning: '基于使用量，包月套餐更经济'
        })
      } else if (requestCount < 100 && monthlySpend > 20) {
        // 建议降级或使用免费层
        suggestions.push({
          provider: name,
          currentSpend: monthlySpend,
          suggestedPlan: 'basic' as ServiceTier,
          potentialSavings: monthlySpend * 0.6,
          reasoning: '使用量较低，可考虑降级服务'
        })
      }
    })

    return suggestions
  }

  /**
   * 预算监控和警报
   */
  checkBudgetAlerts(): {
    provider: string
    alertType: 'warning' | 'critical' | 'exceeded'
    currentSpend: number
    budgetLimit: number
    recommendedAction: string
  }[] {
    const alerts: any[] = []

    this.providers.forEach((provider, name) => {
      const status = provider.getEnhancedStatus()
      const currentSpend = status.usage.monthlySpend
      const budgetLimit = this.costThresholds.get(name)
      const warningThreshold = this.budgetAlerts.get(name)

      if (!budgetLimit) return

      if (currentSpend >= budgetLimit) {
        alerts.push({
          provider: name,
          alertType: 'exceeded',
          currentSpend,
          budgetLimit,
          recommendedAction: '立即暂停服务或增加预算'
        })
      } else if (warningThreshold && currentSpend >= warningThreshold) {
        alerts.push({
          provider: name,
          alertType: 'warning',
          currentSpend,
          budgetLimit,
          recommendedAction: '监控使用情况，考虑优化查询'
        })
      } else if (currentSpend >= budgetLimit * 0.9) {
        alerts.push({
          provider: name,
          alertType: 'critical',
          currentSpend,
          budgetLimit,
          recommendedAction: '接近预算上限，建议立即采取行动'
        })
      }
    })

    return alerts
  }

  /**
   * SLA监控报告
   */
  generateSLAReport(): {
    provider: string
    slaCompliance: boolean
    uptime: number
    responseTime: number
    dataQuality: number
    issues: string[]
    recommendations: string[]
  }[] {
    const reports: any[] = []

    this.providers.forEach((provider, name) => {
      const status = provider.getEnhancedStatus()
      const sla = status.sla
      const issues: string[] = []
      const recommendations: string[] = []

      // 检查SLA违规
      if (sla.uptimeActual < 99.0) {
        issues.push(`可用性低于SLA要求: ${sla.uptimeActual.toFixed(2)}%`)
        recommendations.push('联系服务提供商确认服务状态')
      }

      if (sla.responseTimeActual > 5000) { // 5秒
        issues.push(`响应时间过长: ${sla.responseTimeActual}ms`)
        recommendations.push('考虑优化查询参数或升级服务层级')
      }

      if (status.usage.performanceMetrics.dataQualityScore < 0.8) {
        issues.push(`数据质量低于预期: ${(status.usage.performanceMetrics.dataQualityScore * 100).toFixed(1)}%`)
        recommendations.push('验证数据源配置和过滤条件')
      }

      reports.push({
        provider: name,
        slaCompliance: sla.slaCompliance,
        uptime: sla.uptimeActual,
        responseTime: sla.responseTimeActual,
        dataQuality: status.usage.performanceMetrics.dataQualityScore,
        issues,
        recommendations
      })
    })

    return reports
  }

  /**
   * 成本分析仪表板数据
   */
  getCostDashboardData(): {
    totalSpend: number
    monthlyTrend: number[]
    topSpenders: { provider: string; spend: number }[]
    projectedAnnualCost: number
    potentialSavings: number
    budgetUtilization: { provider: string; used: number; total: number }[]
  } {
    let totalSpend = 0
    const topSpenders: { provider: string; spend: number }[] = []
    const budgetUtilization: { provider: string; used: number; total: number }[] = []

    this.providers.forEach((provider, name) => {
      const status = provider.getEnhancedStatus()
      const monthlySpend = status.usage.monthlySpend
      
      totalSpend += monthlySpend
      topSpenders.push({ provider: name, spend: monthlySpend })

      const budget = this.costThresholds.get(name)
      if (budget) {
        budgetUtilization.push({
          provider: name,
          used: monthlySpend,
          total: budget
        })
      }
    })

    // 排序最高消费者
    topSpenders.sort((a, b) => b.spend - a.spend)

    // 计算优化建议的潜在节省
    const optimizationSuggestions = this.generateCostOptimizationSuggestions()
    const potentialSavings = optimizationSuggestions.reduce((sum, suggestion) => sum + suggestion.potentialSavings, 0)

    return {
      totalSpend,
      monthlyTrend: [totalSpend], // 简化实现，实际需要历史数据
      topSpenders: topSpenders.slice(0, 5),
      projectedAnnualCost: totalSpend * 12,
      potentialSavings,
      budgetUtilization
    }
  }

  /**
   * 自动化成本控制
   */
  enableAutomatedCostControl(config: {
    monthlyBudgetLimit: number
    autoSuspendOnExceed: boolean
    downgradeBeforeSuspend: boolean
    notificationWebhook?: string
  }): void {
    // 设置定时检查
    setInterval(() => {
      const alerts = this.checkBudgetAlerts()
      
      alerts.forEach(alert => {
        if (alert.alertType === 'exceeded' && config.autoSuspendOnExceed) {
          const provider = this.providers.get(alert.provider)
          if (provider) {
            console.warn(`🚫 自动暂停 ${alert.provider} - 预算超限`)
            // 这里应该实现暂停逻辑
          }
        }

        // 发送通知
        if (config.notificationWebhook) {
          this.sendCostAlert(config.notificationWebhook, alert)
        }
      })
    }, 60000) // 每分钟检查一次
  }

  private calculateProviderScore(provider: PaidOSINTProvider, requirements: any): number {
    const status = provider.getEnhancedStatus()
    let score = 0

    // 性能评分 (40%)
    score += status.usage.performanceMetrics.dataQualityScore * 40
    score += (1 - Math.min(1, status.usage.performanceMetrics.averageResponseTime / 5000)) * 20
    score += status.usage.performanceMetrics.successRate * 20

    // 成本效益评分 (20%)
    const costEfficiency = Math.max(0, 1 - (status.usage.monthlySpend / 1000))
    score += costEfficiency * 20

    return score
  }

  private async sendCostAlert(webhook: string, alert: any): Promise<void> {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cost_alert',
          ...alert,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send cost alert:', error)
    }
  }
}

// 导出付费接口管理器实例
export const paidInterfaceManager = new PaidInterfaceManager()

/**
 * 高级付费提供商示例
 */
export class PremiumThreatIntelligenceProvider extends PaidOSINTProvider {
  constructor(apiKey: string, tier: ServiceTier = 'professional') {
    const config: PaidServiceConfig = {
      name: 'Premium Threat Intelligence',
      endpoint: 'https://api.premium-threat-intel.com/v3',
      apiKey,
      rateLimit: tier === 'enterprise' ? { requests: 10, period: 1000 } : { requests: 2, period: 1000 },
      quota: { monthly: tier === 'enterprise' ? 100000 : 10000 },
      category: 'security',
      priority: 15,
      enabled: !!apiKey,
      tier,
      timeout: 10000,
      billing: {
        model: 'usage_based',
        costPerRequest: tier === 'enterprise' ? 0.01 : 0.05,
        monthlyFee: tier === 'enterprise' ? 500 : 100,
        freeQuota: 100,
        premiumQuota: tier === 'enterprise' ? 100000 : 10000,
        overage_rate: 0.1
      },
      sla: {
        uptime: tier === 'enterprise' ? 99.99 : 99.9,
        responseTime: tier === 'enterprise' ? 500 : 1000,
        dataFreshness: tier === 'enterprise' ? 1 : 5,
        accuracy: 0.95
      },
      features: {
        realTimeUpdates: tier !== 'basic',
        historicalData: tier === 'enterprise',
        customFields: tier === 'professional' || tier === 'enterprise',
        bulkQueries: tier === 'enterprise',
        whiteLabeling: tier === 'enterprise',
        apiSupport: tier === 'enterprise' ? 'dedicated' : 'priority'
      }
    }

    super(config)
  }

  async query(indicator: string, options: any = {}): Promise<OSINTDataPoint[]> {
    // 检查订阅状态
    if (!this.checkSubscription()) {
      throw new Error('Premium Threat Intelligence subscription required')
    }

    // 检查预算限制
    const estimatedCost = this.calculateRequestCost()
    if (!this.checkBudgetLimit(estimatedCost)) {
      throw new Error('Monthly budget limit would be exceeded')
    }

    // 检查速率限制和配额
    await this.checkRateLimit()
    if (!this.checkQuota()) {
      throw new Error('Monthly quota exceeded')
    }

    const startTime = Date.now()
    let success = false
    let dataQuality = 0

    try {
      const response = await fetch(`${this.config.endpoint}/indicators/${indicator}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Premium API error: ${response.status}`)
      }

      const data = await response.json()
      const results = this.normalizeData(data, indicator)
      
      success = true
      dataQuality = this.calculateDataQuality(data)
      
      // 记录使用情况
      this.recordUsage(estimatedCost)
      
      return results

    } finally {
      // 记录性能指标
      const responseTime = Date.now() - startTime
      this.recordPerformanceMetrics(responseTime, success, dataQuality)
    }
  }

  protected normalizeData(rawData: any, indicator: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.threat_data) {
      rawData.threat_data.forEach((threat: any) => {
        results.push(createOSINTDataPoint(
          'Premium Threat Intelligence',
          'security',
          'advanced_threat',
          {
            indicator,
            threat_type: threat.type,
            severity: threat.severity,
            confidence: threat.confidence,
            attribution: threat.attribution,
            iocs: threat.iocs,
            techniques: threat.techniques,
            campaigns: threat.campaigns,
            first_seen: threat.first_seen,
            last_seen: threat.last_seen,
            geographical_distribution: threat.geo_distribution
          },
          threat.confidence,
          threat.severity
        ))
      })
    }

    return results
  }

  private calculateDataQuality(data: any): number {
    let quality = 0.5
    
    if (data.threat_data && data.threat_data.length > 0) quality += 0.2
    if (data.attribution) quality += 0.1
    if (data.iocs && data.iocs.length > 5) quality += 0.1
    if (data.confidence > 0.8) quality += 0.1
    
    return Math.min(1.0, quality)
  }
}