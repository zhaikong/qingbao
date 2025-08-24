/**
 * 地缘政治情报API模块
 */

export { GDELTProvider } from './gdelt'
export { ACLEDProvider } from './acled'
export { RestCountriesProvider } from './rest-countries'
export { WorldBankProvider } from './world-bank'

import { GDELTProvider } from './gdelt'
import { ACLEDProvider } from './acled'
import { RestCountriesProvider } from './rest-countries'
import { WorldBankProvider } from './world-bank'
import { APIProvider } from '../types'

/**
 * 创建所有可用的地缘政治情报提供商
 */
export function createGeopoliticalProviders(): APIProvider[] {
  const providers: APIProvider[] = []

  // GDELT Project (免费)
  providers.push(new GDELTProvider())

  // ACLED (需要认证)
  if (process.env.ACLED_EMAIL && process.env.ACLED_PASSWORD) {
    providers.push(new ACLEDProvider(process.env.ACLED_EMAIL, process.env.ACLED_PASSWORD))
  }

  // REST Countries (免费)
  providers.push(new RestCountriesProvider())

  // World Bank (免费)
  providers.push(new WorldBankProvider())

  return providers
}

/**
 * 获取地缘政治情报提供商状态
 */
export async function getGeopoliticalProvidersStatus(): Promise<Record<string, any>> {
  const providers = createGeopoliticalProviders()
  const status: Record<string, any> = {}

  for (const provider of providers) {
    try {
      const providerStatus = await provider.getStatus()
      status[provider.name] = {
        enabled: provider.enabled,
        category: provider.category,
        rateLimit: provider.rateLimit,
        ...providerStatus
      }
    } catch (error: any) {
      status[provider.name] = {
        enabled: false,
        error: error.message
      }
    }
  }

  return status
}

/**
 * 地缘政治情报聚合查询
 */
export async function queryGeopoliticalIntelligence(
  query: string,
  options: {
    providers?: string[]
    maxResults?: number
    useCache?: boolean
    timeRange?: { from: Date; to: Date }
    geoFilter?: string[]
  } = {}
) {
  const allProviders = createGeopoliticalProviders()
  const selectedProviders = options.providers 
    ? allProviders.filter(p => options.providers!.includes(p.name))
    : allProviders

  const results = await Promise.allSettled(
    selectedProviders.map(provider => 
      provider.query(query, {
        maxResults: options.maxResults,
        useCache: options.useCache,
        timeRange: options.timeRange,
        geoFilter: options.geoFilter
      })
    )
  )

  const successfulResults = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value)
    .filter(response => response.success)

  const allDataPoints = successfulResults
    .flatMap(response => response.data || [])

  return {
    success: true,
    totalProviders: selectedProviders.length,
    successfulProviders: successfulResults.length,
    totalResults: allDataPoints.length,
    data: allDataPoints,
    sources: successfulResults.map(r => r.source)
  }
}

/**
 * 地区风险评估
 */
export async function assessRegionalRisk(region: string, options: {
  timeRange?: { from: Date; to: Date }
  includeEconomicData?: boolean
} = {}) {
  const providers = createGeopoliticalProviders()
  const results: any[] = []

  // GDELT冲突事件
  const gdeltProvider = providers.find(p => p.name === 'GDELT Project') as GDELTProvider
  if (gdeltProvider) {
    try {
      const conflictEvents = await gdeltProvider.queryConflictEvents(region, {
        timeRange: options.timeRange,
        maxResults: 20
      })
      if (conflictEvents.success) {
        results.push(...(conflictEvents.data || []))
      }
    } catch (error) {
      console.warn('GDELT查询失败:', error)
    }
  }

  // ACLED冲突数据
  const acledProvider = providers.find(p => p.name === 'ACLED') as ACLEDProvider
  if (acledProvider) {
    try {
      const acledEvents = await acledProvider.queryCountryConflicts(region, {
        timeRange: options.timeRange,
        maxResults: 15
      })
      if (acledEvents.success) {
        results.push(...(acledEvents.data || []))
      }
    } catch (error) {
      console.warn('ACLED查询失败:', error)
    }
  }

  // 国家基础信息
  const countriesProvider = providers.find(p => p.name === 'REST Countries') as RestCountriesProvider
  if (countriesProvider) {
    try {
      const countryInfo = await countriesProvider.query(region)
      if (countryInfo.success) {
        results.push(...(countryInfo.data || []))
      }
    } catch (error) {
      console.warn('REST Countries查询失败:', error)
    }
  }

  // 经济数据
  if (options.includeEconomicData) {
    const worldBankProvider = providers.find(p => p.name === 'World Bank') as WorldBankProvider
    if (worldBankProvider) {
      try {
        const economicData = await worldBankProvider.query(region)
        if (economicData.success) {
          results.push(...(economicData.data || []))
        }
      } catch (error) {
        console.warn('World Bank查询失败:', error)
      }
    }
  }

  // 计算综合风险评分
  const riskScore = calculateRegionalRiskScore(results)

  return {
    region,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    totalEvents: results.length,
    data: results,
    assessment: generateRiskAssessment(results, riskScore)
  }
}

/**
 * 计算地区风险评分
 */
function calculateRegionalRiskScore(dataPoints: any[]): number {
  let score = 0
  let totalWeight = 0

  for (const point of dataPoints) {
    let weight = 1
    let severityScore = 0

    // 根据严重程度评分
    switch (point.severity) {
      case 'critical': severityScore = 4; break
      case 'high': severityScore = 3; break
      case 'medium': severityScore = 2; break
      case 'low': severityScore = 1; break
    }

    // 根据数据类型调整权重
    switch (point.subcategory) {
      case 'conflict_event': weight = 3; break
      case 'news_analysis': weight = 2; break
      case 'economic_indicator': weight = 2; break
      case 'country_profile': weight = 1; break
    }

    score += severityScore * weight * point.confidence
    totalWeight += weight
  }

  return totalWeight > 0 ? score / totalWeight : 0
}

/**
 * 获取风险等级
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 3) return 'critical'
  if (score >= 2) return 'high'
  if (score >= 1) return 'medium'
  return 'low'
}

/**
 * 生成风险评估报告
 */
function generateRiskAssessment(dataPoints: any[], riskScore: number): {
  summary: string
  keyRisks: string[]
  recommendations: string[]
} {
  const conflictEvents = dataPoints.filter(d => d.subcategory === 'conflict_event')
  const economicIndicators = dataPoints.filter(d => d.subcategory === 'economic_indicator')
  
  const keyRisks: string[] = []
  const recommendations: string[] = []

  // 分析冲突风险
  if (conflictEvents.length > 0) {
    const highSeverityConflicts = conflictEvents.filter(e => e.severity === 'high' || e.severity === 'critical')
    if (highSeverityConflicts.length > 0) {
      keyRisks.push(`发现 ${highSeverityConflicts.length} 个高风险冲突事件`)
      recommendations.push('建议密切监控冲突态势发展')
    }
  }

  // 分析经济风险
  if (economicIndicators.length > 0) {
    const negativeIndicators = economicIndicators.filter(e => e.severity === 'high' || e.severity === 'critical')
    if (negativeIndicators.length > 0) {
      keyRisks.push(`发现 ${negativeIndicators.length} 个经济风险指标`)
      recommendations.push('建议评估经济稳定性影响')
    }
  }

  const summary = `地区风险评分: ${riskScore.toFixed(2)}/4.0，风险等级: ${getRiskLevel(riskScore)}`

  return {
    summary,
    keyRisks,
    recommendations
  }
}