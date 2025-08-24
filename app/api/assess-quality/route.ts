import { NextRequest, NextResponse } from 'next/server'
import { qualityAssessmentService } from '@/lib/quality-assessment'
import { SearchResult } from '@/lib/search-engine'

export async function POST(request: NextRequest) {
  try {
    const { 
      content, 
      topic, 
      dataSources = [],
      metadata = {}
    } = await request.json()

    if (!content || !topic) {
      return NextResponse.json(
        { error: '请提供报告内容和主题' },
        { status: 400 }
      )
    }

    console.log('📊 开始质量评估:', topic)
    console.log(`📝 报告长度: ${content.length} 字符`)
    console.log(`📡 数据源数量: ${dataSources.length}`)

    // 执行质量评估
    const qualityMetrics = await qualityAssessmentService.assessReportQuality(
      content,
      dataSources as SearchResult[],
      topic,
      metadata
    )

    console.log(`✅ 质量评估完成，综合评分: ${qualityMetrics.score}/100`)

    return NextResponse.json({
      success: true,
      qualityMetrics,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ 质量评估失败:', error)
    return NextResponse.json(
      { 
        error: '质量评估失败',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 获取质量评估标准和说明
export async function GET() {
  try {
    return NextResponse.json({
      status: 'active',
      version: '1.0.0',
      assessmentCriteria: {
        dataQuality: {
          weight: 30,
          factors: [
            '数据源数量和多样性',
            '数据源验证比例',
            '信息相关性',
            '数据时效性',
            '来源可信度'
          ]
        },
        contentQuality: {
          weight: 45,
          factors: [
            '内容长度和详实程度',
            '可读性和表达清晰度',
            '专业术语使用',
            '引用和数据支撑',
            '分析深度',
            '关键词密度'
          ]
        },
        structureQuality: {
          weight: 25,
          factors: [
            '章节完整性',
            '逻辑流程',
            '结构组织',
            '格式规范'
          ]
        }
      },
      scoringScale: {
        excellent: { range: '90-100', description: '优秀 - 达到专业标准' },
        good: { range: '80-89', description: '良好 - 符合预期要求' },
        fair: { range: '70-79', description: '中等 - 基本满足需求' },
        poor: { range: '60-69', description: '较差 - 需要改进' },
        fail: { range: '0-59', description: '不合格 - 需要重新生成' }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: '获取评估标准失败', details: error.message },
      { status: 500 }
    )
  }
}