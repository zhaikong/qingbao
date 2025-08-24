import { NextRequest, NextResponse } from 'next/server'
import { monitoringEngine } from '@/lib/real-time-monitoring'

// 获取监控事件
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('targetId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')

    let events = monitoringEngine.getEvents(targetId || undefined, limit)

    // 应用过滤器
    if (unreadOnly) {
      events = events.filter(e => !e.isRead)
    }

    if (severity) {
      events = events.filter(e => e.severity === severity)
    }

    if (type) {
      events = events.filter(e => e.type === type)
    }

    // 统计信息
    const stats = {
      total: events.length,
      unread: events.filter(e => !e.isRead).length,
      critical: events.filter(e => e.severity === 'critical').length,
      high: events.filter(e => e.severity === 'high').length,
      medium: events.filter(e => e.severity === 'medium').length,
      low: events.filter(e => e.severity === 'low').length,
      threats: events.filter(e => e.type === 'threat').length,
      matches: events.filter(e => e.type === 'match').length
    }

    return NextResponse.json({
      success: true,
      events,
      stats,
      count: events.length
    })

  } catch (error: any) {
    console.error('获取监控事件失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取监控事件失败',
      details: error.message
    }, { status: 500 })
  }
}

// 标记事件为已读
export async function PATCH(request: NextRequest) {
  try {
    const { eventIds, allEvents } = await request.json()

    let success = false

    if (allEvents) {
      // 标记所有事件为已读
      const events = monitoringEngine.getEvents()
      events.forEach(event => {
        monitoringEngine.markEventAsRead(event.id)
      })
      success = true
    } else if (eventIds && Array.isArray(eventIds)) {
      // 标记指定事件为已读
      eventIds.forEach((eventId: string) => {
        monitoringEngine.markEventAsRead(eventId)
      })
      success = true
    }

    if (!success) {
      return NextResponse.json({
        success: false,
        error: '无效的请求参数'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: '事件已标记为已读'
    })

  } catch (error: any) {
    console.error('标记事件状态失败:', error)
    return NextResponse.json({
      success: false,
      error: '标记事件状态失败',
      details: error.message
    }, { status: 500 })
  }
}