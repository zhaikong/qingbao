// 报告质量评估服务
import { SearchResult } from './search-engine'

export interface QualityMetrics {
  score: number
  strengths: string[]
  improvements: string[]
  dataQuality: number
  structureQuality: number
  contentQuality: number
  detailedAnalysis: {
    dataSourceAnalysis: DataSourceAnalysis
    contentAnalysis: ContentAnalysis
    structureAnalysis: StructureAnalysis
  }
}

export interface DataSourceAnalysis {
  totalSources: number
  verifiedSources: number
  averageRelevance: number
  sourceTypes: { [key: string]: number }
  freshnessScore: number
  diversityScore: number
}

export interface ContentAnalysis {
  wordCount: number
  readabilityScore: number
  professionalTermsCount: number
  citationCount: number
  analysisDepth: 'basic' | 'detailed' | 'expert'
  keywordDensity: number
}

export interface StructureAnalysis {
  hasExecutiveSummary: boolean
  hasBackground: boolean
  hasAnalysis: boolean
  hasTrends: boolean
  hasRecommendations: boolean
  hasConclusion: boolean
  sectionCompleteness: number
  logicalFlow: number
}

export class QualityAssessmentService {
  
  /**
   * 综合评估报告质量
   */
  async assessReportQuality(
    content: string,
    dataSources: SearchResult[],
    topic: string,
    metadata?: any
  ): Promise<QualityMetrics> {
    console.log('📊 开始综合质量评估...')
    
    // 1. 数据源质量评估
    const dataSourceAnalysis = this.assessDataSourceQuality(dataSources)
    const dataQuality = this.calculateDataQualityScore(dataSourceAnalysis)
    
    // 2. 内容质量评估
    const contentAnalysis = this.assessContentQuality(content, topic)
    const contentQuality = this.calculateContentQualityScore(contentAnalysis)
    
    // 3. 结构质量评估
    const structureAnalysis = this.assessStructureQuality(content)
    const structureQuality = this.calculateStructureQualityScore(structureAnalysis)
    
    // 4. 计算综合评分
    const overallScore = this.calculateOverallScore(dataQuality, contentQuality, structureQuality)
    
    // 5. 生成优势和改进建议
    const { strengths, improvements } = this.generateFeedback(
      dataQuality, 
      contentQuality, 
      structureQuality, 
      dataSourceAnalysis,
      contentAnalysis,
      structureAnalysis
    )
    
    console.log(`✅ 质量评估完成，综合评分: ${overallScore}/100`)
    
    return {
      score: overallScore,
      strengths,
      improvements,
      dataQuality,
      structureQuality,
      contentQuality,
      detailedAnalysis: {
        dataSourceAnalysis,
        contentAnalysis,
        structureAnalysis
      }
    }
  }
  
  /**
   * 评估数据源质量
   */
  private assessDataSourceQuality(dataSources: SearchResult[]): DataSourceAnalysis {
    if (dataSources.length === 0) {
      return {
        totalSources: 0,
        verifiedSources: 0,
        averageRelevance: 0,
        sourceTypes: {},
        freshnessScore: 0,
        diversityScore: 0
      }
    }
    
    // 统计验证的数据源（假设所有数据源都是已验证的）
    const verifiedSources = dataSources.length
    
    // 计算平均相关性
    const averageRelevance = dataSources.reduce((sum, source) => {
      return sum + ((source as any).relevanceScore || 0.5)
    }, 0) / dataSources.length
    
    // 统计数据源类型
    const sourceTypes: { [key: string]: number } = {}
    dataSources.forEach(source => {
      const sourceType = this.categorizeSource(source.source)
      sourceTypes[sourceType] = (sourceTypes[sourceType] || 0) + 1
    })
    
    // 计算时效性评分
    const freshnessScore = this.calculateFreshnessScore(dataSources)
    
    // 计算多样性评分
    const uniqueSources = new Set(dataSources.map(source => source.source)).size
    const diversityScore = Math.min(uniqueSources / dataSources.length, 1.0)
    
    return {
      totalSources: dataSources.length,
      verifiedSources,
      averageRelevance,
      sourceTypes,
      freshnessScore,
      diversityScore
    }
  }
  
  /**
   * 评估内容质量
   */
  private assessContentQuality(content: string, topic: string): ContentAnalysis {
    // 计算字数（中文按字符数/2估算）
    const wordCount = Math.floor(content.length / 2)
    
    // 计算可读性评分
    const readabilityScore = this.calculateReadabilityScore(content)
    
    // 统计专业术语
    const professionalTermsCount = this.countProfessionalTerms(content)
    
    // 统计引用数量
    const citationCount = this.countCitations(content)
    
    // 评估分析深度
    const analysisDepth = this.assessAnalysisDepth(content)
    
    // 计算关键词密度
    const keywordDensity = this.calculateKeywordDensity(content, topic)
    
    return {
      wordCount,
      readabilityScore,
      professionalTermsCount,
      citationCount,
      analysisDepth,
      keywordDensity
    }
  }
  
  /**
   * 评估结构质量
   */
  private assessStructureQuality(content: string): StructureAnalysis {
    const sections = {
      hasExecutiveSummary: this.hasSection(content, ['执行摘要', '概要', 'Executive Summary']),
      hasBackground: this.hasSection(content, ['背景', '现状', 'Background']),
      hasAnalysis: this.hasSection(content, ['分析', '深度分析', 'Analysis']),
      hasTrends: this.hasSection(content, ['趋势', '预测', 'Trends', 'Prediction']),
      hasRecommendations: this.hasSection(content, ['建议', '对策', 'Recommendations']),
      hasConclusion: this.hasSection(content, ['结论', '总结', 'Conclusion'])
    }
    
    // 计算章节完整性
    const completeSections = Object.values(sections).filter(Boolean).length
    const sectionCompleteness = completeSections / Object.keys(sections).length
    
    // 评估逻辑流程
    const logicalFlow = this.assessLogicalFlow(content)
    
    return {
      ...sections,
      sectionCompleteness,
      logicalFlow
    }
  }
  
  /**
   * 计算数据质量评分
   */
  private calculateDataQualityScore(analysis: DataSourceAnalysis): number {
    if (analysis.totalSources === 0) return 0
    
    let score = 0
    
    // 数据源数量评分 (25%)
    const sourceCountScore = Math.min(analysis.totalSources / 10, 1.0)
    score += sourceCountScore * 0.25
    
    // 验证比例评分 (25%)
    const verificationScore = analysis.verifiedSources / analysis.totalSources
    score += verificationScore * 0.25
    
    // 相关性评分 (20%)
    score += analysis.averageRelevance * 0.20
    
    // 时效性评分 (15%)
    score += analysis.freshnessScore * 0.15
    
    // 多样性评分 (15%)
    score += analysis.diversityScore * 0.15
    
    return Math.round(score * 100)
  }
  
  /**
   * 计算内容质量评分
   */
  private calculateContentQualityScore(analysis: ContentAnalysis): number {
    let score = 0
    
    // 内容长度评分 (20%)
    const lengthScore = Math.min(analysis.wordCount / 3000, 1.0)
    score += lengthScore * 0.20
    
    // 可读性评分 (20%)
    score += analysis.readabilityScore * 0.20
    
    // 专业性评分 (20%)
    const professionalScore = Math.min(analysis.professionalTermsCount / 20, 1.0)
    score += professionalScore * 0.20
    
    // 引用质量评分 (15%)
    const citationScore = Math.min(analysis.citationCount / 10, 1.0)
    score += citationScore * 0.15
    
    // 分析深度评分 (15%)
    const depthScore = analysis.analysisDepth === 'expert' ? 1.0 : 
                      analysis.analysisDepth === 'detailed' ? 0.8 : 0.6
    score += depthScore * 0.15
    
    // 关键词密度评分 (10%)
    score += Math.min(analysis.keywordDensity * 2, 1.0) * 0.10
    
    return Math.round(score * 100)
  }
  
  /**
   * 计算结构质量评分
   */
  private calculateStructureQualityScore(analysis: StructureAnalysis): number {
    let score = 0
    
    // 章节完整性评分 (60%)
    score += analysis.sectionCompleteness * 0.60
    
    // 逻辑流程评分 (40%)
    score += analysis.logicalFlow * 0.40
    
    return Math.round(score * 100)
  }
  
  /**
   * 计算综合评分
   */
  private calculateOverallScore(
    dataQuality: number, 
    contentQuality: number, 
    structureQuality: number
  ): number {
    // 权重分配：数据质量30%，内容质量45%，结构质量25%
    const overallScore = (dataQuality * 0.30) + (contentQuality * 0.45) + (structureQuality * 0.25)
    return Math.round(overallScore)
  }
  
  /**
   * 生成反馈建议
   */
  private generateFeedback(
    dataQuality: number,
    contentQuality: number,
    structureQuality: number,
    dataAnalysis: DataSourceAnalysis,
    contentAnalysis: ContentAnalysis,
    structureAnalysis: StructureAnalysis
  ): { strengths: string[], improvements: string[] } {
    const strengths: string[] = []
    const improvements: string[] = []
    
    // 数据质量反馈
    if (dataQuality >= 85) {
      strengths.push('数据源质量优秀，信息可靠性高')
    } else if (dataQuality >= 70) {
      strengths.push('数据源质量良好，覆盖面较广')
    } else {
      improvements.push('建议配置更多高质量数据源API')
    }
    
    if (dataAnalysis.verifiedSources / dataAnalysis.totalSources >= 0.7) {
      strengths.push('数据源验证比例高，可信度强')
    } else {
      improvements.push('建议增加已验证数据源的比例')
    }
    
    // 内容质量反馈
    if (contentQuality >= 85) {
      strengths.push('内容深度充分，分析专业')
    } else if (contentQuality >= 70) {
      strengths.push('内容质量良好，分析较为深入')
    } else {
      improvements.push('内容深度和专业性有待提升')
    }
    
    if (contentAnalysis.wordCount >= 3000) {
      strengths.push('报告内容详实，信息量充足')
    } else if (contentAnalysis.wordCount < 1500) {
      improvements.push('建议增加报告内容的详细程度')
    }
    
    // 结构质量反馈
    if (structureQuality >= 85) {
      strengths.push('报告结构完整，逻辑清晰')
    } else if (structureQuality >= 70) {
      strengths.push('报告结构基本完整')
    } else {
      improvements.push('报告结构需要进一步完善')
    }
    
    if (structureAnalysis.sectionCompleteness >= 0.8) {
      strengths.push('章节设置完整，覆盖全面')
    } else {
      improvements.push('建议补充缺失的报告章节')
    }
    
    // 综合评价
    const overallScore = this.calculateOverallScore(dataQuality, contentQuality, structureQuality)
    if (overallScore >= 90) {
      strengths.push('报告整体质量优秀，达到专业标准')
    } else if (overallScore >= 80) {
      strengths.push('报告质量良好，符合预期要求')
    } else if (overallScore >= 70) {
      improvements.push('报告质量中等，建议进一步优化')
    } else {
      improvements.push('报告质量需要显著改进')
    }
    
    return { strengths, improvements }
  }
  
  // 辅助方法
  private categorizeSource(source: string): string {
    if (source.includes('学术') || source.includes('arXiv') || source.includes('IEEE')) return '学术资源'
    if (source.includes('新闻') || source.includes('News')) return '新闻媒体'
    if (source.includes('政府') || source.includes('官方')) return '官方资源'
    if (source.includes('GitHub') || source.includes('技术')) return '技术资源'
    if (source.includes('智谱') || source.includes('AI')) return 'AI搜索'
    return '其他资源'
  }
  
  private calculateFreshnessScore(dataSources: SearchResult[]): number {
    if (dataSources.length === 0) return 0
    
    const now = new Date()
    let totalScore = 0
    let validDates = 0
    
    dataSources.forEach(source => {
      if (source.publishDate) {
        try {
          const publishDate = new Date(source.publishDate)
          const daysDiff = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)
          
          let score = 0
          if (daysDiff <= 7) score = 1.0
          else if (daysDiff <= 30) score = 0.8
          else if (daysDiff <= 90) score = 0.6
          else if (daysDiff <= 365) score = 0.4
          else score = 0.2
          
          totalScore += score
          validDates++
        } catch {
          // 忽略无效日期
        }
      }
    })
    
    return validDates > 0 ? totalScore / validDates : 0.5
  }
  
  private calculateReadabilityScore(content: string): number {
    // 简化的可读性评分算法
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/).filter(w => w.length > 0)
    
    if (sentences.length === 0 || words.length === 0) return 0
    
    const avgWordsPerSentence = words.length / sentences.length
    const avgCharsPerWord = content.length / words.length
    
    // 理想的句子长度和词长度
    const idealSentenceLength = 15
    const idealWordLength = 4
    
    const sentenceLengthScore = 1 - Math.abs(avgWordsPerSentence - idealSentenceLength) / idealSentenceLength
    const wordLengthScore = 1 - Math.abs(avgCharsPerWord - idealWordLength) / idealWordLength
    
    return Math.max(0, (sentenceLengthScore + wordLengthScore) / 2)
  }
  
  private countProfessionalTerms(content: string): number {
    const professionalTerms = [
      '分析', '评估', '预测', '趋势', '策略', '机制', '框架', '模式', '体系',
      '指标', '数据', '统计', '调研', '研究', '发展', '创新', '技术', '政策',
      '市场', '产业', '经济', '社会', '环境', '风险', '机遇', '挑战', '影响'
    ]
    
    let count = 0
    professionalTerms.forEach(term => {
      const matches = content.match(new RegExp(term, 'g'))
      if (matches) count += matches.length
    })
    
    return count
  }
  
  private countCitations(content: string): number {
    // 统计引用标记，如 [数据源1]、[来源：xxx]等
    const citationPatterns = [
      /\[数据源\d+\]/g,
      /\[来源[：:][^\]]+\]/g,
      /\[引用[：:][^\]]+\]/g,
      /\[[^\]]*来源[^\]]*\]/g
    ]
    
    let count = 0
    citationPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) count += matches.length
    })
    
    return count
  }
  
  private assessAnalysisDepth(content: string): 'basic' | 'detailed' | 'expert' {
    const expertKeywords = ['战略', '深层', '系统性', '前瞻性', '洞察', '预见']
    const detailedKeywords = ['详细', '深入', '全面', '综合', '多维度', '深度']
    
    let expertCount = 0
    let detailedCount = 0
    
    expertKeywords.forEach(keyword => {
      if (content.includes(keyword)) expertCount++
    })
    
    detailedKeywords.forEach(keyword => {
      if (content.includes(keyword)) detailedCount++
    })
    
    if (expertCount >= 3) return 'expert'
    if (detailedCount >= 3 || expertCount >= 1) return 'detailed'
    return 'basic'
  }
  
  private calculateKeywordDensity(content: string, topic: string): number {
    const topicWords = topic.toLowerCase().split(/\s+/).filter(word => word.length > 1)
    const contentLower = content.toLowerCase()
    
    let matches = 0
    topicWords.forEach(word => {
      const regex = new RegExp(word, 'g')
      const wordMatches = contentLower.match(regex)
      if (wordMatches) matches += wordMatches.length
    })
    
    const totalWords = content.split(/\s+/).length
    return totalWords > 0 ? matches / totalWords : 0
  }
  
  private hasSection(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword))
  }
  
  private assessLogicalFlow(content: string): number {
    // 简化的逻辑流程评估
    const transitionWords = ['首先', '其次', '然后', '接下来', '最后', '综上', '因此', '所以']
    let transitionCount = 0
    
    transitionWords.forEach(word => {
      if (content.includes(word)) transitionCount++
    })
    
    // 检查段落结构
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0)
    const hasGoodStructure = paragraphs.length >= 5 && paragraphs.length <= 20
    
    const transitionScore = Math.min(transitionCount / 5, 1.0)
    const structureScore = hasGoodStructure ? 1.0 : 0.5
    
    return (transitionScore + structureScore) / 2
  }
}

// 导出单例实例
export const qualityAssessmentService = new QualityAssessmentService()

// 便捷函数
export async function assessReportQuality(
  content: string,
  dataSources: SearchResult[],
  topic: string,
  metadata?: any
): Promise<QualityMetrics> {
  return qualityAssessmentService.assessReportQuality(content, dataSources, topic, metadata)
}