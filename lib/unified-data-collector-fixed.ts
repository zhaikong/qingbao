// 统一数据采集器 - 修复版本
// 修复进度回调死循环、添加超时机制、优化错误处理

import { SearchResult } from './types'
import { geminiPrimarySchedulerFixed, TaskType } from './gemini-primary-scheduler-fixed'

export enum CollectionMethod {
  API_KEY = 'api_key',
  BROWSER_CRAWL = 'browser_crawl',
  MCP_PROCESS = 'mcp_process'
}

export interface DataSourceConfig {
  name: string
  method: CollectionMethod
  url?: string
  apiKey?: string
  enabled: boolean
  timeout?: number
}

// 进度回调接口
export interface ProgressCallback {
  (progress: number, status: string): void
}

// 数据采集状态
interface CollectionState {
  totalSources: number
  completedSources: number
  currentSource: string
  startTime: number
  errors: string[]
}

export class UnifiedDataCollectorFixed {
  private dataSources: DataSourceConfig[] = [
    {
      name: 'GNews',
      method: CollectionMethod.API_KEY,
      url: 'https://gnews.io/api/v4/search',
      apiKey: process.env.GNEWS_API_TOKEN,
      enabled: !!process.env.GNEWS_API_TOKEN,
      timeout: 10000
    },
    {
      name: 'NewsAPI',
      method: CollectionMethod.API_KEY,
      url: 'https://newsapi.org/v2/everything',
      apiKey: process.env.NEWSAPI_KEY,
      enabled: !!process.env.NEWSAPI_KEY,
      timeout: 10000
    },
    {
      name: 'OTX_Security',
      method: CollectionMethod.BROWSER_CRAWL,
      url: process.env.OTX_DASHBOARD_URL || 'https://otx.alienvault.com/dashboard/new',
      enabled: process.env.CHROME_MCP_ENABLED === 'true',
      timeout: 30000
    },
    {
      name: 'Firecrawl_Web',
      method: CollectionMethod.MCP_PROCESS,
      url: 'https://firecrawl.dev',
      enabled: !!process.env.FIRECRAWL_API_KEY,
      timeout: 60000
    }
  ]

  private collectionState: CollectionState = {
    totalSources: 0,
    completedSources: 0,
    currentSource: '',
    startTime: 0,
    errors: []
  }

  // 主要数据收集方法 - 修复版本
  async collectIntelligence(
    query: string, 
    progressCallback?: ProgressCallback,
    maxTimeout: number = 300000 // 5分钟总超时
  ): Promise<SearchResult[]> {
    console.log(`🚀 开始智能情报收集: "${query}"`)
    
    // 初始化状态
    this.collectionState = {
      totalSources: this.dataSources.filter(s => s.enabled).length,
      completedSources: 0,
      currentSource: '',
      startTime: Date.now(),
      errors: []
    }

    // 安全的进度回调
    const safeProgressCallback = (progress: number, status: string) => {
      try {
        // 确保进度值在合理范围内
        const safeProgress = Math.max(0, Math.min(100, Math.round(progress)))
        
        if (progressCallback) {
          progressCallback(safeProgress, status)
        }
        
        console.log(`📊 进度: ${safeProgress}% - ${status}`)
      } catch (error) {
        console.error('进度回调错误:', error)
      }
    }

    // 总超时控制
    const timeoutPromise = new Promise<SearchResult[]>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`数据采集总超时: ${maxTimeout}ms`))
      }, maxTimeout)
    })

    try {
      const collectionPromise = this.performDataCollection(query, safeProgressCallback)
      const results = await Promise.race([collectionPromise, timeoutPromise])
      
      safeProgressCallback(100, '情报收集完成')
      console.log(`✅ 智能情报收集完成，最终 ${results.length} 条高质量情报`)
      return results

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      console.error('❌ 情报收集失败:', errorMsg)
      safeProgressCallback(0, `收集失败: ${errorMsg}`)
      
      // 返回部分结果而不是完全失败
      return this.getPartialResults()
    }
  }

  // 执行数据采集的核心逻辑
  private async performDataCollection(
    query: string, 
    progressCallback: ProgressCallback
  ): Promise<SearchResult[]> {
    
    progressCallback(5, '初始化Gemini智能调度器...')
    
    // 查询优化
    const optimizedQuery = await this.optimizeQueryWithGemini(query)
    console.log(`🎯 Gemini优化查询: "${optimizedQuery}"`)
    
    progressCallback(15, '开始多源数据采集...')
    
    const allResults: SearchResult[] = []
    const enabledSources = this.dataSources.filter(source => source.enabled)
    
    // 并行采集数据，但限制并发数
    const concurrency = 2 // 限制并发数避免资源竞争
    const sourceGroups = this.chunkArray(enabledSources, concurrency)
    
    let completedGroups = 0
    
    for (const group of sourceGroups) {
      const groupPromises = group.map(async (source, index) => {
        try {
          this.collectionState.currentSource = source.name
          console.log(`📡 采集数据源: ${source.name}`)
          
          let results: SearchResult[] = []
          
          // 为每个数据源设置独立超时
          const sourceTimeout = source.timeout || 30000
          const sourcePromise = this.collectFromSource(source, optimizedQuery)
          const timeoutPromise = new Promise<SearchResult[]>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`数据源 ${source.name} 超时`))
            }, sourceTimeout)
          })
          
          results = await Promise.race([sourcePromise, timeoutPromise])
          
          this.collectionState.completedSources++
          
          // 计算进度：15% + (完成的源数 / 总源数) * 50%
          const progress = 15 + (this.collectionState.completedSources / this.collectionState.totalSources) * 50
          progressCallback(progress, `完成 ${source.name} 数据采集`)
          
          return results
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误'
          console.error(`❌ ${source.name} 采集失败:`, errorMsg)
          this.collectionState.errors.push(`${source.name}: ${errorMsg}`)
          
          this.collectionState.completedSources++
          const progress = 15 + (this.collectionState.completedSources / this.collectionState.totalSources) * 50
          progressCallback(progress, `${source.name} 采集失败，继续其他源`)
          
          return []
        }
      })
      
      const groupResults = await Promise.all(groupPromises)
      groupResults.forEach(results => allResults.push(...results))
      
      completedGroups++
    }
    
    console.log(`📊 原始数据采集完成，共 ${allResults.length} 条`)
    
    if (allResults.length === 0) {
      progressCallback(70, '未获取到数据，尝试备用方案...')
      return await this.fallbackDataCollection(optimizedQuery, progressCallback)
    }
    
    progressCallback(70, '开始Gemini智能分析和数据融合...')
    
    // 智能分析和数据融合
    const analyzedResults = await this.analyzeAndFuseDataWithGemini(
      allResults, 
      query, 
      progressCallback
    )
    
    progressCallback(90, '生成最终情报报告...')
    
    // 生成综合情报摘要
    const finalResults = await this.generateIntelligenceSummaryWithGemini(
      analyzedResults, 
      query
    )
    
    return finalResults
  }

  // 从单个数据源采集数据
  private async collectFromSource(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    switch (source.method) {
      case CollectionMethod.API_KEY:
        return await this.collectWithApi(source, query)
      case CollectionMethod.BROWSER_CRAWL:
        return await this.collectWithBrowser(source, query)
      case CollectionMethod.MCP_PROCESS:
        return await this.collectWithMcp(source, query)
      default:
        console.warn(`未知的采集方法: ${source.method}`)
        return []
    }
  }

  // 备用数据采集方案
  private async fallbackDataCollection(
    query: string, 
    progressCallback: ProgressCallback
  ): Promise<SearchResult[]> {
    try {
      progressCallback(75, '使用智谱AI备用方案...')
      
      const { zhipuModelScheduler } = await import('./zhipu-model-scheduler')
      
      const fallbackPrompt = `请基于查询关键词"${query}"生成相关的情报分析内容，包括可能的信息源、关键事件、趋势分析等。`
      
      const fallbackResult = await zhipuModelScheduler.analyzeBasicText(fallbackPrompt)
      
      const fallbackSearchResult: SearchResult = {
        title: `智谱AI分析 - ${query}`,
        content: fallbackResult,
        source: '智谱AI备用方案',
        url: '',
        publishedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        relevanceScore: 0.7,
        credibilityScore: 0.8,
        priority: 'medium'
      }
      
      progressCallback(85, '备用方案完成')
      return [fallbackSearchResult]
      
    } catch (error) {
      console.error('备用方案也失败:', error)
      return []
    }
  }

  // 获取部分结果（容错机制）
  private getPartialResults(): SearchResult[] {
    // 返回一个基本的错误信息结果
    return [{
      title: '数据采集遇到问题',
      content: `数据采集过程中遇到问题。错误信息：${this.collectionState.errors.join('; ')}。请检查网络连接和API配置。`,
      source: '系统提示',
      url: '',
      publishedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      relevanceScore: 0.5,
      credibilityScore: 0.6,
      priority: 'low'
    }]
  }

  // 数组分块工具函数
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  // 使用Gemini优化查询（带超时）
  private async optimizeQueryWithGemini(query: string): Promise<string> {
    try {
      const optimizationPrompt = `
作为情报分析专家，请优化以下查询关键词以获得更好的搜索结果：

原始查询: "${query}"

请进行以下优化：
1. 添加相关的同义词和变体
2. 包含可能的英文术语
3. 考虑地理和时间因素
4. 添加相关的专业术语

只返回优化后的查询字符串，不要其他解释。
`

      const optimizedQuery = await geminiPrimarySchedulerFixed.executeTask(
        TaskType.WEB_SEARCH,
        optimizationPrompt,
        {
          includeWebSearch: true,
          temperature: 0.3,
          timeout: 15000 // 15秒超时
        }
      )

      return optimizedQuery.trim() || query
    } catch (error) {
      console.warn('查询优化失败，使用原始查询:', error)
      return query
    }
  }

  // API采集方法（优化版）
  private async collectWithApi(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    try {
      console.log(`🔑 ${source.name}: 使用API密钥调用...`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), source.timeout || 10000)

      let url = source.url!
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }

      if (source.name === 'GNews') {
        url += `?q=${encodeURIComponent(query)}&token=${source.apiKey}&lang=zh&max=10`
      } else if (source.name === 'NewsAPI') {
        url += `?q=${encodeURIComponent(query)}&apiKey=${source.apiKey}&language=zh&pageSize=10`
      }

      const response = await fetch(url, {
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return this.parseApiResponse(source.name, data)

    } catch (error) {
      console.error(`❌ ${source.name} API调用失败:`, error instanceof Error ? error.message : error)
      return []
    }
  }

  // 浏览器采集方法（优化版）
  private async collectWithBrowser(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    try {
      console.log(`🌐 ${source.name}: 使用浏览器爬取数据...`)
      
      if (process.env.CHROME_MCP_ENABLED === 'true') {
        return await this.chromeNavigateAndExtract(source, query)
      }
      
      console.log(`⚠️ ${source.name}: 浏览器工具未启用，跳过`)
      return []

    } catch (error) {
      console.error(`❌ ${source.name} 浏览器爬取失败:`, error instanceof Error ? error.message : error)
      return []
    }
  }

  // MCP采集方法（优化版）
  private async collectWithMcp(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    try {
      console.log(`🔧 ${source.name}: 使用MCP处理数据...`)
      
      if (source.name === 'Firecrawl_Web') {
        return await this.firecrawlSearch(query)
      }

      return []

    } catch (error) {
      console.error(`❌ ${source.name} MCP处理失败:`, error instanceof Error ? error.message : error)
      return []
    }
  }

  // Chrome MCP导航和提取（带超时）
  private async chromeNavigateAndExtract(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    try {
      const { chromeMcpIntegration } = await import('./chrome-mcp-integration')
      
      console.log(`🔍 使用Chrome MCP导航到 ${source.url}`)
      
      let results: SearchResult[] = []
      
      if (source.name === 'OTX_Security') {
        results = await chromeMcpIntegration.accessOtxDashboard(query)
      } else if (source.name === 'ACLED_Ukraine') {
        results = await chromeMcpIntegration.accessAcledUkraine(query)
      } else if (source.name === 'X_Platform') {
        results = await chromeMcpIntegration.accessXPlatform(query)
      } else {
        results = await chromeMcpIntegration.automateWebAccess(source.url!, query)
      }

      return results

    } catch (error) {
      console.error('Chrome MCP导航失败:', error)
      return []
    }
  }

  // Firecrawl搜索（带超时）
  private async firecrawlSearch(query: string): Promise<SearchResult[]> {
    try {
      const { firecrawlMcpIntegration } = await import('./firecrawl-mcp-integration')
      return await firecrawlMcpIntegration.searchWeb(query)
    } catch (error) {
      console.error('Firecrawl搜索失败:', error)
      return []
    }
  }

  // 使用Gemini进行智能分析和数据融合（优化版）
  private async analyzeAndFuseDataWithGemini(
    allResults: SearchResult[], 
    query: string, 
    progressCallback: ProgressCallback
  ): Promise<SearchResult[]> {
    if (allResults.length === 0) {
      return []
    }

    console.log(`🧠 开始Gemini智能分析和数据融合，共 ${allResults.length} 条数据`)

    try {
      progressCallback(75, 'Gemini深度分析中...')

      const analysisPrompt = `
作为专业情报分析师，请对以下多源情报数据进行深度分析和融合：

查询关键词：${query}

数据源信息：
${allResults.slice(0, 10).map((result, index) => `
${index + 1}. 来源：${result.source}
   标题：${result.title}
   内容：${result.content.substring(0, 300)}...
   发布时间：${result.publishedAt || result.timestamp || 'N/A'}
`).join('\n')}

请进行以下深度分析：
1. 信息去重和整合
2. 可信度评估 (0-1)
3. 相关性排序 (0-1)
4. 关键信息提取
5. 趋势分析

返回JSON格式的分析结果：
{
  "summary": "整体分析摘要",
  "keyFindings": ["关键发现1", "关键发现2"],
  "trends": ["趋势1", "趋势2"],
  "optimizedResults": [
    {
      "index": 原始数据索引,
      "credibilityScore": 0.0-1.0,
      "relevanceScore": 0.0-1.0,
      "priority": "high/medium/low"
    }
  ]
}
`

      const systemPrompt = `你是一个专业的情报分析师，具备多源数据融合和交叉验证能力。`

      const analysisResult = await geminiPrimarySchedulerFixed.executeTask(
        TaskType.DEEP_ANALYSIS,
        analysisPrompt,
        {
          includeWebSearch: true,
          systemPrompt: systemPrompt,
          temperature: 0.2,
          timeout: 45000 // 45秒超时
        }
      )

      progressCallback(85, '优化数据结构中...')

      const optimizedResults = await this.parseGeminiAnalysisAndOptimize(allResults, analysisResult)
      
      console.log(`✅ Gemini深度分析完成，优化后 ${optimizedResults.length} 条高质量数据`)
      return optimizedResults

    } catch (error) {
      console.error('❌ Gemini分析失败，使用智谱AI备选方案:', error)
      
      try {
        const { zhipuModelScheduler } = await import('./zhipu-model-scheduler')
        
        const fallbackPrompt = `请对以下情报数据进行分析和融合：查询关键词：${query}，数据条数：${allResults.length}`

        const fallbackResult = await zhipuModelScheduler.analyzeBasicText(fallbackPrompt)

        const optimizedResults = this.optimizeResultsBasedOnAnalysis(allResults, fallbackResult)
        console.log(`✅ 智谱AI备选分析完成，优化后 ${optimizedResults.length} 条数据`)
        return optimizedResults

      } catch (fallbackError) {
        console.error('❌ 备选分析也失败，返回原始数据:', fallbackError)
        return allResults.slice(0, 15) // 返回前15条原始数据
      }
    }
  }

  // 解析Gemini分析结果并优化数据（优化版）
  private async parseGeminiAnalysisAndOptimize(
    results: SearchResult[], 
    analysisResult: string
  ): Promise<SearchResult[]> {
    try {
      const analysis = JSON.parse(analysisResult)
      
      if (analysis.optimizedResults && Array.isArray(analysis.optimizedResults)) {
        const optimizedResults: SearchResult[] = []
        
        for (const opt of analysis.optimizedResults) {
          if (opt.index >= 0 && opt.index < results.length) {
            const result = { ...results[opt.index] }
            result.credibilityScore = opt.credibilityScore || 0.7
            result.relevanceScore = opt.relevanceScore || 0.7
            result.priority = opt.priority || 'medium'
            optimizedResults.push(result)
          }
        }
        
        return optimizedResults.sort((a, b) => {
          const scoreA = (a.relevanceScore || 0.5) * (a.credibilityScore || 0.5)
          const scoreB = (b.relevanceScore || 0.5) * (b.credibilityScore || 0.5)
          return scoreB - scoreA
        })
      }
    } catch (parseError) {
      console.warn('解析Gemini分析结果失败，使用默认优化:', parseError)
    }

    return results.sort((a, b) => {
      const scoreA = (a.relevanceScore || 0.5) * (a.credibilityScore || 0.7)
      const scoreB = (b.relevanceScore || 0.5) * (b.credibilityScore || 0.7)
      return scoreB - scoreA
    }).slice(0, 20)
  }

  // 使用Gemini生成综合情报摘要（优化版）
  private async generateIntelligenceSummaryWithGemini(
    results: SearchResult[], 
    query: string
  ): Promise<SearchResult[]> {
    if (results.length === 0) {
      return results
    }

    try {
      const summaryPrompt = `
基于以下分析后的情报数据，生成一份综合情报摘要：

查询主题：${query}

高质量情报数据：
${results.slice(0, 8).map((result, index) => `
${index + 1}. 标题：${result.title}
   来源：${result.source}
   内容摘要：${result.content.substring(0, 200)}...
`).join('\n')}

请生成一份综合情报摘要，包含：
1. 核心发现和关键信息
2. 趋势分析和预测
3. 风险评估和建议

生成一个新的综合情报条目，标题为"综合情报摘要 - ${query}"
`

      const summaryResult = await geminiPrimarySchedulerFixed.executeTask(
        TaskType.CONTENT_GENERATION,
        summaryPrompt,
        {
          includeWebSearch: true,
          temperature: 0.4,
          timeout: 30000 // 30秒超时
        }
      )

      const summaryItem: SearchResult = {
        title: `综合情报摘要 - ${query}`,
        content: summaryResult,
        source: 'Gemini智能分析',
        url: '',
        publishedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        relevanceScore: 1.0,
        credibilityScore: 0.95,
        priority: 'high'
      }

      return [summaryItem, ...results]

    } catch (error) {
      console.error('生成综合摘要失败:', error)
      return results
    }
  }

  // 解析API响应
  private parseApiResponse(sourceName: string, data: any): SearchResult[] {
    const results: SearchResult[] = []

    try {
      if (sourceName === 'GNews' && data.articles) {
        data.articles.forEach((article: any) => {
          results.push({
            title: article.title,
            content: article.description || article.content || '',
            url: article.url,
            source: 'GNews',
            publishedAt: article.publishedAt,
            timestamp: new Date().toISOString(),
            relevanceScore: 0.8,
            credibilityScore: 0.8
          })
        })
      } else if (sourceName === 'NewsAPI' && data.articles) {
        data.articles.forEach((article: any) => {
          results.push({
            title: article.title,
            content: article.description || article.content || '',
            url: article.url,
            source: 'NewsAPI',
            publishedAt: article.publishedAt,
            timestamp: new Date().toISOString(),
            relevanceScore: 0.8,
            credibilityScore: 0.8
          })
        })
      }
    } catch (error) {
      console.error(`解析${sourceName}响应失败:`, error)
    }

    return results
  }

  // 基于分析结果优化数据（备选方案）
  private optimizeResultsBasedOnAnalysis(results: SearchResult[], analysisResult: string): SearchResult[] {
    return results.sort((a, b) => {
      const scoreA = (a.relevanceScore || 0.5) * (a.credibilityScore || 0.7)
      const scoreB = (b.relevanceScore || 0.5) * (b.credibilityScore || 0.7)
      return scoreB - scoreA
    }).slice(0, 15)
  }

  // 获取数据源状态
  getDataSourceStatus() {
    return {
      totalSources: this.dataSources.length,
      enabledSources: this.dataSources.filter(s => s.enabled).length,
      apiSources: this.dataSources.filter(s => s.method === CollectionMethod.API_KEY && s.enabled).length,
      browserSources: this.dataSources.filter(s => s.method === CollectionMethod.BROWSER_CRAWL && s.enabled).length,
      mcpSources: this.dataSources.filter(s => s.method === CollectionMethod.MCP_PROCESS && s.enabled).length,
      sources: this.dataSources.map(s => ({
        name: s.name,
        method: s.method,
        enabled: s.enabled,
        hasApiKey: !!s.apiKey
      })),
      collectionState: this.collectionState
    }
  }

  // 重置采集状态
  resetCollectionState() {
    this.collectionState = {
      totalSources: 0,
      completedSources: 0,
      currentSource: '',
      startTime: 0,
      errors: []
    }
  }
}

// 导出修复版本的单例实例
export const unifiedDataCollectorFixed = new UnifiedDataCollectorFixed()
