import { NextRequest, NextResponse } from 'next/server'
import { intelligentReportGenerator, IntelligentReportOptions } from '@/lib/intelligent-report-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      topic, 
      template = 'comprehensive',
      language = 'zh',
      targetAudience = 'professional',
      analysisDepth = 'expert',
      osintIntegration = true,
      enableSemanticAnalysis = true,
      enableReasoning = true,
      dataSources,
      llmConfig,
      includeVisualizations = false,
      includeSourceCitations = true,
      includeConfidenceScores = true,
      enableRealTimeUpdates = false
    } = body

    if (!topic || !topic.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'Analysis topic is required' 
      }, { status: 400 })
    }

    console.log('🚀 开始生成智能情报报告:', topic)

    // 构建配置选项
    const options: Partial<IntelligentReportOptions> = {
      template,
      language,
      targetAudience,
      analysisDepth,
      osintIntegration,
      enableSemanticAnalysis,
      enableReasoning,
      dataSources: dataSources || {
        osintTools: ['shodan', 'otx', 'virustotal'],
        maxSources: 15,
        timeRange: 'month',
        credibilityThreshold: 0.6
      },
      llmConfig: llmConfig || {
        provider: 'zhipu',
        model: 'glm-4',
        temperature: 0.3,
        maxTokens: 4000,
        enableChainOfThought: true
      },
      includeVisualizations,
      includeSourceCitations,
      includeConfidenceScores,
      enableRealTimeUpdates
    }

    // 生成智能报告
    const report = await intelligentReportGenerator.generateIntelligentReport(topic.trim(), options)

    // 返回成功响应
    return NextResponse.json({
      success: true,
      report,
      metadata: {
        generationTime: report.metadata.processingTime,
        dataSources: report.metadata.dataSources,
        quality: report.metadata.quality,
        analysis: report.metadata.analysis
      }
    })

  } catch (error: any) {
    console.error('❌ 智能报告生成失败:', error)
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to generate intelligent report',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'templates') {
      // 返回可用的报告模板
      const templates = [
        {
          id: 'comprehensive',
          name: '综合情报分析报告',
          description: '包含背景分析、多维度分析、趋势预测、风险评估的完整报告',
          sections: ['执行摘要', '背景分析', '多源融合分析', '深度语义洞察', '智能推理分析', '趋势预测', '决策建议', '监控框架'],
          suitableFor: ['专业分析师', '决策者', '研究人员'],
          features: ['OSINT集成', '语义分析', '智能推理', '多源融合']
        },
        {
          id: 'osint',
          name: 'OSINT专业情报报告',
          description: '专注于开源情报工具分析的专业报告',
          sections: ['情报摘要', '数据采集概况', '专业工具分析', '关联分析融合', '威胁评估预警', '防御建议对策', '持续监控方案'],
          suitableFor: ['安全分析师', '情报专家', '应急响应团队'],
          features: ['专业OSINT工具', '威胁情报', '攻击面分析', '行为模式识别']
        },
        {
          id: 'executive',
          name: '高层决策简报',
          description: '面向高层决策者的简洁要点报告',
          sections: ['关键要点', '核心发现', '即时建议', '风险警示', '机遇识别', '下一步行动'],
          suitableFor: ['高层管理者', '决策者', '董事会'],
          features: ['精简要点', '决策支持', '风险预警', '行动导向']
        },
        {
          id: 'technical',
          name: '技术分析报告',
          description: '专注于技术细节和实现方案的专业报告',
          sections: ['技术背景', '架构分析', '技术评估', '实现方案', '安全考虑', '性能分析', '部署建议'],
          suitableFor: ['技术团队', '开发人员', '系统架构师'],
          features: ['技术深度', '架构分析', '实现指导', '性能优化']
        },
        {
          id: 'brief',
          name: '简要分析报告',
          description: '快速生成的核心分析报告',
          sections: ['核心要点', '现状分析', '关键发现', '建议措施', '结论'],
          suitableFor: ['一般用户', '快速了解', '初步评估'],
          features: ['快速生成', '核心信息', '实用建议']
        }
      ]

      return NextResponse.json({
        success: true,
        templates,
        count: templates.length
      })
    }

    if (action === 'config') {
      // 返回默认配置
      const defaultConfig = {
        templates: ['comprehensive', 'osint', 'executive', 'technical', 'brief'],
        languages: ['zh', 'en'],
        targetAudiences: ['general', 'professional', 'academic', 'executive', 'analyst'],
        analysisDepths: ['basic', 'detailed', 'expert', 'strategic'],
        defaultOSINTTools: ['shodan', 'otx', 'virustotal', 'abuseipdb', 'censys'],
        supportedLLMProviders: ['zhipu', 'openai', 'ollama'],
        maxDataSources: 25,
        credibilityThresholdRange: [0.3, 0.9],
        features: {
          osintIntegration: '集成15+专业OSINT工具',
          semanticAnalysis: '深度语义理解和主题建模',
          intelligentReasoning: '智能推理和模式识别',
          multiLLMSupport: '支持多LLM模型和智能分配',
          realTimeProcessing: '实时数据处理和分析',
          qualityAssessment: '多维度质量评估和优化'
        }
      }

      return NextResponse.json({
        success: true,
        config: defaultConfig
      })
    }

    if (action === 'health') {
      // 健康检查
      return NextResponse.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        capabilities: [
          'OSINT专业工具集成',
          '多LLM模型支持',
          '深度语义分析',
          '智能推理引擎',
          '实时质量评估',
          '专业报告生成'
        ]
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action parameter'
    }, { status: 400 })

  } catch (error: any) {
    console.error('API调用失败:', error)
    return NextResponse.json({ 
      success: false,
      error: 'API call failed',
      details: error.message
    }, { status: 500 })
  }
}