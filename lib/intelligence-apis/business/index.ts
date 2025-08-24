/**
 * 商业情报API模块
 */

export { AlphaVantageProvider } from './alpha-vantage'
export { CoinGeckoProvider } from './coingecko'
export { OpenCorporatesProvider } from './opencorporates'
export { PolygonProvider } from './polygon'

import { AlphaVantageProvider } from './alpha-vantage'
import { CoinGeckoProvider } from './coingecko'
import { OpenCorporatesProvider } from './opencorporates'
import { PolygonProvider } from './polygon'
import { APIProvider } from '../types'

/**
 * 创建所有可用的商业情报提供商
 */
export function createBusinessProviders(): APIProvider[] {
  const providers: APIProvider[] = []

  console.log('🔧 检查商业情报API密钥...')

  // Alpha Vantage (需要API密钥)
  const alphaKey = process.env.ALPHA_VANTAGE_API_KEY
  if (alphaKey && !alphaKey.includes('your_') && alphaKey.length > 10) {
    console.log('  ✅ Alpha Vantage: 密钥有效')
    providers.push(new AlphaVantageProvider(alphaKey))
  } else {
    console.log('  ⚠️  Alpha Vantage: 密钥未配置或无效')
  }

  // CoinGecko (免费)
  console.log('  ✅ CoinGecko: 免费API，无需密钥')
  providers.push(new CoinGeckoProvider())

  // OpenCorporates (需要API Token)
  const openCorpToken = process.env.OPENCORPORATES_API_TOKEN
  if (openCorpToken && !openCorpToken.includes('your_') && openCorpToken.length > 10) {
    console.log('  ✅ OpenCorporates: 密钥有效')
    providers.push(new OpenCorporatesProvider(openCorpToken))
  } else {
    console.log('  ⚠️  OpenCorporates: 密钥未配置或无效')
  }

  // Polygon.io (需要API密钥)
  const polygonKey = process.env.POLYGON_API_KEY
  if (polygonKey && !polygonKey.includes('your_') && polygonKey.length > 10) {
    console.log('  ✅ Polygon.io: 密钥有效')
    providers.push(new PolygonProvider(polygonKey))
  } else {
    console.log('  ⚠️  Polygon.io: 密钥未配置或无效')
  }

  console.log(`💼 商业情报提供商: ${providers.length} 个已加载`)
  return providers
}

/**
 * 获取商业情报提供商状态
 */
export async function getBusinessProvidersStatus(): Promise<Record<string, any>> {
  const providers = createBusinessProviders()
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
 * 商业情报聚合查询
 */
export async function queryBusinessIntelligence(
  query: string,
  options: {
    providers?: string[]
    maxResults?: number
    useCache?: boolean
    dataTypes?: ('stock' | 'crypto' | 'company' | 'forex')[]
  } = {}
) {
  const allProviders = createBusinessProviders()
  const selectedProviders = options.providers 
    ? allProviders.filter(p => options.providers!.includes(p.name))
    : allProviders

  const results = await Promise.allSettled(
    selectedProviders.map(provider => 
      provider.query(query, {
        maxResults: options.maxResults,
        useCache: options.useCache
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
 * 股票分析
 */
export async function analyzeStock(symbol: string, options: {
  includeNews?: boolean
  includeHistorical?: boolean
} = {}) {
  const providers = createBusinessProviders()
  const results: any[] = []

  // Alpha Vantage 股票数据
  const alphaVantageProvider = providers.find(p => p.name === 'Alpha Vantage') as AlphaVantageProvider
  if (alphaVantageProvider) {
    try {
      const stockData = await alphaVantageProvider.query(symbol)
      if (stockData.success) {
        results.push(...(stockData.data || []))
      }
    } catch (error) {
      console.warn('Alpha Vantage查询失败:', error)
    }
  }

  // Polygon.io 数据
  const polygonProvider = providers.find(p => p.name === 'Polygon.io') as PolygonProvider
  if (polygonProvider) {
    try {
      const polygonData = await polygonProvider.query(symbol)
      if (polygonData.success) {
        results.push(...(polygonData.data || []))
      }
    } catch (error) {
      console.warn('Polygon.io查询失败:', error)
    }
  }

  return {
    symbol,
    totalResults: results.length,
    data: results,
    analysis: generateStockAnalysis(results)
  }
}

/**
 * 加密货币分析
 */
export async function analyzeCrypto(symbol: string, options: {
  includeTrending?: boolean
  includeMarketData?: boolean
} = {}) {
  const providers = createBusinessProviders()
  const results: any[] = []

  // CoinGecko 数据
  const coinGeckoProvider = providers.find(p => p.name === 'CoinGecko') as CoinGeckoProvider
  if (coinGeckoProvider) {
    try {
      const cryptoData = await coinGeckoProvider.query(symbol)
      if (cryptoData.success) {
        results.push(...(cryptoData.data || []))
      }

      // 获取市场概览
      if (options.includeMarketData) {
        const marketData = await coinGeckoProvider.getMarketOverview()
        if (marketData.success) {
          results.push(...(marketData.data || []))
        }
      }
    } catch (error) {
      console.warn('CoinGecko查询失败:', error)
    }
  }

  // Polygon.io 加密货币数据
  const polygonProvider = providers.find(p => p.name === 'Polygon.io') as PolygonProvider
  if (polygonProvider) {
    try {
      const polygonCrypto = await polygonProvider.getCryptoData(symbol)
      if (polygonCrypto.success) {
        results.push(...(polygonCrypto.data || []))
      }
    } catch (error) {
      console.warn('Polygon.io加密货币查询失败:', error)
    }
  }

  return {
    symbol,
    totalResults: results.length,
    data: results,
    analysis: generateCryptoAnalysis(results)
  }
}

/**
 * 企业背景调查
 */
export async function investigateCompany(companyName: string, options: {
  includeOfficers?: boolean
  includeFinancials?: boolean
} = {}) {
  const providers = createBusinessProviders()
  const results: any[] = []

  // OpenCorporates 企业数据
  const openCorpProvider = providers.find(p => p.name === 'OpenCorporates') as OpenCorporatesProvider
  if (openCorpProvider) {
    try {
      const companyData = await openCorpProvider.query(companyName)
      if (companyData.success) {
        results.push(...(companyData.data || []))
      }
    } catch (error) {
      console.warn('OpenCorporates查询失败:', error)
    }
  }

  // 如果公司名看起来像股票代码，也查询股票数据
  if (companyName.length <= 5 && /^[A-Z]+$/.test(companyName)) {
    const stockAnalysis = await analyzeStock(companyName)
    results.push(...stockAnalysis.data)
  }

  return {
    companyName,
    totalResults: results.length,
    data: results,
    riskAssessment: generateCompanyRiskAssessment(results)
  }
}

/**
 * 生成股票分析
 */
function generateStockAnalysis(dataPoints: any[]): {
  summary: string
  trends: string[]
  risks: string[]
  opportunities: string[]
} {
  const stockData = dataPoints.filter(d => d.subcategory === 'stock_quote' || d.subcategory === 'stock_data')
  const newsData = dataPoints.filter(d => d.subcategory === 'financial_news')

  const trends: string[] = []
  const risks: string[] = []
  const opportunities: string[] = []

  // 分析价格趋势
  if (stockData.length > 0) {
    const latestData = stockData[0]
    const changePercent = latestData.content.changePercent || latestData.content.change

    if (changePercent > 5) {
      trends.push('股价强势上涨')
      opportunities.push('短期上涨动能强劲')
    } else if (changePercent < -5) {
      trends.push('股价大幅下跌')
      risks.push('短期下跌压力较大')
    } else {
      trends.push('股价相对稳定')
    }
  }

  // 分析新闻情绪
  if (newsData.length > 0) {
    trends.push(`发现 ${newsData.length} 条相关新闻`)
  }

  const summary = `分析了 ${stockData.length} 个价格数据点和 ${newsData.length} 条新闻`

  return { summary, trends, risks, opportunities }
}

/**
 * 生成加密货币分析
 */
function generateCryptoAnalysis(dataPoints: any[]): {
  summary: string
  marketSentiment: string
  volatilityLevel: string
  recommendations: string[]
} {
  const cryptoData = dataPoints.filter(d => d.subcategory === 'crypto_analysis' || d.subcategory === 'crypto_price')
  const marketData = dataPoints.filter(d => d.subcategory === 'crypto_market_overview')

  let marketSentiment = 'neutral'
  let volatilityLevel = 'medium'
  const recommendations: string[] = []

  if (cryptoData.length > 0) {
    const latestData = cryptoData[0]
    const change24h = latestData.content.priceChange24h

    if (change24h > 10) {
      marketSentiment = 'bullish'
      volatilityLevel = 'high'
      recommendations.push('市场情绪乐观，但注意高波动风险')
    } else if (change24h < -10) {
      marketSentiment = 'bearish'
      volatilityLevel = 'high'
      recommendations.push('市场情绪悲观，谨慎投资')
    } else {
      marketSentiment = 'neutral'
      recommendations.push('市场相对稳定')
    }
  }

  const summary = `分析了 ${cryptoData.length} 个价格数据点`

  return { summary, marketSentiment, volatilityLevel, recommendations }
}

/**
 * 生成企业风险评估
 */
function generateCompanyRiskAssessment(dataPoints: any[]): {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: string[]
  complianceStatus: string
  recommendations: string[]
} {
  const companyProfiles = dataPoints.filter(d => d.subcategory === 'company_profile')
  const riskFactors: string[] = []
  const recommendations: string[] = []

  let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'

  if (companyProfiles.length > 0) {
    const profile = companyProfiles[0]
    
    if (profile.content.riskFactors) {
      riskFactors.push(...profile.content.riskFactors)
      
      if (profile.content.riskFactors.length > 3) {
        overallRisk = 'high'
        recommendations.push('发现多个风险因素，建议深入调查')
      } else if (profile.content.riskFactors.length > 0) {
        overallRisk = 'medium'
        recommendations.push('存在一些风险因素，需要关注')
      }
    }

    if (profile.content.currentStatus !== 'Active') {
      riskFactors.push('公司状态异常')
      overallRisk = 'high'
    }
  }

  const complianceStatus = riskFactors.length === 0 ? 'compliant' : 'needs_review'

  return { overallRisk, riskFactors, complianceStatus, recommendations }
}