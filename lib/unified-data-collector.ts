import { SearchResult } from './types'
import { geminiPrimaryScheduler, TaskType } from './gemini-primary-scheduler'

// 数据采集方式枚举
export enum CollectionMethod {
  API_KEY = 'api_key',           // 方式1: 有key直接调用
  BROWSER_CRAWL = 'browser_crawl', // 方式2: 浏览器爬取
  MCP_PROCESS = 'mcp_process'     // 方式3: MCP处理
}

// 数据源配置接口
export interface DataSourceConfig {
  name: string
  method: CollectionMethod
  url?: string
  apiKey?: string
  enabled: boolean
  timeout?: number
}

// 统一数据采集器 - Gemini优先策略
export class UnifiedDataCollector {
  private dataSources: DataSourceConfig[] = [
    // 方式1: 有key直接调用
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
    
    // 方式2: 浏览器直接爬取
    {
      name: 'OTX_Security',
      method: CollectionMethod.BROWSER_CRAWL,
      url: process.env.OTX_DASHBOARD_URL || 'https://otx.alienvault.com/dashboard/new',
      enabled: process.env.CHROME_MCP_ENABLED === 'true',
      timeout: 30000
    },
    {
      name: 'ACLED_Ukraine',
      method: CollectionMethod.BROWSER_CRAWL,
      url: process.env.ACLED_UKRAINE_URL || 'https://acleddata.com/monitor/ukraine-conflict-monitor',
      enabled: process.env.CHROME_MCP_ENABLED === 'true',
      timeout: 30000
    },
    {
      name: 'X_Platform',
      method: CollectionMethod.BROWSER_CRAWL,
      url: process.env.X_PLATFORM_URL || 'https://x.com',
      enabled: process.env.X_PLATFORM_ENABLED === 'true',
      timeout: 30000
    },
    
    // 方式3: MCP处理
    {
      name: 'Firecrawl_Web',
      method: CollectionMethod.MCP_PROCESS,
      url: 'https://firecrawl.dev',
      enabled: !!process.env.FIRECRAWL_API_KEY,
      timeout: 60000
    }
  ]

  // 主要数据收集方法 - 使用Gemini优先策略
  async collectIntelligence(query: string, progressCallback?: (progress: number, status: string) => void): Promise<SearchResult[]> {
    console.log(`🚀 开始智能情报收集: "${query}"`)
    
    if (progressCallback) {
      progressCallback(5, '初始化Gemini智能调度器...')
    }

    // 首先使用Gemini进行查询优化和关键词扩展
    const optimizedQuery = await this.optimizeQueryWithGemini(query)
    console.log(`🎯 Gemini优化查询: "${optimizedQuery}"`)

    if (progressCallback) {
      progressCallback(15, '开始多源数据采集...')
    }

    const allResults: SearchResult[] = []
    const enabledSources = this.dataSources.filter(source => source.enabled)
    const totalSources = enabledSources.length

    // 并行采集数据
    const collectionPromises = enabledSources.map(async (source, index) => {
      try {
        console.log(`📡 采集数据源: ${source.name}`)
        
        let results: SearchResult[] = []
        
        switch (source.method) {
          case CollectionMethod.API_KEY:
            results = await this.collectWithApi(source, optimizedQuery)
            break
          case CollectionMethod.BROWSER_CRAWL:
            results = await this.collectWithBrowser(source, optimizedQuery)
            break
          case CollectionMethod.MCP_PROCESS:
            results = await this.collectWithMcp(source, optimizedQuery)
            break
        }

        if (progressCallback) {
          const progress = 15 + ((index + 1) / totalSources) * 50
          progressCallback(progress, `完成 ${source.name} 数据采集`)
        }

        return results
      } catch (error) {
        console.error(`❌ ${source.name} 采集失败:`, error)
        return []
      }
    })

    const collectionResults = await Promise.all(collectionPromises)
    collectionResults.forEach(results => allResults.push(...results))

    console.log(`📊 原始数据采集完成，共 ${allResults.length} 条`)

    if (progressCallback) {
      progressCallback(70, '开始Gemini智能分析和数据融合...')
    }

    // 使用Gemini进行智能分析和数据融合
    const analyzedResults = await this.analyzeAndFuseDataWithGemini(allResults, query, progressCallback)

    if (progressCallback) {
      progressCallback(90, '生成最终情报报告...')
    }

    // 使用Gemini生成综合情报摘要
    const finalResults = await this.generateIntelligenceSummaryWithGemini(analyzedResults, query)

    if (progressCallback) {
      progressCallback(100, '情报收集完成')
    }

    console.log(`✅ 智能情报收集完成，最终 ${finalResults.length} 条高质量情报`)
    return finalResults
  }

  // 使用Gemini优化查询
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

请使用网络搜索功能获取最新相关信息，然后返回优化后的查询字符串。

只返回优化后的查询字符串，不要其他解释。
`

      const optimizedQuery = await geminiPrimaryScheduler.executeTask(
        TaskType.WEB_SEARCH,
        optimizationPrompt,
        {
          includeWebSearch: true,
          temperature: 0.3
        }
      )

      return optimizedQuery.trim() || query
    } catch (error) {
      console.warn('查询优化失败，使用原始查询:', error)
      return query
    }
  }

  // 方式1: API密钥直接调用
  private async collectWithApi(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    try {
      console.log(`🔑 ${source.name}: 使用API密钥调用...`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), source.timeout || 10000)

      let url = source.url!
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }

      // 构建API请求URL
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

  // 方式2: 浏览器直接爬取
  private async collectWithBrowser(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    try {
      console.log(`🌐 ${source.name}: 使用浏览器爬取数据...`)
      
      // 使用Chrome MCP Server
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

  // 方式3: MCP处理
  private async collectWithMcp(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    try {
      console.log(`🔧 ${source.name}: 使用MCP处理数据...`)
      
      // 使用Firecrawl MCP
      if (source.name === 'Firecrawl_Web') {
        return await this.firecrawlSearch(query)
      }

      return []

    } catch (error) {
      console.error(`❌ ${source.name} MCP处理失败:`, error instanceof Error ? error.message : error)
      return []
    }
  }

  // Chrome MCP导航和提取
  private async chromeNavigateAndExtract(source: DataSourceConfig, query: string): Promise<SearchResult[]> {
    try {
      const { chromeMcpIntegration } = await import('./chrome-mcp-integration')
      
      console.log(`🔍 使用Chrome MCP导航到 ${source.url}`)
      
      let results: SearchResult[] = []
      
      // 根据不同源进行特定的数据提取
      if (source.name === 'OTX_Security') {
        results = await chromeMcpIntegration.accessOtxDashboard(query)
      } else if (source.name === 'ACLED_Ukraine') {
        results = await chromeMcpIntegration.accessAcledUkraine(query)
      } else if (source.name === 'X_Platform') {
        results = await chromeMcpIntegration.accessXPlatform(query)
      } else {
        // 通用自动化访问
        results = await chromeMcpIntegration.automateWebAccess(source.url!, query)
      }

      return results

    } catch (error) {
      console.error('Chrome MCP导航失败:', error)
      return []
    }
  }

  // Firecrawl搜索
  private async firecrawlSearch(query: string): Promise<SearchResult[]> {
    try {
      const { firecrawlMcpIntegration } = await import('./firecrawl-mcp-integration')
      return await firecrawlMcpIntegration.searchWeb(query)
    } catch (error) {
      console.error('Firecrawl搜索失败:', error)
      return []
    }
  }

  // 使用Gemini进行智能分析和数据融合
  private async analyzeAndFuseDataWithGemini(
    allResults: SearchResult[], 
    query: string, 
    progressCallback?: (progress: number, status: string) => void
  ): Promise<SearchResult[]> {
    if (allResults.length === 0) {
      return []
    }

    console.log(`🧠 开始Gemini智能分析和数据融合，共 ${allResults.length} 条数据`)

    try {
      if (progressCallback) {
        progressCallback(75, 'Gemini深度分析中...')
      }

      const analysisPrompt = `
作为专业情报分析师，请对以下多源情报数据进行深度分析和融合：

查询关键词：${query}

数据源信息：
${allResults.map((result, index) => `
${index + 1}. 来源：${result.source}
   标题：${result.title}
   内容：${result.content.substring(0, 400)}...
   发布时间：${result.publishedAt || result.timestamp || 'N/A'}
   URL：${result.url}
`).join('\n')}

请进行以下深度分析：
1. 信息去重和整合 - 识别重复内容并合并
2. 可信度评估 - 基于来源权威性和内容一致性评分(0-1)
3. 相关性排序 - 与查询关键词的匹配度评分(0-1)
4. 关键信息提取 - 提取核心事实和数据点
5. 趋势分析 - 识别发展趋势和模式
6. 交叉验证 - 多源信息的相互印证
7. 时效性评估 - 信息的时间价值
8. 网络搜索补充 - 获取最新相关信息进行验证

请使用你的网络搜索能力获取最新信息进行补充和验证。

返回JSON格式的分析结果：
{
  "summary": "整体分析摘要",
  "keyFindings": ["关键发现1", "关键发现2"],
  "trends": ["趋势1", "趋势2"],
  "credibilityAssessment": "可信度总体评估",
  "recommendations": ["建议1", "建议2"],
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

      const systemPrompt = `你是一个专业的情报分析师，具备以下核心能力：
- 多源数据融合和交叉验证
- 深度语义分析和模式识别  
- 可信度评估和质量控制
- 趋势预测和风险评估
- 网络搜索和实时信息获取
- 结构化数据输出

请充分利用你的网络搜索能力获取最新信息，进行全面深入的分析。`

      const analysisResult = await geminiPrimaryScheduler.executeTask(
        TaskType.DEEP_ANALYSIS,
        analysisPrompt,
        {
          includeWebSearch: true,
          systemPrompt: systemPrompt,
          temperature: 0.2
        }
      )

      if (progressCallback) {
        progressCallback(85, '优化数据结构中...')
      }

      // 解析分析结果并优化数据
      const optimizedResults = await this.parseGeminiAnalysisAndOptimize(allResults, analysisResult)
      
      console.log(`✅ Gemini深度分析完成，优化后 ${optimizedResults.length} 条高质量数据`)
      return optimizedResults

    } catch (error) {
      console.error('❌ Gemini分析失败，尝试智谱AI备选方案:', error)
      
      // 备选方案：使用智谱AI
      try {
        const { zhipuModelScheduler, TaskType: ZhipuTaskType } = await import('./zhipu-model-scheduler')
        
        const fallbackPrompt = `请对以下情报数据进行分析和融合：查询关键词：${query}，数据条数：${allResults.length}`

        const fallbackResult = await zhipuModelScheduler.callModel(
          ZhipuTaskType.BASIC_TEXT,
          fallbackPrompt,
          '你是一个专业的情报分析师。'
        )

        const optimizedResults = this.optimizeResultsBasedOnAnalysis(allResults, fallbackResult)
        console.log(`✅ 智谱AI备选分析完成，优化后 ${optimizedResults.length} 条数据`)
        return optimizedResults

      } catch (fallbackError) {
        console.error('❌ 备选分析也失败，返回原始数据:', fallbackError)
        return allResults
      }
    }
  }

  // 解析Gemini分析结果并优化数据
  private async parseGeminiAnalysisAndOptimize(
    results: SearchResult[], 
    analysisResult: string
  ): Promise<SearchResult[]> {
    try {
      // 尝试解析JSON格式的分析结果
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
        
        // 按优先级和分数排序
        return optimizedResults.sort((a, b) => {
          const scoreA = (a.relevanceScore || 0.5) * (a.credibilityScore || 0.5)
          const scoreB = (b.relevanceScore || 0.5) * (b.credibilityScore || 0.5)
          return scoreB - scoreA
        })
      }
    } catch (parseError) {
      console.warn('解析Gemini分析结果失败，使用默认优化:', parseError)
    }

    // 默认优化：按相关性和可信度排序
    return results.sort((a, b) => {
      const scoreA = (a.relevanceScore || 0.5) * (a.credibilityScore || 0.7)
      const scoreB = (b.relevanceScore || 0.5) * (b.credibilityScore || 0.7)
      return scoreB - scoreA
    }).slice(0, 20) // 限制最多20条高质量结果
  }

  // 使用Gemini生成综合情报摘要
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
${results.slice(0, 10).map((result, index) => `
${index + 1}. 标题：${result.title}
   来源：${result.source}
   内容摘要：${result.content.substring(0, 300)}...
   可信度：${result.credibilityScore}
   相关性：${result.relevanceScore}
`).join('\n')}

请使用网络搜索获取最新信息，然后生成一份综合情报摘要，包含：
1. 核心发现和关键信息
2. 趋势分析和预测
3. 风险评估和建议
4. 信息来源可信度评估

生成一个新的综合情报条目，标题为"综合情报摘要 - ${query}"
`

      // 添加超时控制，避免卡死
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini分析超时')), 30000) // 30秒超时
      })
      
      const summaryResult = await Promise.race([
        geminiPrimaryScheduler.executeTask(
          TaskType.CONTENT_GENERATION,
          summaryPrompt,
          {
            maxTokens: 2000,
            temperature: 0.3
          }
        ),
        timeoutPromise
      ])
          includeWebSearch: true,
          temperature: 0.4
        }
      )

      // 创建综合摘要条目
      const summaryItem: SearchResult = {
        title: `综合情报摘要 - ${query}`,
        content: summaryResult,
        source: 'gemini' as Engine,
        url: '',
        publishedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        relevanceScore: 1.0,
        credibilityScore: 0.95,
        priority: 'high'
      }

      // 将摘要放在最前面
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
    // 简单的优化逻辑，按相关性和可信度排序
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
      }))
    }
  }
}

// 导出单例实例
export const unifiedDataCollector = new UnifiedDataCollector()