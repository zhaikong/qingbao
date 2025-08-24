/**
 * 增强型报告生成API路由
 * 
 * 提供高级情报分析和报告生成服务
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateAdvancedIntelligenceReport, EnhancedReportGenerationOptions } from '@/lib/enhanced-report-generator'
import { enhancedDataSourceManager } from '@/lib/enhanced-data-sources'

export const maxDuration = 300 // 5分钟超时

export async function POST(request: NextRequest) {
  console.log('🚀 收到增强型报告生成请求')
  
  let requestBody: any = null
  
  try {
    const body = await request.json()
    // 保存body引用供错误处理使用
    requestBody = body
    const { 
      topic, 
      template = 'comprehensive',
      language = 'zh',
      analysisDepth = 'expert',
      contentDepth = 'full',
      includeVisuals = false,
      includeSourceValidation = true,
      maxDataSources = 20,
      timeRange = 'month',
      focusAreas = [],
      targetAudience = 'professional',
      urgencyLevel = 'medium'
    } = body

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '请提供有效的分析主题',
          code: 'INVALID_TOPIC'
        },
        { status: 400 }
      )
    }

    console.log(`📋 生成报告: "${topic}"`)
    console.log(`⚙️ 配置: 模板=${template}, 深度=${analysisDepth}, 受众=${targetAudience}`)

    // 检查数据源状态
    const dataSourceStatus = enhancedDataSourceManager.getDataSourceStatus()
    const enabledSources = Object.entries(dataSourceStatus).filter(([, config]) => config.enabled)
    
    if (enabledSources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '没有可用的数据源，请检查API配置',
          code: 'NO_DATA_SOURCES',
          dataSourceStatus
        },
        { status: 503 }
      )
    }

    console.log(`📡 可用数据源 (${enabledSources.length}个):`, enabledSources.map(([name]) => name))

    // 构建报告生成选项
    const options: Partial<EnhancedReportGenerationOptions> = {
      template: template as any,
      language: language as any,
      analysisDepth: analysisDepth as any,
      contentDepth: contentDepth as any,
      includeVisuals,
      includeSourceValidation,
      maxDataSources: Math.min(Math.max(maxDataSources, 5), 30), // 限制在5-30之间
      timeRange: timeRange as any,
      focusAreas: Array.isArray(focusAreas) ? focusAreas : [],
      targetAudience: targetAudience as any,
      urgencyLevel: urgencyLevel as any
    }

    // 生成增强型报告
    const startTime = Date.now()
    const report = await generateAdvancedIntelligenceReport(topic, options)
    const processingTime = Date.now() - startTime

    console.log(`✅ 报告生成完成: ${(processingTime / 1000).toFixed(2)}秒`)
    console.log(`📊 质量评分: ${report.qualityAssessment.overallScore}/100`)
    console.log(`📝 报告字数: ${report.metadata.wordCount}`)

    // 构建响应
    const response = {
      success: true,
      data: {
        report: {
          content: report.content,
          executiveSummary: report.executiveSummary,
          keyFindings: report.keyFindings,
          recommendations: report.recommendations
        },
        metadata: {
          ...report.metadata,
          processingTime
        },
        quality: {
          overallScore: report.qualityAssessment.overallScore,
          dataQuality: report.qualityAssessment.dataQuality,
          analysisDepth: report.qualityAssessment.analysisDepth,
          structureQuality: report.qualityAssessment.structureQuality,
          actionability: report.qualityAssessment.actionability,
          reliability: report.qualityAssessment.reliability,
          completeness: report.qualityAssessment.completeness,
          strengths: report.qualityAssessment.strengths,
          limitations: report.qualityAssessment.limitations,
          improvements: report.qualityAssessment.improvements
        },
        sources: {
          total: report.metadata.dataSourceCount,
          validated: report.metadata.validatedSourceCount,
          details: report.metadata.sources
        },
        debug: {
          dataSourceStatus,
          enabledSourceCount: enabledSources.length,
          processingStages: [
            '数据采集', 
            '内容提取', 
            '质量评估', 
            '报告生成', 
            '质量验证', 
            '结构化输出'
          ]
        }
      } as any // 使用any类型以允许动态添加属性
    }

    // 根据质量评分添加警告
    if (report.qualityAssessment.overallScore < 60) {
      response.data['warning'] = '报告质量较低，建议谨慎使用并寻求专家验证'
    } else if (report.qualityAssessment.overallScore < 75) {
      response.data['notice'] = '报告质量中等，建议结合其他信息源进行决策'
    }

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Report-Quality': report.qualityAssessment.overallScore.toString(),
        'X-Processing-Time': processingTime.toString(),
        'X-Data-Sources': report.metadata.dataSourceCount.toString()
      }
    })

  } catch (error: any) {
    console.error('❌ 增强型报告生成失败:', error)
    
    // 错误分类和处理
    let errorCode = 'UNKNOWN_ERROR'
    let statusCode = 500
    let errorMessage = error.message || '未知错误'

    if (error.message?.includes('数据搜索失败')) {
      errorCode = 'DATA_COLLECTION_FAILED'
      statusCode = 503
    } else if (error.message?.includes('API')) {
      errorCode = 'API_ERROR'
      statusCode = 503
    } else if (error.message?.includes('timeout') || error.message?.includes('超时')) {
      errorCode = 'TIMEOUT_ERROR'
      statusCode = 504
      errorMessage = '处理超时，请尝试减少数据源数量或简化分析要求'
    } else if (error.message?.includes('配置')) {
      errorCode = 'CONFIGURATION_ERROR'
      statusCode = 500
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        details: {
          timestamp: new Date().toISOString(),
          topic: requestBody?.topic || 'unknown',
          errorType: error.constructor.name,
          suggestions: [
            '检查网络连接是否正常',
            '验证API密钥配置',
            '尝试减少数据源数量',
            '选择更简单的分析模板',
            '联系技术支持'
          ]
        }
      },
      { status: statusCode }
    )
  }
}

// GET方法：获取系统状态和配置信息
export async function GET(request: NextRequest) {
  try {
    const dataSourceStatus = enhancedDataSourceManager.getDataSourceStatus()
    const enabledSources = Object.entries(dataSourceStatus).filter(([, config]) => config.enabled)
    
    const status = {
      success: true,
      system: {
        version: '2.0.0-enhanced',
        status: 'operational',
        lastUpdated: new Date().toISOString()
      },
      dataSources: {
        total: Object.keys(dataSourceStatus).length,
        enabled: enabledSources.length,
        details: dataSourceStatus
      },
      capabilities: {
        templates: ['comprehensive', 'brief', 'technical', 'policy', 'market', 'academic', 'executive'],
        languages: ['zh', 'en'],
        analysisDepths: ['basic', 'detailed', 'expert', 'strategic'],
        contentDepths: ['summary', 'full'],
        timeRanges: ['day', 'week', 'month', 'year', 'all'],
        targetAudiences: ['general', 'professional', 'academic', 'executive'],
        urgencyLevels: ['low', 'medium', 'high', 'critical']
      },
      limits: {
        maxDataSources: 30,
        maxProcessingTime: 300, // 5分钟
        maxTopicLength: 200,
        maxFocusAreas: 10
      },
      recommendations: [
        '使用具体明确的分析主题',
        '根据时间要求选择合适的紧急程度',
        '配置多个数据源API以提高可靠性',
        '定期验证API密钥的有效性'
      ]
    }

    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5分钟缓存
        'X-System-Version': '2.0.0-enhanced'
      }
    })

  } catch (error: any) {
    console.error('❌ 获取系统状态失败:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: '系统状态检查失败',
        code: 'SYSTEM_CHECK_FAILED'
      },
      { status: 500 }
    )
  }
}