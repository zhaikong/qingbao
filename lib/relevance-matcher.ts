// 智能相关性匹配器 - 基于GLM大模型的语义相关性分析
import { SearchResult } from './search-engine'

export interface RelevanceAnalysis {
  score: number // 0-1 相关性分数
  reasons: string[] // 相关性原因
  keywords: string[] // 匹配的关键词
  semanticMatch: boolean // 语义匹配
  contextMatch: boolean // 上下文匹配
  confidence: number // 置信度
}

export class IntelligentRelevanceMatcher {
  private keywordCache = new Map<string, string[]>()
  private semanticCache = new Map<string, RelevanceAnalysis>()
  
  /**
   * 智能相关性分析 - 主入口
   */
  async analyzeRelevance(
    searchQuery: string,
    result: SearchResult,
    useAI: boolean = true
  ): Promise<RelevanceAnalysis> {
    try {
      // 1. 快速关键词匹配
      const keywordAnalysis = this.analyzeKeywordRelevance(searchQuery, result)
      
      // 2. 如果关键词匹配度很高，直接返回
      if (keywordAnalysis.score > 0.8) {
        return keywordAnalysis
      }
      
      // 3. 如果关键词匹配度很低且不使用AI，返回低分
      if (keywordAnalysis.score < 0.2 && !useAI) {
        return keywordAnalysis
      }
      
      // 4. 使用AI进行语义分析
      if (useAI) {
        const semanticAnalysis = await this.analyzeSemanticRelevance(searchQuery, result)
        
        // 综合关键词和语义分析
        return this.combineAnalysis(keywordAnalysis, semanticAnalysis)
      }
      
      return keywordAnalysis
      
    } catch (error) {
      console.error('相关性分析失败:', error)
      return this.getFallbackAnalysis(searchQuery, result)
    }
  }
  
  /**
   * 关键词相关性分析
   */
  private analyzeKeywordRelevance(query: string, result: SearchResult): RelevanceAnalysis {
    const queryKeywords = this.extractKeywords(query)
    const titleKeywords = this.extractKeywords(result.title)
    const contentKeywords = this.extractKeywords(result.content || '')
    
    let score = 0
    let matchedKeywords: string[] = []
    let reasons: string[] = []
    
    // 标题匹配 (权重: 0.5)
    const titleMatches = this.findMatches(queryKeywords, titleKeywords)
    if (titleMatches.length > 0) {
      const titleScore = Math.min(titleMatches.length / queryKeywords.length, 1) * 0.5
      score += titleScore
      matchedKeywords.push(...titleMatches)
      reasons.push(`标题匹配关键词: ${titleMatches.join(', ')}`)
    }
    
    // 内容匹配 (权重: 0.3)
    const contentMatches = this.findMatches(queryKeywords, contentKeywords)
    if (contentMatches.length > 0) {
      const contentScore = Math.min(contentMatches.length / queryKeywords.length, 1) * 0.3
      score += contentScore
      matchedKeywords.push(...contentMatches.filter(k => !matchedKeywords.includes(k)))
      reasons.push(`内容匹配关键词: ${contentMatches.slice(0, 3).join(', ')}`)
    }
    
    // 精确短语匹配 (权重: 0.2)
    const exactMatches = this.findExactPhrases(query, result.title + ' ' + result.content)
    if (exactMatches.length > 0) {
      score += 0.2
      reasons.push(`精确匹配短语: ${exactMatches.slice(0, 2).join(', ')}`)
    }
    
    return {
      score: Math.min(score, 1),
      reasons,
      keywords: Array.from(new Set(matchedKeywords)),
      semanticMatch: false,
      contextMatch: titleMatches.length > 0 || contentMatches.length > 0,
      confidence: score > 0.6 ? 0.8 : 0.6
    }
  }
  
  /**
   * AI语义相关性分析
   */
  private async analyzeSemanticRelevance(query: string, result: SearchResult): Promise<RelevanceAnalysis> {
    try {
      const cacheKey = `${query}:${result.title.substring(0, 50)}`
      
      // 检查缓存
      if (this.semanticCache.has(cacheKey)) {
        return this.semanticCache.get(cacheKey)!
      }
      
      const analysisPrompt = `作为语义相关性分析专家，请分析以下内容与搜索查询的相关性：

搜索查询: \"${query}\"

标题: ${result.title}
内容摘要: ${(result.content || result.snippet || '').substring(0, 500)}...
来源: ${result.source}

请从以下角度分析相关性：
1. 主题相关性：内容是否直接涉及查询主题
2. 语义相关性：即使用词不同，是否在语义上相关
3. 上下文相关性：是否在相同的背景或领域内
4. 时效相关性：时间背景是否匹配

请以JSON格式返回分析结果：
{
  "relevanceScore": 0.0-1.0的分数,
  "semanticMatch": true/false,
  "contextMatch": true/false,
  "reasons": ["相关原因1", "相关原因2"],
  "confidence": 0.0-1.0的置信度
}`

      const { analyzeWithGemini25Flash } = await import('./gemini-temp')
      const aiResult = await analyzeWithGemini25Flash(analysisPrompt, 'quick')
      
      // 解析AI分析结果
      const analysis = this.parseSemanticAnalysis(aiResult.analysis)
      
      // 缓存结果
      this.semanticCache.set(cacheKey, analysis)
      
      return analysis
      
    } catch (error) {
      console.error('AI语义分析失败:', error)
      return {
        score: 0.3,
        reasons: ['AI分析不可用，使用基础匹配'],
        keywords: [],
        semanticMatch: false,
        contextMatch: false,
        confidence: 0.3
      }
    }
  }
  
  /**
   * 综合分析结果
   */
  private combineAnalysis(
    keywordAnalysis: RelevanceAnalysis,
    semanticAnalysis: RelevanceAnalysis
  ): RelevanceAnalysis {
    // 综合评分：关键词40% + 语义60%
    const combinedScore = keywordAnalysis.score * 0.4 + semanticAnalysis.score * 0.6
    
    return {
      score: combinedScore,
      reasons: [...keywordAnalysis.reasons, ...semanticAnalysis.reasons],
      keywords: keywordAnalysis.keywords,
      semanticMatch: semanticAnalysis.semanticMatch,
      contextMatch: keywordAnalysis.contextMatch || semanticAnalysis.contextMatch,
      confidence: Math.max(keywordAnalysis.confidence, semanticAnalysis.confidence)
    }
  }
  
  /**
   * 批量相关性分析
   */
  async batchAnalyzeRelevance(
    query: string,
    results: SearchResult[],
    minRelevanceScore: number = 0.3
  ): Promise<Array<SearchResult & { relevanceAnalysis: RelevanceAnalysis }>> {
    console.log(`🎯 开始批量相关性分析: ${results.length} 条结果`)
    
    const analyzedResults = []
    
    // 分批处理，避免API限制
    const batchSize = 5
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (result) => {
        const analysis = await this.analyzeRelevance(query, result, true)
        return {
          ...result,
          relevanceAnalysis: analysis,
          relevanceScore: analysis.score // 更新相关性分数
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      analyzedResults.push(...batchResults)
      
      // 短暂延迟，避免API限制
      if (i + batchSize < results.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // 过滤低相关性结果
    const filteredResults = analyzedResults.filter(result => 
      result.relevanceAnalysis.score >= minRelevanceScore
    )
    
    // 按相关性排序
    const sortedResults = filteredResults.sort((a, b) => 
      b.relevanceAnalysis.score - a.relevanceAnalysis.score
    )
    
    console.log(`✅ 相关性分析完成: ${filteredResults.length}/${results.length} 条结果通过筛选`)
    console.log(`📊 平均相关性: ${(filteredResults.reduce((sum, r) => sum + r.relevanceAnalysis.score, 0) / filteredResults.length).toFixed(2)}`)
    
    return sortedResults
  }
  
  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    if (!text) return []
    
    // 中文分词 + 英文单词提取
    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,}/g) || []
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || []
    const numbers = text.match(/\d{4,}/g) || [] // 年份等数字
    
    const allWords = [...chineseWords, ...englishWords, ...numbers]
      .map(word => word.toLowerCase())
      .filter(word => word.length > 1)
    
    return Array.from(new Set(allWords))
  }
  
  /**
   * 查找匹配的关键词
   */
  private findMatches(queryKeywords: string[], contentKeywords: string[]): string[] {
    const matches: string[] = []
    
    for (const queryWord of queryKeywords) {
      for (const contentWord of contentKeywords) {
        // 精确匹配
        if (queryWord === contentWord) {
          matches.push(queryWord)
        }
        // 包含匹配
        else if (contentWord.includes(queryWord) || queryWord.includes(contentWord)) {
          matches.push(queryWord)
        }
      }
    }
    
    return Array.from(new Set(matches))
  }
  
  /**
   * 查找精确短语匹配
   */
  private findExactPhrases(query: string, content: string): string[] {
    const phrases: string[] = []
    const queryLower = query.toLowerCase()
    const contentLower = content.toLowerCase()
    
    // 查找2-4个字的短语
    const words = queryLower.split(/\s+/)
    for (let len = 2; len <= Math.min(4, words.length); len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ')
        if (phrase.length > 3 && contentLower.includes(phrase)) {
          phrases.push(phrase)
        }
      }
    }
    
    return phrases
  }
  
  /**
   * 解析语义分析结果
   */
  private parseSemanticAnalysis(analysisText: string): RelevanceAnalysis {
    try {
      // 尝试解析JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          score: Math.max(0, Math.min(1, parsed.relevanceScore || 0.3)),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ['AI语义分析'],
          keywords: [],
          semanticMatch: parsed.semanticMatch === true,
          contextMatch: parsed.contextMatch === true,
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
        }
      }
      
      // 文本解析
      return this.parseTextSemanticAnalysis(analysisText)
      
    } catch (error) {
      console.error('解析语义分析结果失败:', error)
      return {
        score: 0.3,
        reasons: ['解析失败，使用默认分数'],
        keywords: [],
        semanticMatch: false,
        contextMatch: false,
        confidence: 0.3
      }
    }
  }
  
  /**
   * 解析文本格式的语义分析
   */
  private parseTextSemanticAnalysis(text: string): RelevanceAnalysis {
    let score = 0.3
    const reasons: string[] = []
    let semanticMatch = false
    let contextMatch = false
    
    // 提取分数
    const scoreMatch = text.match(/(\d+\.?\d*)分|(\d+\.?\d*)\s*\/\s*10|相关性.*?(\d+\.?\d*)/i)
    if (scoreMatch) {
      const extractedScore = parseFloat(scoreMatch[1] || scoreMatch[2] || scoreMatch[3])
      if (extractedScore <= 10) {
        score = extractedScore / 10
      } else if (extractedScore <= 100) {
        score = extractedScore / 100
      }
    }
    
    // 分析相关性类型
    if (text.includes('语义相关') || text.includes('语义匹配')) {
      semanticMatch = true
      reasons.push('语义相关性匹配')
    }
    
    if (text.includes('上下文相关') || text.includes('背景相关')) {
      contextMatch = true
      reasons.push('上下文相关性匹配')
    }
    
    if (text.includes('主题相关') || text.includes('直接相关')) {
      reasons.push('主题直接相关')
    }
    
    if (text.includes('不相关') || text.includes('无关')) {
      score = Math.min(score, 0.2)
      reasons.push('内容不相关')
    }
    
    return {
      score: Math.max(0, Math.min(1, score)),
      reasons: reasons.length > 0 ? reasons : ['AI语义分析'],
      keywords: [],
      semanticMatch,
      contextMatch,
      confidence: score > 0.5 ? 0.7 : 0.4
    }
  }
  
  /**
   * 获取备用分析结果
   */
  private getFallbackAnalysis(query: string, result: SearchResult): RelevanceAnalysis {
    const basicScore = this.calculateBasicRelevance(query, result)
    
    return {
      score: basicScore,
      reasons: ['使用基础关键词匹配'],
      keywords: this.extractKeywords(query),
      semanticMatch: false,
      contextMatch: basicScore > 0.3,
      confidence: 0.5
    }
  }
  
  /**
   * 基础相关性计算
   */
  private calculateBasicRelevance(query: string, result: SearchResult): number {
    const queryLower = query.toLowerCase()
    const titleLower = result.title.toLowerCase()
    const contentLower = (result.content || '').toLowerCase()
    
    let score = 0
    
    // 标题包含查询
    if (titleLower.includes(queryLower)) {
      score += 0.6
    }
    
    // 内容包含查询
    if (contentLower.includes(queryLower)) {
      score += 0.3
    }
    
    // 关键词匹配
    const queryWords = queryLower.split(/\s+/)
    const matchCount = queryWords.filter(word => 
      titleLower.includes(word) || contentLower.includes(word)
    ).length
    
    score += (matchCount / queryWords.length) * 0.4
    
    return Math.min(score, 1)
  }
}

// 导出单例实例
export const relevanceMatcher = new IntelligentRelevanceMatcher()

// 便捷函数
export async function filterRelevantResults(
  query: string,
  results: SearchResult[],
  minScore: number = 0.4
): Promise<SearchResult[]> {
  const analyzed = await relevanceMatcher.batchAnalyzeRelevance(query, results, minScore)
  return analyzed.map(({ relevanceAnalysis, ...result }) => ({
    ...result,
    relevanceScore: relevanceAnalysis.score
  }))
}