/**
 * 智能报告生成器 - 集成OSINT解决方案和LLM分析
 * 
 * 核心功能：
 * 1. 集成OSINT专业工具进行数据采集
 * 2. 多LLM模型智能分析和报告生成
 * 3. 深度语义理解和关联分析
 * 4. 专业情报报告结构化输出
 * 5. 实时质量评估和优化
 */

import { llmManager } from './llm/manager'
import { osintSolutionsManager } from './osint-solutions-manager'
import { reasoningEngine as intelligentReasoningEngine } from './intelligent-reasoning-engine'
import { semanticAnalyzer as deepSemanticAnalyzer } from './deep-semantic-analyzer'
import { performanceMonitor } from './performance-monitor'

export interface IntelligentReportOptions {
  // 基础配置
  template: 'comprehensive' | 'brief' | 'technical' | 'policy' | 'market' | 'executive' | 'osint'
  language: 'zh' | 'en'
  targetAudience: 'general' | 'professional' | 'academic' | 'executive' | 'analyst'
  
  // 分析配置
  analysisDepth: 'basic' | 'detailed' | 'expert' | 'strategic'
  osintIntegration: boolean // 是否启用OSINT专业工具
  enableSemanticAnalysis: boolean // 是否启用深度语义分析
  enableReasoning: boolean // 是否启用智能推理
  
  // 数据源配置
  dataSources: {
    osintTools: string[] // 使用的OSINT工具列表
    maxSources: number
    timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year'
    credibilityThreshold: number // 可信度阈值 0-1
  }
  
  // LLM配置
  llmConfig: {
    provider: 'zhipu' | 'openai' | 'ollama'
    model: string
    temperature: number
    maxTokens: number
    enableChainOfThought: boolean // 是否启用思维链
  }
  
  // 输出配置
  includeVisualizations: boolean
  includeSourceCitations: boolean
  includeConfidenceScores: boolean
  enableRealTimeUpdates: boolean
}

export interface IntelligentReportMetadata {
  id: string
  topic: string
  generatedAt: string
  processingTime: number
  template: string
  language: string
  targetAudience: string
  
  // 数据源统计
  dataSources: {
    totalSources: number
    osintSources: number
    webSources: number
    validatedSources: number
    averageCredibility: number
  }
  
  // 分析统计
  analysis: {
    semanticDepth: number
    reasoningComplexity: number
    confidenceLevel: number
    keyTopics: string[]
    entities: string[]
    relationships: string[]
  }
  
  // 质量指标
  quality: {
    overallScore: number
    dataQuality: number
    analysisQuality: number
    structureQuality: number
    actionability: number
  }
}

export interface IntelligentReportContent {
  // 主要内容
  executiveSummary: string
  keyFindings: string[]
  detailedAnalysis: string
  
  // 专业分析章节
  backgroundAnalysis: string
  threatAssessment?: string
  opportunityAnalysis?: string
  trendPrediction: string
  riskAssessment: string
  recommendations: string[]
  
  // 技术分析（如果适用）
  technicalAnalysis?: string
  securityAssessment?: string
  
  // 监控指标
  monitoringIndicators: {
    keyMetrics: string[]
    earlyWarningSignals: string[]
    monitoringFramework: string
  }
}

export interface IntelligentReport {
  metadata: IntelligentReportMetadata
  content: IntelligentReportContent
  rawData: any[]
  processingLog: string[]
  qualityAssessment: {
    strengths: string[]
    limitations: string[]
    improvementSuggestions: string[]
  }
}

export class IntelligentReportGenerator {
  private readonly defaultOptions: Partial<IntelligentReportOptions> = {
    template: 'comprehensive',
    language: 'zh',
    targetAudience: 'professional',
    analysisDepth: 'expert',
    osintIntegration: true,
    enableSemanticAnalysis: true,
    enableReasoning: true,
    dataSources: {
      osintTools: ['shodan', 'otx', 'virustotal'], // 默认OSINT工具
      maxSources: 15,
      timeRange: 'month',
      credibilityThreshold: 0.6
    },
    llmConfig: {
      provider: 'zhipu',
      model: 'glm-4',
      temperature: 0.3,
      maxTokens: 4000,
      enableChainOfThought: true
    },
    includeVisualizations: false,
    includeSourceCitations: true,
    includeConfidenceScores: true,
    enableRealTimeUpdates: false
  }

  /**
   * 生成智能情报报告
   */
  async generateIntelligentReport(
    topic: string,
    options: Partial<IntelligentReportOptions> = {}
  ): Promise<IntelligentReport> {
    
    const config: IntelligentReportOptions = { ...this.defaultOptions, ...options }
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🚀 开始生成智能情报报告:', topic)
    console.log('📋 报告配置:', config)
    
    const startTime = Date.now()
    performanceMonitor.start(`intelligent-report-${reportId}`)
    
    try {
      // 第一阶段：智能数据采集
      console.log('📡 第一阶段：智能数据采集')
      const collectedData = await this.intelligentDataCollection(topic, config)
      
      // 第二阶段：深度语义分析
      console.log('🧠 第二阶段：深度语义分析')
      const semanticAnalysis = await this.performSemanticAnalysis(topic, collectedData, config)
      
      // 第三阶段：智能推理分析
      console.log('🔍 第三阶段：智能推理分析')
      const reasoningResults = await this.performReasoningAnalysis(topic, semanticAnalysis, config)
      
      // 第四阶段：LLM智能报告生成
      console.log('🤖 第四阶段：LLM智能报告生成')
      const reportContent = await this.generateLLMReport(topic, collectedData, semanticAnalysis, reasoningResults, config)
      
      // 第五阶段：报告质量评估和优化
      console.log('🔬 第五阶段：报告质量评估和优化')
      const qualityAssessment = await this.assessAndOptimizeReport(reportContent, collectedData, config)
      
      // 第六阶段：结构化输出
      console.log('📝 第六阶段：结构化输出')
      const finalReport = await this.structureFinalReport(
        reportId,
        topic,
        reportContent,
        collectedData,
        semanticAnalysis,
        reasoningResults,
        qualityAssessment,
        config,
        startTime
      )
      
      performanceMonitor.end(`intelligent-report-${reportId}`)
      
      console.log('🎉 智能情报报告生成完成!')
      console.log(`📈 总体质量评分: ${finalReport.metadata.quality.overallScore}/100`)
      console.log(`⏱️ 总处理时间: ${((Date.now() - startTime) / 1000).toFixed(2)}秒`)
      
      return finalReport
      
    } catch (error: any) {
      console.error('❌ 智能报告生成失败:', error)
      performanceMonitor.end(`intelligent-report-${reportId}`)
      throw new Error(`智能报告生成失败: ${error.message}`)
    }
  }

  /**
   * 智能数据采集 - 使用三层采集器
   */
  private async intelligentDataCollection(
    topic: string,
    config: IntelligentReportOptions
  ): Promise<any[]> {
    
    console.log(`🔍 开始智能数据采集: "${topic}"`)
    const collectedData: any[] = []

    try {
      // 使用增强型并行采集器
      const { parallelCollector } = await import('./enhanced-three-layer-collector')
      
      const results = await parallelCollector.startParallelCollection(topic, {
        categories: ['新闻', '网络安全', '地缘政治', '威胁情报', '冲突监测'],
        methods: ['api', 'browser', 'mcp'], // 3种方式并行
        timeout: 30000
      })

      // 转换采集结果
      Array.from(results.values()).forEach(result => {
        if (result.success && result.data.length > 0) {
          collectedData.push({
            type: 'enhanced_collection',
            source: result.source,
            method: result.method,
            data: result.data,
            metadata: result.metadata,
            timestamp: result.timestamp
          })
        }
      })

      console.log(`✅ 数据采集完成，共收集 ${collectedData.length} 个数据源`)
      return collectedData

    } catch (error) {
      console.error('❌ 数据采集失败:', error)
      
      // 降级到基础采集
      return [{
        type: 'fallback',
        source: 'basic_collection',
        data: [{
          title: `${topic} - 基础数据`,
          content: `关于${topic}的基础信息收集`,
          timestamp: new Date().toISOString()
        }],
        timestamp: new Date().toISOString()
      }]
    }
  }

  /**
   * 生成OSINT查询策略
   */
  private generateOSINTQueries(topic: string, config: IntelligentReportOptions): Array<{
    toolId: string
    query: string
    options: any
  }> {
    
    const queries: Array<{ toolId: string; query: string; options: any }> = []
    const tools = config.dataSources.osintTools

    // 根据话题类型生成不同的查询策略
    const topicLower = topic.toLowerCase()
    
    // 威胁情报相关查询
    if (topicLower.includes('威胁') || topicLower.includes('安全') || topicLower.includes('攻击')) {
      tools.forEach(tool => {
        if (['otx', 'virustotal', 'abuseipdb'].includes(tool)) {
          queries.push({
            toolId: tool,
            query: topic,
            options: { limit: 10, timeframe: config.dataSources.timeRange }
          })
        }
      })
    }

    // 网络基础设施相关查询
    if (topicLower.includes('网络') || topicLower.includes('服务器') || topicLower.includes('域名')) {
      tools.forEach(tool => {
        if (['shodan', 'censys', 'securitytrails'].includes(tool)) {
          queries.push({
            toolId: tool,
            query: topic,
            options: { limit: 15, timeframe: config.dataSources.timeRange }
          })
        }
      })
    }

    // 通用查询策略
    tools.forEach(tool => {
      if (!queries.find(q => q.toolId === tool)) {
        queries.push({
          toolId: tool,
          query: topic,
          options: { limit: 8, timeframe: config.dataSources.timeRange }
        })
      }
    })

    return queries
  }

  /**
   * 深度语义分析
   */
  private async performSemanticAnalysis(
    topic: string,
    data: any[],
    config: IntelligentReportOptions
  ): Promise<any> {
    
    if (!config.enableSemanticAnalysis) {
      return { topics: [], entities: [], sentiment: 'neutral' }
    }

    console.log('🧠 开始深度语义分析...')

    try {
      // 构建分析内容
      const contentForAnalysis = data.map(item => {
        if (item.type === 'osint' && item.data) {
          return JSON.stringify(item.data).substring(0, 1000)
        }
        return ''
      }).filter(Boolean).join('\n\n')

      if (!contentForAnalysis) {
        console.log('⚠️ 没有足够的内容进行语义分析')
        return { topics: [], entities: [], sentiment: 'neutral' }
      }

      // 使用深度语义分析器
      const semanticResult = await deepSemanticAnalyzer.analyzeContent(contentForAnalysis, {
        topic,
        language: config.language,
        includeEntityRecognition: true,
        includeTopicModeling: true,
        includeSentimentAnalysis: true
      })

      console.log(`✅ 语义分析完成，识别出 ${semanticResult.topics.length} 个主题，${semanticResult.entities.length} 个实体`)
      return semanticResult

    } catch (error) {
      console.error('语义分析失败:', error)
      return { topics: [], entities: [], sentiment: 'neutral' }
    }
  }

  /**
   * 智能推理分析 - 简化版本
   */
  private async performReasoningAnalysis(
    topic: string,
    semanticAnalysis: any,
    config: IntelligentReportOptions
  ): Promise<any> {
    
    if (!config.enableReasoning) {
      return { insights: [], patterns: [], predictions: [] }
    }

    console.log('🔍 开始智能推理分析...')

    try {
      // 简化版推理分析
      const insights = [
        `基于${topic}的语义分析，发现${semanticAnalysis.topics?.length || 0}个主要话题`,
        `情感倾向为${semanticAnalysis.sentiment}，置信度${semanticAnalysis.confidence}`,
        `识别出${semanticAnalysis.entities?.people?.length || 0}个人物实体`
      ]

      const patterns = [
        `话题模式：${semanticAnalysis.themes?.join(', ') || '无明显模式'}`,
        `实体关联：${semanticAnalysis.relationships?.length || 0}个关系`
      ]

      const predictions = [
        '基于当前数据趋势，可能的发展方向需要持续监测',
        '建议关注相关实体的后续动态'
      ]

      console.log(`✅ 推理分析完成，生成 ${insights.length} 个洞察`)
      
      return {
        insights,
        patterns,
        predictions,
        confidence: semanticAnalysis.confidence || 0.5,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ 推理分析失败:', error)
      return { insights: [], patterns: [], predictions: [] }
    }
  }

  /**
   * LLM智能报告生成
   */
  private async generateLLMReport(
    topic: string,
    collectedData: any[],
    semanticAnalysis: any,
    reasoningResults: any,
    config: IntelligentReportOptions
  ): Promise<IntelligentReportContent> {
    
    console.log('🤖 开始LLM智能报告生成...')

    try {
      // 构建系统提示词
      const systemPrompt = this.buildAdvancedSystemPrompt(config)

      // 构建用户提示词
      const userPrompt = this.buildComprehensiveUserPrompt(
        topic,
        collectedData,
        semanticAnalysis,
        reasoningResults,
        config
      )

      // 调用LLM生成报告
      const llmResponse = await llmManager.generateResponse(userPrompt, {
        provider: config.llmConfig.provider,
        model: config.llmConfig.model,
        temperature: config.llmConfig.temperature,
        maxTokens: config.llmConfig.maxTokens
      })

      // 解析和结构化LLM响应
      const reportContent = this.parseAndStructureReportContent(llmResponse.content, config)

      console.log('✅ LLM报告生成完成')
      return reportContent

    } catch (error) {
      console.error('LLM报告生成失败:', error)
      throw error
    }
  }

  /**
   * 构建高级系统提示词
   */
  private buildAdvancedSystemPrompt(config: IntelligentReportOptions): string {
    
    const depthMapping = {
      'basic': '基础分析，关注核心事实和主要趋势',
      'detailed': '详细分析，包含多角度思考和深度解读',
      'expert': '专家级分析，提供专业洞察和前瞻性判断',
      'strategic': '战略级分析，提供决策支持和长期规划'
    }

    const audienceMapping = {
      'general': '面向一般公众，使用通俗易懂的语言',
      'professional': '面向专业人士，使用专业术语和深度分析',
      'academic': '面向学术研究，注重严谨性和引用规范',
      'executive': '面向高层决策者，突出要点和行动建议',
      'analyst': '面向情报分析师，注重技术细节和威胁评估'
    }

    return `你是一位顶级的智能情报分析专家，具备以下专业背景：

**核心专业能力：**
- 开源情报(OSINT)分析专家
- 网络安全和威胁情报专家
- 地缘政治和国际关系分析师
- 技术趋势和创新研究员
- 数据科学和机器学习专家

**分析要求：**
- 分析深度：${depthMapping[config.analysisDepth]}
- 目标受众：${audienceMapping[config.targetAudience]}
- 报告模板：${config.template}
- 分析语言：${config.language === 'zh' ? '中文' : '英文'}

**专业框架应用：**
1. 情报分析生命周期：收集、处理、分析、分发
2. 威胁情报框架：MITRE ATT&CK, Diamond Model
3. 战略分析框架：SWOT, PESTEL, Porter's Five Forces
4. 风险评估框架：ISO 27005, NIST Cybersecurity Framework

**质量标准：**
- 分析的客观性、准确性和完整性
- 逻辑严谨，推理链条清晰
- 基于事实和数据，避免主观臆断
- 识别潜在偏见和局限性
- 提供具体可行的建议

请基于提供的OSINT数据、语义分析结果和推理洞察，生成专业的智能情报报告。`
  }

  /**
   * 构建综合用户提示词
   */
  private buildComprehensiveUserPrompt(
    topic: string,
    collectedData: any[],
    semanticAnalysis: any,
    reasoningResults: any,
    config: IntelligentReportOptions
  ): string {
    
    // 构建数据源摘要
    const dataSummary = collectedData.map((item, index) => {
      if (item.type === 'osint') {
        return `
**OSINT数据源 ${index + 1} (${item.tool}):**
- 查询: ${item.query}
- 数据类型: ${item.metadata?.dataType || 'unknown'}
- 记录数: ${item.metadata?.recordCount || 0}
- 可信度: ${item.metadata?.confidence || 'unknown'}
- 时间范围: ${item.metadata?.timeRange || 'unknown'}
        `
      }
      return ''
    }).filter(Boolean).join('\n')

    // 构建语义分析摘要
    const semanticSummary = semanticAnalysis.topics && semanticAnalysis.topics.length > 0 ? `
**语义分析结果：**
- 主要主题: ${semanticAnalysis.topics.slice(0, 5).join(', ')}
- 关键实体: ${semanticAnalysis.entities?.slice(0, 8).join(', ') || '未识别'}
- 情感倾向: ${semanticAnalysis.sentiment || 'neutral'}
    ` : ''

    // 构建推理分析摘要
    const reasoningSummary = reasoningResults.insights && reasoningResults.insights.length > 0 ? `
**智能推理洞察：**
- 核心洞察: ${reasoningResults.insights.slice(0, 3).join('；')}
- 识别模式: ${reasoningResults.patterns?.join('；') || '无显著模式'}
- 预测趋势: ${reasoningResults.predictions?.join('；') || '无明确预测'}
    ` : ''

    // 构建报告模板
    const template = this.getIntelligentReportTemplate(config.template, config.language)

    return `
**分析议题：** ${topic}

**数据源摘要：**
${dataSummary}

${semanticSummary}

${reasoningSummary}

**报告模板要求：**
${template}

**特殊要求：**
1. 严格按照模板结构生成报告，确保每个章节都有实质内容
2. 基于OSINT数据和智能分析结果进行专业分析
3. 识别和评估相关的威胁、风险和机遇
4. 提供具体可行的建议和行动方案
5. 在适当位置引用数据源，格式为：[OSINT数据源X]
6. 分析要客观中立，避免主观臆断
7. 对于不确定性因素，明确标注置信度水平

请开始生成专业的智能情报报告：
    `
  }

  /**
   * 获取智能报告模板
   */
  private getIntelligentReportTemplate(template: string, language: string): string {
    const templates: Record<string, Record<string, string>> = {
      comprehensive: {
        zh: `
# {topic} - 智能情报分析报告

## 执行摘要
{executive_summary}

## 一、情报背景与现状
### 1.1 议题背景
{background_analysis}

### 1.2 当前态势评估
{current_situation}

### 1.3 关键情报指标
{key_metrics}

## 二、多源情报融合分析
### 2.1 OSINT专业工具分析
{osint_analysis}

### 2.2 威胁情报评估
{threat_assessment}

### 2.3 技术态势分析
{technical_analysis}

### 2.4 地缘政治影响
{geopolitical_analysis}

## 三、深度语义洞察
### 3.1 主题演化趋势
{topic_trends}

### 3.2 实体关系网络
{entity_relationships}

### 3.3 情感倾向分析
{sentiment_analysis}

## 四、智能推理分析
### 4.1 模式识别与洞察
{pattern_insights}

### 4.2 风险因素识别
{risk_factors}

### 4.3 机遇与挑战
{opportunities_challenges}

## 五、趋势预测与预警
### 5.1 短期发展趋势（3个月）
{short_term_trends}

### 5.2 中期发展预测（6-12个月）
{medium_term_prediction}

### 5.3 长期影响评估（1-3年）
{long_term_impact}

### 5.4 关键预警指标
{early_warning_indicators}

## 六、决策建议与行动方案
### 6.1 即时应对措施
{immediate_actions}

### 6.2 中期战略规划
{medium_term_strategy}

### 6.3 长期发展建议
{long_term_recommendations}

### 6.4 资源配置建议
{resource_allocation}

## 七、监控框架与持续评估
### 7.1 关键监控指标
{monitoring_metrics}

### 7.2 评估机制
{evaluation_mechanism}

### 7.3 更新频率
{update_frequency}

## 八、结论与展望
{conclusion}

---
**报告元数据**
- 生成时间：{generation_time}
- 数据源数量：{data_source_count}
- OSINT工具：{osint_tools}
- 分析深度：{analysis_depth}
- 置信度水平：{confidence_level}
- 质量评分：{quality_score}/100
        `,
        en: `
# {topic} - Intelligent Intelligence Analysis Report

## Executive Summary
{executive_summary}

## 1. Intelligence Background and Current Status
### 1.1 Issue Background
{background_analysis}

### 1.2 Current Situation Assessment
{current_situation}

### 1.3 Key Intelligence Metrics
{key_metrics}

## 2. Multi-source Intelligence Fusion Analysis
### 2.1 OSINT Professional Tools Analysis
{osint_analysis}

### 2.2 Threat Intelligence Assessment
{threat_assessment}

### 2.3 Technical Posture Analysis
{technical_analysis}

### 2.4 Geopolitical Impact
{geopolitical_analysis}

## 3. Deep Semantic Insights
### 3.1 Topic Evolution Trends
{topic_trends}

### 3.2 Entity Relationship Networks
{entity_relationships}

### 3.3 Sentiment Analysis
{sentiment_analysis}

## 4. Intelligent Reasoning Analysis
### 4.1 Pattern Recognition and Insights
{pattern_insights}

### 4.2 Risk Factor Identification
{risk_factors}

### 4.3 Opportunities and Challenges
{opportunities_challenges}

## 5. Trend Prediction and Early Warning
### 5.1 Short-term Trends (3 months)
{short_term_trends}

### 5.2 Medium-term Prediction (6-12 months)
{medium_term_prediction}

### 5.3 Long-term Impact Assessment (1-3 years)
{long_term_impact}

### 5.4 Key Early Warning Indicators
{early_warning_indicators}

## 6. Decision Recommendations and Action Plans
### 6.1 Immediate Response Measures
{immediate_actions}

### 6.2 Medium-term Strategic Planning
{medium_term_strategy}

### 6.3 Long-term Development Recommendations
{long_term_recommendations}

### 6.4 Resource Allocation Recommendations
{resource_allocation}

## 7. Monitoring Framework and Continuous Assessment
### 7.1 Key Monitoring Metrics
{monitoring_metrics}

### 7.2 Evaluation Mechanism
{evaluation_mechanism}

### 7.3 Update Frequency
{update_frequency}

## 8. Conclusion and Outlook
{conclusion}

---
**Report Metadata**
- Generation Time: {generation_time}
- Data Sources: {data_source_count}
- OSINT Tools: {osint_tools}
- Analysis Depth: {analysis_depth}
- Confidence Level: {confidence_level}
- Quality Score: {quality_score}/100
        `
      },
      osint: {
        zh: `
# {topic} - OSINT专业情报报告

## 情报摘要
{executive_summary}

## 一、OSINT数据采集概况
### 1.1 采集工具与方法
{collection_methods}

### 1.2 数据源统计
{data_source_statistics}

### 1.3 数据质量评估
{data_quality_assessment}

## 二、专业工具分析结果
### 2.1 威胁情报分析
{threat_intelligence_analysis}

### 2.2 网络态势感知
{network_situation_awareness}

### 2.3 技术指纹识别
{technical_fingerprinting}

### 2.4 行为模式分析
{behavioral_pattern_analysis}

## 三、关联分析与融合
### 3.1 多源数据关联
{multi_source_correlation}

### 3.2 时间序列分析
{time_series_analysis}

### 3.3 空间分布分析
{spatial_distribution_analysis}

## 四、威胁评估与预警
### 4.1 威胁等级评估
{threat_level_assessment}

### 4.2 攻击面分析
{attack_surface_analysis}

### 4.3 漏洞影响评估
{vulnerability_impact_assessment}

### 4.4 预警信号识别
{early_warning_signals}

## 五、防御建议与对策
### 5.1 技术防护措施
{technical_protection_measures}

### 5.2 流程优化建议
{process_optimization_recommendations}

### 5.3 人员培训需求
{personnel_training_requirements}

### 5.4 应急响应预案
{emergency_response_plan}

## 六、持续监控方案
### 6.1 监控指标体系
{monitoring_indicator_system}

### 6.2 自动化监控
{automated_monitoring}

### 6.3 定期评估机制
{regular_evaluation_mechanism}

## 七、结论
{conclusion}
        `
      }
    }

    return templates[template]?.[language] || templates.comprehensive.zh
  }

  /**
   * 解析和结构化报告内容
   */
  private parseAndStructureReportContent(content: string, config: IntelligentReportOptions): IntelligentReportContent {
    // 这里实现LLM输出内容的解析和结构化
    // 由于LLM输出格式可能不固定，需要智能解析
    
    // 简化实现，实际项目中需要更复杂的解析逻辑
    const sections = content.split('\n## ')
    
    return {
      executiveSummary: this.extractSection(content, '执行摘要') || this.extractSection(content, 'Executive Summary') || '',
      keyFindings: this.extractKeyFindings(content),
      detailedAnalysis: content,
      backgroundAnalysis: this.extractSection(content, '背景分析') || '',
      threatAssessment: this.extractSection(content, '威胁') || '',
      opportunityAnalysis: this.extractSection(content, '机遇') || '',
      trendPrediction: this.extractSection(content, '趋势') || '',
      riskAssessment: this.extractSection(content, '风险') || '',
      recommendations: this.extractRecommendations(content),
      technicalAnalysis: this.extractSection(content, '技术') || '',
      securityAssessment: this.extractSection(content, '安全') || '',
      monitoringIndicators: {
        keyMetrics: this.extractListItems(content, '监控指标'),
        earlyWarningSignals: this.extractListItems(content, '预警'),
        monitoringFramework: this.extractSection(content, '监控框架') || ''
      }
    }
  }

  /**
   * 报告质量评估和优化
   */
  private async assessAndOptimizeReport(
    reportContent: IntelligentReportContent,
    collectedData: any[],
    config: IntelligentReportOptions
  ): Promise<any> {
    
    console.log('🔬 开始报告质量评估...')

    // 多维度质量评估
    const assessments = {
      dataQuality: this.assessDataQuality(collectedData),
      contentQuality: this.assessContentQuality(reportContent),
      structureQuality: this.assessStructureQuality(reportContent),
      analysisDepth: this.assessAnalysisDepth(reportContent),
      actionability: this.assessActionability(reportContent)
    }

    // 计算综合评分
    const overallScore = Math.round(
      assessments.dataQuality * 0.25 +
      assessments.contentQuality * 0.25 +
      assessments.structureQuality * 0.2 +
      assessments.analysisDepth * 0.15 +
      assessments.actionability * 0.15
    )

    // 生成评估反馈
    const feedback = this.generateQualityFeedback(assessments, overallScore)

    console.log(`✅ 质量评估完成，综合评分: ${overallScore}/100`)
    
    return {
      assessments,
      overallScore,
      feedback,
      optimizationNeeded: overallScore < 75
    }
  }

  /**
   * 结构化最终报告
   */
  private async structureFinalReport(
    reportId: string,
    topic: string,
    reportContent: IntelligentReportContent,
    collectedData: any[],
    semanticAnalysis: any,
    reasoningResults: any,
    qualityAssessment: any,
    config: IntelligentReportOptions,
    startTime: number
  ): Promise<IntelligentReport> {
    
    // 构建元数据
    const metadata: IntelligentReportMetadata = {
      id: reportId,
      topic,
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      template: config.template,
      language: config.language,
      targetAudience: config.targetAudience,
      dataSources: {
        totalSources: collectedData.length,
        osintSources: collectedData.filter(d => d.type === 'osint').length,
        webSources: collectedData.filter(d => d.type === 'web').length,
        validatedSources: collectedData.filter(d => d.metadata?.confidence >= config.dataSources.credibilityThreshold).length,
        averageCredibility: this.calculateAverageCredibility(collectedData)
      },
      analysis: {
        semanticDepth: semanticAnalysis.topics?.length || 0,
        reasoningComplexity: reasoningResults.insights?.length || 0,
        confidenceLevel: qualityAssessment.overallScore,
        keyTopics: semanticAnalysis.topics?.slice(0, 10) || [],
        entities: semanticAnalysis.entities?.slice(0, 15) || [],
        relationships: reasoningResults.patterns?.slice(0, 8) || []
      },
      quality: {
        overallScore: qualityAssessment.overallScore,
        dataQuality: qualityAssessment.assessments.dataQuality,
        analysisQuality: qualityAssessment.assessments.analysisDepth,
        structureQuality: qualityAssessment.assessments.structureQuality,
        actionability: qualityAssessment.assessments.actionability
      }
    }

    return {
      metadata,
      content: reportContent,
      rawData: collectedData,
      processingLog: [
        `报告生成开始: ${new Date(startTime).toISOString()}`,
        `数据采集完成: ${collectedData.length} 个源`,
        `语义分析完成: ${semanticAnalysis.topics?.length || 0} 个主题`,
        `推理分析完成: ${reasoningResults.insights?.length || 0} 个洞察`,
        `质量评估完成: ${qualityAssessment.overallScore}/100`,
        `报告生成完成: ${new Date().toISOString()}`
      ],
      qualityAssessment: qualityAssessment.feedback
    }
  }

  // 辅助方法实现
  private extractSection(content: string, sectionName: string): string {
    const pattern = new RegExp(`## ${sectionName}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |\\n# |$)`, 'i')
    const match = content.match(pattern)
    return match ? match[1].trim() : ''
  }

  private extractKeyFindings(content: string): string[] {
    const findings: string[] = []
    const patterns = [
      /关键发现[：:]\s*([^\n]+)/gi,
      /核心发现[：:]\s*([^\n]+)/gi,
      /主要发现[：:]\s*([^\n]+)/gi
    ]
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) findings.push(...matches.map(m => m.replace(/^[^：:]+[：:]\s*/, '')))
    })
    
    return findings.length > 0 ? findings : ['暂无关键发现']
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = []
    const section = this.extractSection(content, '建议') || this.extractSection(content, 'Recommendations')
    
    if (section) {
      const lines = section.split('\n')
      lines.forEach(line => {
        if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.match(/^\d+\./)) {
          recommendations.push(line.trim())
        }
      })
    }
    
    return recommendations.length > 0 ? recommendations : ['暂无具体建议']
  }

  private extractListItems(content: string, context: string): string[] {
    const items: string[] = []
    const section = this.extractSection(content, context)
    
    if (section) {
      const lines = section.split('\n')
      lines.forEach(line => {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          items.push(line.trim().replace(/^[-•]\s*/, ''))
        }
      })
    }
    
    return items
  }

  private assessDataQuality(data: any[]): number {
    if (data.length === 0) return 0
    
    const avgConfidence = data.reduce((sum, item) => 
      sum + (item.metadata?.confidence || 0.5), 0) / data.length
    
    const diversity = new Set(data.map(d => d.type)).size / 2 // 最多2种类型
    
    return Math.round((avgConfidence * 0.7 + diversity * 0.3) * 100)
  }

  private assessContentQuality(content: IntelligentReportContent): number {
    const executiveSummaryLength = content.executiveSummary.length
    const keyFindingsCount = content.keyFindings.length
    const recommendationsCount = content.recommendations.length
    
    const lengthScore = Math.min(executiveSummaryLength / 200, 1) * 30
    const findingsScore = Math.min(keyFindingsCount / 5, 1) * 30
    const recommendationsScore = Math.min(recommendationsCount / 5, 1) * 40
    
    return Math.round(lengthScore + findingsScore + recommendationsScore)
  }

  private assessStructureQuality(content: IntelligentReportContent): number {
    const hasExecutiveSummary = content.executiveSummary.length > 50
    const hasKeyFindings = content.keyFindings.length > 0
    const hasRecommendations = content.recommendations.length > 0
    const hasDetailedAnalysis = content.detailedAnalysis.length > 500
    
    const score = (hasExecutiveSummary ? 25 : 0) +
                 (hasKeyFindings ? 25 : 0) +
                 (hasRecommendations ? 25 : 0) +
                 (hasDetailedAnalysis ? 25 : 0)
    
    return score
  }

  private assessAnalysisDepth(content: IntelligentReportContent): number {
    const analysisContent = content.detailedAnalysis.toLowerCase()
    const depthKeywords = ['深入', '分析', '评估', '预测', '洞察', '战略', '战术', '威胁', '风险']
    
    const keywordCount = depthKeywords.reduce((count, keyword) => 
      count + (analysisContent.match(new RegExp(keyword, 'g')) || []).length, 0)
    
    return Math.min(Math.round(keywordCount * 10), 100)
  }

  private assessActionability(content: IntelligentReportContent): number {
    const recommendationsText = content.recommendations.join(' ').toLowerCase()
    const actionWords = ['建议', '应该', '需要', '可以', '实施', '执行', '采取', '推进', '加强', '建立']
    
    const actionCount = actionWords.reduce((count, word) => 
      count + (recommendationsText.match(new RegExp(word, 'g')) || []).length, 0)
    
    return Math.min(Math.round(actionCount * 8), 100)
  }

  private generateQualityFeedback(assessments: any, overallScore: number): any {
    const strengths: string[] = []
    const limitations: string[] = []
    const improvementSuggestions: string[] = []

    if (assessments.dataQuality >= 80) strengths.push('数据源质量优秀')
    else if (assessments.dataQuality < 60) limitations.push('数据源质量需要提升')

    if (assessments.contentQuality >= 80) strengths.push('内容分析深入')
    else if (assessments.contentQuality < 60) improvementSuggestions.push('建议加强内容深度分析')

    if (assessments.structureQuality >= 80) strengths.push('报告结构完整')
    else improvementSuggestions.push('建议完善报告结构')

    if (overallScore >= 85) strengths.push('报告整体质量优秀')
    else if (overallScore < 70) limitations.push('报告质量需要显著改进')

    return { strengths, limitations, improvementSuggestions }
  }

  private calculateAverageCredibility(data: any[]): number {
    if (data.length === 0) return 0
    
    const totalCredibility = data.reduce((sum, item) => 
      sum + (item.metadata?.confidence || 0.5), 0)
    
    return Math.round((totalCredibility / data.length) * 100) / 100
  }
}

// 导出单例实例
export const intelligentReportGenerator = new IntelligentReportGenerator()

// 便捷函数
export async function generateIntelligenceReport(
  topic: string,
  options?: Partial<IntelligentReportOptions>
): Promise<IntelligentReport> {
  return intelligentReportGenerator.generateIntelligentReport(topic, options)
}