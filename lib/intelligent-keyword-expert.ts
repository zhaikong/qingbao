import { SearchResult } from './types'

// 关键词生成策略配置
export interface KeywordStrategy {
  language: 'zh' | 'en' | 'ar'
  searchType: 'geopolitical' | 'security' | 'economic' | 'comprehensive'
  sources: string[]
  priority: number
}

// 智能关键词生成结果
export interface KeywordGenerationResult {
  originalTopic: string
  strategies: Array<{
    language: string
    keywords: string[]
    searchQueries: string[]
    recommendedSources: string[]
    searchRationale: string
  }>
  totalQueries: number
  estimatedResults: number
}

/**
 * 智能关键词专家系统
 * 基于大模型进行关键词优化和多语言搜索策略生成
 */
export class IntelligentKeywordExpert {
  
  /**
   * 分析主题并生成智能关键词策略
   */
  async generateSearchStrategy(
    topic: string, 
    analysisType: 'geopolitical' | 'security' | 'economic' | 'comprehensive'
  ): Promise<KeywordGenerationResult> {
    console.log(`🧠 启动智能关键词专家分析: "${topic}"`)

    try {
      // 调用Gemini进行关键词专家分析
      const keywordAnalysis = await this.analyzeTopicWithGemini(topic, analysisType)
      
      // 生成多语言搜索策略
      const strategies = await this.generateMultiLanguageStrategies(keywordAnalysis, analysisType)
      
      // 计算预估结果
      const totalQueries = strategies.reduce((sum, s) => sum + s.searchQueries.length, 0)
      const estimatedResults = totalQueries * 12 // 每个查询预估12个结果
      
      const result: KeywordGenerationResult = {
        originalTopic: topic,
        strategies,
        totalQueries,
        estimatedResults
      }
      
      console.log(`✅ 关键词策略生成完成: ${totalQueries}个查询, 预估${estimatedResults}个结果`)
      return result
      
    } catch (error: any) {
      console.error('❌ 关键词生成失败:', error.message)
      
      // fallback策略
      return this.generateFallbackStrategy(topic, analysisType)
    }
  }
  
  /**
   * 使用Gemini进行主题分析和关键词生成
   */
  private async analyzeTopicWithGemini(
    topic: string, 
    analysisType: string
  ): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API密钥未配置')
    }

    const prompt = this.buildKeywordExpertPrompt(topic, analysisType)
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 3000,
            topP: 0.8
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API请求失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // 解析JSON结果
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: content }
    } catch {
      return { analysis: content }
    }
  }
  
  /**
   * 构建关键词专家提示词
   */
  private buildKeywordExpertPrompt(topic: string, analysisType: string): string {
    const typeMap = {
      'geopolitical': '地缘政治分析',
      'security': '安全威胁分析', 
      'economic': '经济情报分析',
      'comprehensive': '综合情报分析'
    }
    
    return `你是世界顶级的情报关键词专家，具有深厚的多语言搜索经验和情报收集专业知识。

任务：为以下主题生成最优的多语言关键词搜索策略

主题: ${topic}
分析类型: ${typeMap[analysisType as keyof typeof typeMap]}

请按以下JSON格式返回详细的关键词策略：

{
  "chineseStrategy": {
    "keywords": ["关键词1", "关键词2", "关键词3"],
    "searchQueries": ["完整搜索句1", "完整搜索句2"],
    "recommendedSources": ["推荐信源1", "推荐信源2"],
    "rationale": "中文搜索策略说明"
  },
  "englishStrategy": {
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "searchQueries": ["complete search query1", "complete search query2"],
    "recommendedSources": ["recommended source1", "recommended source2"],
    "rationale": "English search strategy rationale"
  },
  "arabicStrategy": {
    "keywords": ["الكلمة المفتاحية1", "الكلمة المفتاحية2"],
    "searchQueries": ["استعلام البحث الكامل1", "استعلام البحث الكامل2"],
    "recommendedSources": ["المصدر الموصى به1", "المصدر الموصى به2"],
    "rationale": "Arabic search strategy rationale"
  }
}

专业要求：
1. 关键词必须精准、具有情报价值
2. 搜索查询要考虑不同文化背景和表达习惯
3. 推荐最适合的信源平台（社交媒体、新闻、学术、政府等）
4. 英文和阿拉伯语优先，确保国际视野
5. 考虑敏感词规避和深度搜索技巧

开始分析：`
  }
  
  /**
   * 生成多语言搜索策略
   */
  private async generateMultiLanguageStrategies(
    analysis: any, 
    analysisType: string
  ): Promise<Array<{
    language: string
    keywords: string[]
    searchQueries: string[]
    recommendedSources: string[]
    searchRationale: string
  }>> {
    const strategies = []
    
    // 中文策略
    if (analysis.chineseStrategy) {
      strategies.push({
        language: '中文',
        keywords: analysis.chineseStrategy.keywords || [],
        searchQueries: analysis.chineseStrategy.searchQueries || [],
        recommendedSources: this.mapSourcesToActual(analysis.chineseStrategy.recommendedSources || [], 'zh'),
        searchRationale: analysis.chineseStrategy.rationale || '基于中文语境的搜索策略'
      })
    }
    
    // 英文策略（优先）
    if (analysis.englishStrategy) {
      strategies.push({
        language: 'English',
        keywords: analysis.englishStrategy.keywords || [],
        searchQueries: analysis.englishStrategy.searchQueries || [],
        recommendedSources: this.mapSourcesToActual(analysis.englishStrategy.recommendedSources || [], 'en'),
        searchRationale: analysis.englishStrategy.rationale || 'English-focused search strategy'
      })
    }
    
    // 阿拉伯语策略（优先）
    if (analysis.arabicStrategy) {
      strategies.push({
        language: 'العربية',
        keywords: analysis.arabicStrategy.keywords || [],
        searchQueries: analysis.arabicStrategy.searchQueries || [],
        recommendedSources: this.mapSourcesToActual(analysis.arabicStrategy.recommendedSources || [], 'ar'),
        searchRationale: analysis.arabicStrategy.rationale || 'استراتيجية البحث باللغة العربية'
      })
    }
    
    return strategies
  }
  
  /**
   * 将推荐信源映射到实际可用的API源
   */
  private mapSourcesToActual(recommendedSources: string[], language: string): string[] {
    const sourceMap: Record<string, string[]> = {
      'zh': ['Gemini-2.5-Flash', '智谱AI', 'Chrome-MCP-Baidu', 'NewsAPI', 'DuckDuckGo'],
      'en': ['Gemini-2.5-Flash', 'Chrome-MCP-Google', 'Chrome-MCP-Bing', 'Twitter-API', 'NewsAPI', 'AlienVault-OTX', 'Shodan'],
      'ar': ['Gemini-2.5-Flash', 'Chrome-MCP-Google', 'Twitter-API', 'Al-Jazeera-API', 'NewsAPI']
    }
    
    // 智能映射逻辑
    const availableSources = sourceMap[language] || sourceMap['en']
    
    // 基于推荐内容选择最佳匹配源
    const selectedSources = new Set<string>()
    
    // 优先选择AI搜索
    selectedSources.add('Gemini-2.5-Flash')
    
    // 根据语言添加专门的Chrome MCP搜索
    if (language === 'en') {
      selectedSources.add('Chrome-MCP-Google')
      selectedSources.add('Twitter-API')
    } else if (language === 'zh') {
      selectedSources.add('智谱AI')
      selectedSources.add('Chrome-MCP-Baidu')
    } else if (language === 'ar') {
      selectedSources.add('Chrome-MCP-Google')
      selectedSources.add('Twitter-API')
    }
    
    // 添加新闻源
    selectedSources.add('NewsAPI')
    
    // 根据推荐内容添加专业源
    recommendedSources.forEach(rec => {
      const recLower = rec.toLowerCase()
      if (recLower.includes('social') || recLower.includes('twitter') || recLower.includes('社交')) {
        selectedSources.add('Twitter-API')
      }
      if (recLower.includes('threat') || recLower.includes('security') || recLower.includes('威胁')) {
        selectedSources.add('AlienVault-OTX')
        selectedSources.add('Shodan')
      }
      if (recLower.includes('news') || recLower.includes('新闻') || recLower.includes('إخبار')) {
        selectedSources.add('NewsAPI')
        selectedSources.add('GNews')
      }
    })
    
    return Array.from(selectedSources)
  }
  
  /**
   * 生成备用策略（当Gemini不可用时）
   */
  private generateFallbackStrategy(
    topic: string, 
    analysisType: string
  ): KeywordGenerationResult {
    console.log('🔄 使用备用关键词策略')
    
    // 基础关键词提取
    const baseKeywords = topic.split(/\s+|，|,/).filter(k => k.length > 1)
    
    const strategies = [
      {
        language: '中文',
        keywords: baseKeywords,
        searchQueries: [topic, `${topic} 最新动态`, `${topic} 分析报告`],
        recommendedSources: ['智谱AI', 'NewsAPI', 'DuckDuckGo'],
        searchRationale: '基于主题的基础搜索策略'
      },
      {
        language: 'English', 
        keywords: baseKeywords,
        searchQueries: [topic, `${topic} latest news`, `${topic} analysis`, `${topic} intelligence`],
        recommendedSources: ['Gemini-2.5-Flash', 'Chrome-MCP-Google', 'Twitter-API', 'NewsAPI'],
        searchRationale: 'English-focused basic search strategy'
      },
      {
        language: 'العربية',
        keywords: baseKeywords,
        searchQueries: [topic, `${topic} أخبار`, `${topic} تحليل`],
        recommendedSources: ['Gemini-2.5-Flash', 'Chrome-MCP-Google', 'NewsAPI'],
        searchRationale: 'استراتيجية البحث الأساسية باللغة العربية'
      }
    ]
    
    return {
      originalTopic: topic,
      strategies,
      totalQueries: strategies.reduce((sum, s) => sum + s.searchQueries.length, 0),
      estimatedResults: strategies.length * 3 * 10 // 3个查询 x 10个结果
    }
  }
  
  /**
   * 验证关键词质量
   */
  validateKeywordQuality(keywords: string[]): {
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0
    
    // 检查关键词数量
    if (keywords.length >= 3) {
      score += 20
    } else {
      feedback.push('建议增加更多关键词以提高搜索覆盖率')
    }
    
    // 检查关键词长度
    const avgLength = keywords.reduce((sum, k) => sum + k.length, 0) / keywords.length
    if (avgLength > 2 && avgLength < 15) {
      score += 30
    } else {
      feedback.push('关键词长度需要优化')
    }
    
    // 检查多样性
    const uniqueChars = new Set(keywords.join('').toLowerCase()).size
    if (uniqueChars > 10) {
      score += 25
    }
    
    // 检查是否包含专业术语
    const professionalTerms = ['分析', 'analysis', 'intelligence', 'security', 'threat', 'geopolitical']
    const hasProfessional = keywords.some(k => 
      professionalTerms.some(term => k.toLowerCase().includes(term.toLowerCase()))
    )
    if (hasProfessional) {
      score += 25
    } else {
      feedback.push('建议添加更多专业情报术语')
    }
    
    return { score, feedback }
  }
}

// 导出单例实例
export const intelligentKeywordExpert = new IntelligentKeywordExpert()

// 便捷函数
export async function generateIntelligentKeywords(
  topic: string,
  analysisType: 'geopolitical' | 'security' | 'economic' | 'comprehensive' = 'comprehensive'
): Promise<KeywordGenerationResult> {
  return intelligentKeywordExpert.generateSearchStrategy(topic, analysisType)
}