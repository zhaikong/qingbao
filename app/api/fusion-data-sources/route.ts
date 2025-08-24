import { NextRequest, NextResponse } from 'next/server'
import { multiSourceDataFusion, DataSource } from '@/lib/multi-source-data-fusion'

// 添加融合数据源
export async function POST(request: NextRequest) {
  try {
    const sourceData = await request.json()
    
    const source: DataSource = {
      id: sourceData.id,
      name: sourceData.name,
      type: sourceData.type,
      credibility: sourceData.credibility || 0.5,
      freshness: sourceData.freshness || 0.5,
      coverage: sourceData.coverage || 0.5,
      lastUpdate: new Date(),
      metadata: sourceData.metadata || {}
    }

    // 验证必要字段
    if (!source.id || !source.name || !source.type) {
      return NextResponse.json({
        success: false,
        error: '数据源ID、名称和类型不能为空'
      }, { status: 400 })
    }

    multiSourceDataFusion.addDataSource(source)

    return NextResponse.json({
      success: true,
      message: '融合数据源添加成功',
      source
    })

  } catch (error: any) {
    console.error('添加融合数据源失败:', error)
    return NextResponse.json({
      success: false,
      error: '添加融合数据源失败',
      details: error.message
    }, { status: 500 })
  }
}

// 获取融合数据源列表
export async function GET(request: NextRequest) {
  try {
    const sources = multiSourceDataFusion.getDataSources()
    
    return NextResponse.json({
      success: true,
      sources,
      count: sources.length
    })

  } catch (error: any) {
    console.error('获取融合数据源失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取融合数据源失败',
      details: error.message
    }, { status: 500 })
  }
}