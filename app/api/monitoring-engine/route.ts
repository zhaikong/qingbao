import { NextRequest, NextResponse } from 'next/server'
import { monitoringEngine, MonitoringTarget, AlertRule } from '@/lib/real-time-monitoring'

// 启动/停止监控引擎
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'start') {
      await monitoringEngine.start()
      return NextResponse.json({
        success: true,
        message: '监控引擎已启动',
        status: 'running'
      })
    }

    if (action === 'stop') {
      await monitoringEngine.stop()
      return NextResponse.json({
        success: true,
        message: '监控引擎已停止',
        status: 'stopped'
      })
    }

    return NextResponse.json({
      success: false,
      error: '无效的action参数'
    }, { status: 400 })

  } catch (error: any) {
    console.error('监控引擎操作失败:', error)
    return NextResponse.json({
      success: false,
      error: '监控引擎操作失败',
      details: error.message
    }, { status: 500 })
  }
}

// 获取监控状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'dashboard') {
      const dashboard = monitoringEngine.getDashboard()
      return NextResponse.json({
        success: true,
        dashboard
      })
    }

    if (action === 'targets') {
      const targets = monitoringEngine.getTargets()
      return NextResponse.json({
        success: true,
        targets,
        count: targets.length
      })
    }

    if (action === 'events') {
      const targetId = searchParams.get('targetId')
      const limit = parseInt(searchParams.get('limit') || '50')
      const events = monitoringEngine.getEvents(targetId || undefined, limit)
      return NextResponse.json({
        success: true,
        events,
        count: events.length
      })
    }

    if (action === 'rules') {
      const rules = monitoringEngine.getRules()
      return NextResponse.json({
        success: true,
        rules,
        count: rules.length
      })
    }

    if (action === 'sources') {
      const sources = monitoringEngine.getSources()
      return NextResponse.json({
        success: true,
        sources,
        count: sources.length
      })
    }

    if (action === 'statistics') {
      const statistics = monitoringEngine.getStatistics()
      return NextResponse.json({
        success: true,
        statistics
      })
    }

    if (action === 'status') {
      return NextResponse.json({
        success: true,
        status: {
          isRunning: monitoringEngine['isRunning'],
          lastUpdate: new Date().toISOString(),
          version: '1.0.0'
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: '无效的action参数'
    }, { status: 400 })

  } catch (error: any) {
    console.error('获取监控状态失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取监控状态失败',
      details: error.message
    }, { status: 500 })
  }
}