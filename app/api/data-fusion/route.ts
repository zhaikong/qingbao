import { NextRequest, NextResponse } from 'next/server'
import { multiSourceDataFusion, FusionConfig } from '@/lib/multi-source-data-fusion'

// 执行数据融合处理
export async function POST(request: NextRequest) {
  try {
    const { data, config } = await request.json()

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({
        success: false,
        error: '输入数据必须是非空数组'
      }, { status: 400 })
    }

    console.log('🔄 开始多源数据融合处理...')
    console.log(`📊 输入数据量: ${data.length} 条`)

    // 如果有配置更新，应用新配置
    if (config) {
      multiSourceDataFusion.updateConfig(config)
    }

    // 执行数据融合
    const result = await multiSourceDataFusion.processData(data)

    // 返回处理结果
    return NextResponse.json({
      success: true,
      result,
      metadata: {
        inputSize: data.length,
        outputEntities: result.entities.length,
        outputRelationships: result.relationships.length,
        outputClusters: result.clusters.length,
        outputInsights: result.insights.length,
        processingTime: result.processingTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ 数据融合处理失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '数据融合处理失败',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// 获取融合系统状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'status') {
      const status = {
        isRunning: true,
        entities: multiSourceDataFusion.getEntities().length,
        relationships: multiSourceDataFusion.getRelationships().length,
        dataSources: multiSourceDataFusion.getDataSources().length,
        config: multiSourceDataFusion.getConfig(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }

      return NextResponse.json({
        success: true,
        status
      })
    }

    if (action === 'entities') {
      const entities = multiSourceDataFusion.getEntities()
      return NextResponse.json({
        success: true,
        entities,
        count: entities.length
      })
    }

    if (action === 'relationships') {
      const relationships = multiSourceDataFusion.getRelationships()
      return NextResponse.json({
        success: true,
        relationships,
        count: relationships.length
      })
    }

    if (action === 'sources') {
      const sources = multiSourceDataFusion.getDataSources()
      return NextResponse.json({
        success: true,
        sources,
        count: sources.length
      })
    }

    if (action === 'config') {
      const config = multiSourceDataFusion.getConfig()
      return NextResponse.json({
        success: true,
        config
      })
    }

    if (action === 'clear') {
      multiSourceDataFusion.clear()
      return NextResponse.json({
        success: true,
        message: '融合数据已清空'
      })
    }

    return NextResponse.json({
      success: false,
      error: '无效的action参数'
    }, { status: 400 })

  } catch (error: any) {
    console.error('❌ 获取融合状态失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取融合状态失败',
      details: error.message
    }, { status: 500 })
  }
}