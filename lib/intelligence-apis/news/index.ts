/**
 * 新闻情报API模块
 */

export { GNewsProvider } from './gnews'

import { GNewsProvider } from './gnews'
import { APIProvider } from '../types'

/**
 * 创建所有可用的新闻情报提供商
 */
export function createNewsProviders(): APIProvider[] {
  const providers: APIProvider[] = []

  console.log('🔧 检查新闻情报API密钥...')

  // GNews (需要API Token)
  const gnewsToken = process.env.GNEWS_API_TOKEN
  if (gnewsToken && !gnewsToken.includes('your_') && gnewsToken.length > 10) {
    console.log('  ✅ GNews: 密钥有效')
    providers.push(new GNewsProvider(gnewsToken))
  } else {
    console.log('  ⚠️  GNews: 密钥未配置或无效')
  }

  console.log(`📰 新闻情报提供商: ${providers.length} 个已加载`)
  return providers
}

/**
 * 获取新闻情报提供商状态
 */
export async function getNewsProvidersStatus(): Promise<Record<string, any>> {
  const providers = createNewsProviders()
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
 * 新闻情报聚合查询
 */
export async function queryNewsIntelligence(
  query: string,
  options: {
    providers?: string[]
    maxResults?: number
    useCache?: boolean
    timeRange?: { from: Date; to: Date }
    languages?: string[]
    categories?: string[]
    countries?: string[]
  } = {}
) {
  const allProviders = createNewsProviders()
  const selectedProviders = options.providers 
    ? allProviders.filter(p => options.providers!.includes(p.name))
    : allProviders

  const results = await Promise.allSettled(
    selectedProviders.map(provider => 
      provider.query(query, {
        maxResults: options.maxResults,
        useCache: options.useCache,
        timeRange: options.timeRange
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
 * 获取突发新闻
 */
export async function getBreakingNews(options: {
  maxResults?: number
  countries?: string[]
  categories?: string[]
} = {}) {
  const providers = createNewsProviders()
  const results: any[] = []

  for (const provider of providers) {
    if (provider.name === 'GNews') {
      const gnewsProvider = provider as GNewsProvider
      
      try {
        const headlines = await gnewsProvider.getTopHeadlines({
          category: 'general',
          maxResults: options.maxResults
        })
        
        if (headlines.success) {
          results.push(...(headlines.data || []))
        }
      } catch (error) {
        console.warn('GNews头条获取失败:', error)
      }
    }
  }

  // 按重要性和时间排序
  const sortedResults = results.sort((a, b) => {
    const importanceScore = (item: any) => {
      switch (item.content.importance) {
        case 'high': return 3
        case 'medium': return 2
        case 'low': return 1
        default: return 0
      }
    }
    
    const scoreA = importanceScore(a)
    const scoreB = importanceScore(b)
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA
    }
    
    // 如果重要性相同，按时间排序
    const timeA = new Date(a.content.publishedAt).getTime()
    const timeB = new Date(b.content.publishedAt).getTime()
    return timeB - timeA
  })

  return {
    totalResults: sortedResults.length,
    data: sortedResults,
    categories: extractCategories(sortedResults),
    sentimentAnalysis: analyzeSentiment(sortedResults)
  }
}

/**
 * 新闻趋势分析
 */
export async function analyzeTrends(
  keywords: string[],
  options: {
    timeRange?: { from: Date; to: Date }
    maxResults?: number
  } = {}
) {
  const providers = createNewsProviders()
  const trendData: Record<string, any[]> = {}

  for (const keyword of keywords) {
    trendData[keyword] = []
    
    for (const provider of providers) {
      try {
        const results = await provider.query(keyword, {
          maxResults: options.maxResults || 20,
          timeRange: options.timeRange
        })
        
        if (results.success) {
          trendData[keyword].push(...(results.data || []))
        }
      } catch (error) {
        console.warn(`关键词 ${keyword} 趋势分析失败:`, error)
      }
    }
  }

  // 分析趋势
  const trends = analyzeTrendData(trendData)

  return {
    keywords,
    timeRange: options.timeRange,
    trends,
    totalArticles: Object.values(trendData).flat().length,
    data: trendData
  }
}

/**
 * 多语言新闻监控
 */
export async function monitorMultiLanguageNews(
  query: string,
  languages: string[] = ['en', 'zh', 'es', 'fr'],
  options: {
    maxResults?: number
    realTime?: boolean
  } = {}
) {
  const providers = createNewsProviders()
  const results: Record<string, any[]> = {}

  for (const lang of languages) {
    results[lang] = []
  }

  for (const provider of providers) {
    if (provider.name === 'GNews') {
      const gnewsProvider = provider as GNewsProvider
      
      try {
        const multiLangResults = await gnewsProvider.searchMultiLanguage(
          query,
          languages,
          { maxResults: options.maxResults }
        )
        
        if (multiLangResults.success) {
          for (const article of multiLangResults.data || []) {
            const lang = article.content.language || 'en'
            if (results[lang]) {
              results[lang].push(article)
            }
          }
        }
      } catch (error) {
        console.warn('多语言新闻监控失败:', error)
      }
    }
  }

  return {
    query,
    languages,
    results,
    summary: generateMultiLanguageSummary(results),
    crossLanguagePatterns: findCrossLanguagePatterns(results)
  }
}

/**
 * 提取新闻类别
 */
function extractCategories(articles: any[]): Record<string, number> {
  const categories: Record<string, number> = {}
  
  for (const article of articles) {
    const content = `${article.content.title} ${article.content.description}`.toLowerCase()
    
    // 简单的类别检测
    if (content.includes('business') || content.includes('economy') || content.includes('market')) {
      categories['business'] = (categories['business'] || 0) + 1
    }
    if (content.includes('technology') || content.includes('tech') || content.includes('ai')) {
      categories['technology'] = (categories['technology'] || 0) + 1
    }
    if (content.includes('politics') || content.includes('government') || content.includes('election')) {
      categories['politics'] = (categories['politics'] || 0) + 1
    }
    if (content.includes('health') || content.includes('medical') || content.includes('covid')) {
      categories['health'] = (categories['health'] || 0) + 1
    }
  }
  
  return categories
}

/**
 * 分析整体情绪
 */
function analyzeSentiment(articles: any[]): {
  positive: number
  negative: number
  neutral: number
  overall: 'positive' | 'negative' | 'neutral'
} {
  let positive = 0
  let negative = 0
  let neutral = 0
  
  for (const article of articles) {
    switch (article.content.sentiment) {
      case 'positive': positive++; break
      case 'negative': negative++; break
      case 'neutral': neutral++; break
    }
  }
  
  const total = positive + negative + neutral
  const overall = positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral'
  
  return {
    positive: total > 0 ? positive / total : 0,
    negative: total > 0 ? negative / total : 0,
    neutral: total > 0 ? neutral / total : 0,
    overall
  }
}

/**
 * 分析趋势数据
 */
function analyzeTrendData(trendData: Record<string, any[]>): Record<string, {
  volume: number
  sentiment: string
  peakTime: string | null
  trend: 'rising' | 'falling' | 'stable'
}> {
  const trends: Record<string, any> = {}
  
  for (const [keyword, articles] of Object.entries(trendData)) {
    const volume = articles.length
    const sentimentAnalysis = analyzeSentiment(articles)
    
    // 找到发布时间的峰值
    const timeDistribution: Record<string, number> = {}
    for (const article of articles) {
      const hour = new Date(article.content.publishedAt).getHours()
      timeDistribution[hour] = (timeDistribution[hour] || 0) + 1
    }
    
    const peakHour = Object.entries(timeDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    trends[keyword] = {
      volume,
      sentiment: sentimentAnalysis.overall,
      peakTime: peakHour ? `${peakHour}:00` : null,
      trend: volume > 10 ? 'rising' : volume < 5 ? 'falling' : 'stable'
    }
  }
  
  return trends
}

/**
 * 生成多语言摘要
 */
function generateMultiLanguageSummary(results: Record<string, any[]>): {
  totalArticles: number
  languageDistribution: Record<string, number>
  commonTopics: string[]
} {
  const totalArticles = Object.values(results).flat().length
  const languageDistribution: Record<string, number> = {}
  
  for (const [lang, articles] of Object.entries(results)) {
    languageDistribution[lang] = articles.length
  }
  
  // 提取共同话题（简化版）
  const commonTopics = ['global', 'international', 'breaking']
  
  return {
    totalArticles,
    languageDistribution,
    commonTopics
  }
}

/**
 * 查找跨语言模式
 */
function findCrossLanguagePatterns(results: Record<string, any[]>): {
  commonKeywords: string[]
  timePatterns: string[]
  sentimentConsistency: boolean
} {
  // 简化的跨语言模式分析
  return {
    commonKeywords: ['news', 'report', 'update'],
    timePatterns: ['morning_peak', 'evening_peak'],
    sentimentConsistency: true
  }
}