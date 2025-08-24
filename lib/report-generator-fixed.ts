// 报告生成器 - 修复版本
// 解决generateComprehensiveReport卡死问题

import { SearchResult } from './types'
import { geminiPrimarySchedulerFixed, TaskType } from './gemini-primary-scheduler-fixed'

export interface ReportOptions {
  template: 'comprehensive' | 'summary' | 'detailed'
  analysisDepth: 'basic' | 'detailed' | 'deep'
  maxDataSources: number
  language: 'zh' | 'en'
  includeCharts: boolean
  timeout?: number // 添加超时选项
}

export interface ReportResult {
  content: string
  metadata: {
    topic: string
    generationTime: string
    dataSourceCount: number
    template: string
    language: string
    wordCount: number
    qualityScore: number
    sources: string[]
  }
  qualityAssessment: {
    score: number
    strengths: string[]
    improvements: string[]
    dataQuality: number
    structureQuality: number
    contentQuality: number
  }
}

export class ReportGeneratorFixed {
  private defaultTimeout = 60000 // 60秒默认超时

  async generateComprehensiveReport(
    topic: string, 
    options: ReportOptions
  ): Promise<ReportResult> {
    console.log(`🚀 开始生成综合报告: ${topic}`)
    
    const timeout = options.timeout || this.defaultTimeout
    
    try {
      // 使用Promise.race实现超时控制
      const reportPromise = this.performReportGeneration(topic, options)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`报告生成超时: ${timeout}ms`))
        }, timeout)
      })

      const result = await Promise.race([reportPromise, timeoutPromise])
      console.log(`✅ 报告生成完成，质量评分: ${result.qualityAssessment.score}`)
      return result

    } catch (error) {
      console.error('❌ 报告生成失败:', error)
      
      // 返回备用报告而不是抛出错误
      return this.generateFallbackReport(topic, options, error)
    }
  }

  private async performReportGeneration(
    topic: string, 
    options: ReportOptions
  ): Promise<ReportResult> {
    
    console.log(`📝 生成${options.template}类型报告，深度: ${options.analysisDepth}`)

    // 构建报告生成提示词
    const reportPrompt = this.buildReportPrompt(topic, options)
    
    // 使用Gemini生成报告内容
    const reportContent = await geminiPrimarySchedulerFixed.executeTask(
      TaskType.CONTENT_GENERATION,
      reportPrompt,
      {
        includeWebSearch: true,
        temperature: 0.4,
        timeout: 45000, // 45秒超时
        systemPrompt: this.getSystemPrompt(options)
      }
    )

    // 生成报告元数据
    const metadata = {
      topic,
      generationTime: new Date().toISOString(),
      dataSourceCount: options.maxDataSources,
      template: options.template,
      language: options.language,
      wordCount: Math.floor(reportContent.length / (options.language === 'zh' ? 1 : 5)),
      qualityScore: this.calculateQualityScore(reportContent, options),
      sources: this.extractSources(reportContent)
    }

    // 生成质量评估
    const qualityAssessment = await this.generateQualityAssessment(reportContent, options)

    return {
      content: reportContent,
      metadata,
      qualityAssessment
    }
  }

  private buildReportPrompt(topic: string, options: ReportOptions): string {
    const basePrompt = `请基于主题"${topic}"生成一份${options.template === 'comprehensive' ? '综合' : '简要'}情报分析报告。`
    
    let detailRequirements = ''
    
    switch (options.analysisDepth) {
      case 'basic':
        detailRequirements = '提供基础分析，包含核心事实和简要结论。'
        break
      case 'detailed':
        detailRequirements = '提供详细分析，包含背景信息、趋势分析、风险评估和建议。'
        break
      case 'deep':
        detailRequirements = '提供深度分析，包含多维度分析、预测模型、战略建议和行动方案。'
        break
    }

    const structureRequirements = `
报告结构要求：
1. 执行摘要 (200-300字)
2. 背景分析 (300-500字)
3. 核心发现 (400-600字)
4. 趋势分析 (300-400字)
5. 风险评估 (200-300字)
6. 结论建议 (200-300字)

请使用网络搜索获取最新信息，确保报告内容的时效性和准确性。
`

    return `${basePrompt}\n\n${detailRequirements}\n\n${structureRequirements}`
  }

  private getSystemPrompt(options: ReportOptions): string {
    return `你是一个专业的情报分析师，具备以下核心能力：
- 多源信息整合和交叉验证
- 深度分析和趋势预测
- 风险评估和战略建议
- 结构化报告撰写
- 网络搜索和实时信息获取

请生成高质量的${options.language === 'zh' ? '中文' : '英文'}情报分析报告，确保内容准确、逻辑清晰、结构完整。`
  }

  private calculateQualityScore(content: string, options: ReportOptions): number {
    let score = 70 // 基础分数

    // 内容长度评分
    const wordCount = content.length / (options.language === 'zh' ? 1 : 5)
    if (wordCount > 1500) score += 10
    else if (wordCount > 1000) score += 5

    // 结构完整性评分
    const hasExecutiveSummary = content.includes('执行摘要') || content.includes('摘要')
    const hasBackground = content.includes('背景') || content.includes('分析')
    const hasFindings = content.includes('发现') || content.includes('结果')
    const hasConclusion = content.includes('结论') || content.includes('建议')

    if (hasExecutiveSummary) score += 5
    if (hasBackground) score += 5
    if (hasFindings) score += 5
    if (hasConclusion) score += 5

    return Math.min(100, score)
  }

  private extractSources(content: string): string[] {
    // 简单的来源提取逻辑
    const sources = ['Gemini智能分析', '网络搜索', '实时数据']
    
    if (content.includes('新闻') || content.includes('媒体')) {
      sources.push('新闻媒体')
    }
    if (content.includes('官方') || content.includes('政府')) {
      sources.push('官方渠道')
    }
    if (content.includes('研究') || content.includes('报告')) {
      sources.push('研究报告')
    }

    return sources.slice(0, 5) // 最多返回5个来源
  }

  private async generateQualityAssessment(
    content: string, 
    options: ReportOptions
  ): Promise<ReportResult['qualityAssessment']> {
    try {
      const assessmentPrompt = `请评估以下情报报告的质量：

报告内容长度: ${content.length}字符
报告类型: ${options.template}
分析深度: ${options.analysisDepth}

请从以下维度评分(0-100)：
1. 数据质量 - 信息的准确性和可靠性
2. 结构质量 - 报告的组织结构和逻辑性
3. 内容质量 - 分析的深度和洞察力

同时提供：
- 报告的主要优势(3-5点)
- 可改进的方面(2-3点)
- 总体质量评分(0-100)

请以JSON格式返回评估结果。`

      const assessmentResult = await geminiPrimarySchedulerFixed.executeTask(
        TaskType.REASONING,
        assessmentPrompt,
        {
          temperature: 0.2,
          timeout: 20000 // 20秒超时
        }
      )

      // 尝试解析JSON结果
      try {
        const parsed = JSON.parse(assessmentResult)
        return {
          score: parsed.totalScore || 75,
          strengths: parsed.strengths || ['使用AI智能分析', '结构化报告', '实时信息整合'],
          improvements: parsed.improvements || ['可增加更多数据源', '深化分析深度'],
          dataQuality: parsed.dataQuality || 80,
          structureQuality: parsed.structureQuality || 75,
          contentQuality: parsed.contentQuality || 70
        }
      } catch (parseError) {
        console.warn('质量评估结果解析失败，使用默认评估')
        return this.getDefaultQualityAssessment()
      }

    } catch (error) {
      console.error('质量评估失败:', error)
      return this.getDefaultQualityAssessment()
    }
  }

  private getDefaultQualityAssessment(): ReportResult['qualityAssessment'] {
    return {
      score: 75,
      strengths: ['使用AI智能分析', '结构化报告生成', '实时信息整合'],
      improvements: ['可增加更多数据源验证', '深化特定领域分析'],
      dataQuality: 80,
      structureQuality: 75,
      contentQuality: 70
    }
  }

  private generateFallbackReport(
    topic: string, 
    options: ReportOptions, 
    error: any
  ): ReportResult {
    const errorMsg = error instanceof Error ? error.message : '未知错误'
    
    const fallbackContent = `# 情报分析报告 - ${topic}

## 执行摘要
由于技术原因，本报告采用备用生成方案。我们正在分析主题"${topic}"的相关情报信息。

## 系统状态
- 报告生成时间: ${new Date().toLocaleString('zh-CN')}
- 生成方式: 备用方案
- 错误信息: ${errorMsg}

## 建议措施
1. 检查网络连接状态
2. 验证API密钥配置
3. 重试报告生成
4. 联系技术支持

## 结论
系统正在恢复中，请稍后重试或联系技术支持获取帮助。`

    return {
      content: fallbackContent,
      metadata: {
        topic,
        generationTime: new Date().toISOString(),
        dataSourceCount: 0,
        template: options.template,
        language: options.language,
        wordCount: Math.floor(fallbackContent.length / (options.language === 'zh' ? 1 : 5)),
        qualityScore: 50,
        sources: ['备用方案']
      },
      qualityAssessment: {
        score: 50,
        strengths: ['快速响应', '错误处理'],
        improvements: ['需要修复主要生成器', '增加数据源'],
        dataQuality: 40,
        structureQuality: 60,
        contentQuality: 45
      }
    }
  }

  // 简单报告生成（快速版本）
  async generateSimpleReport(topic: string): Promise<string> {
    try {
      const simplePrompt = `请为主题"${topic}"生成一份简要的情报分析报告，包含：
1. 核心要点 (3-5点)
2. 主要趋势
3. 关键建议

请保持简洁明了，总长度控制在500字以内。`

      const result = await geminiPrimarySchedulerFixed.executeTask(
        TaskType.CONTENT_GENERATION,
        simplePrompt,
        {
          temperature: 0.5,
          timeout: 15000 // 15秒超时
        }
      )

      return result

    } catch (error) {
      console.error('简单报告生成失败:', error)
      return `# 简要分析 - ${topic}\n\n由于技术原因，无法生成详细报告。建议：\n1. 检查系统状态\n2. 重试生成\n3. 联系技术支持`
    }
  }
}

// 导出修复版本的单例实例
export const reportGeneratorFixed = new ReportGeneratorFixed()