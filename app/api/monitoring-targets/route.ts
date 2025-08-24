import { NextRequest, NextResponse } from 'next/server'
import { monitoringEngine, MonitoringTarget } from '@/lib/real-time-monitoring'

// 添加监控目标
export async function POST(request: NextRequest) {
  try {
    const targetData = await request.json()
    
    const target: MonitoringTarget = {
      id: '',
      name: targetData.name,
      type: targetData.type,
      keywords: targetData.keywords || [],
      sources: targetData.sources || [],
      filters: targetData.filters || [],
      severity: targetData.severity || 'medium',
      isActive: targetData.isActive !== false,
      createdAt: new Date(),
      lastTriggered: undefined
    }

    // 验证必要字段
    if (!target.name || !target.type) {
      return NextResponse.json({
        success: false,
        error: '监控目标名称和类型不能为空'
      }, { status: 400 })
    }

    const targetId = monitoringEngine.addTarget(target)

    return NextResponse.json({
      success: true,
      targetId,
      message: '监控目标添加成功'
    })

  } catch (error: any) {
    console.error('添加监控目标失败:', error)
    return NextResponse.json({
      success: false,
      error: '添加监控目标失败',
      details: error.message
    }, { status: 500 })
  }
}

// 获取监控目标列表
export async function GET(request: NextRequest) {
  try {
    const targets = monitoringEngine.getTargets()
    
    return NextResponse.json({
      success: true,
      targets,
      count: targets.length
    })

  } catch (error: any) {
    console.error('获取监控目标失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取监控目标失败',
      details: error.message
    }, { status: 500 })
  }
}