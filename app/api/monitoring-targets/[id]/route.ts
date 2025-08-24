import { NextRequest, NextResponse } from 'next/server'
import { monitoringEngine } from '@/lib/real-time-monitoring'

// 获取单个监控目标
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id
    const targets = monitoringEngine.getTargets()
    const target = targets.find(t => t.id === targetId)

    if (!target) {
      return NextResponse.json({
        success: false,
        error: '监控目标不存在'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      target
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

// 更新监控目标
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id
    const updates = await request.json()

    const success = monitoringEngine.updateTarget(targetId, updates)

    if (!success) {
      return NextResponse.json({
        success: false,
        error: '监控目标不存在或更新失败'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '监控目标更新成功'
    })

  } catch (error: any) {
    console.error('更新监控目标失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新监控目标失败',
      details: error.message
    }, { status: 500 })
  }
}

// 删除监控目标
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id
    const success = monitoringEngine.removeTarget(targetId)

    if (!success) {
      return NextResponse.json({
        success: false,
        error: '监控目标不存在或删除失败'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '监控目标删除成功'
    })

  } catch (error: any) {
    console.error('删除监控目标失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除监控目标失败',
      details: error.message
    }, { status: 500 })
  }
}

// 启用/禁用监控目标
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id
    const { isActive } = await request.json()

    const success = monitoringEngine.updateTarget(targetId, { isActive })

    if (!success) {
      return NextResponse.json({
        success: false,
        error: '监控目标不存在或更新失败'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `监控目标已${isActive ? '启用' : '禁用'}`
    })

  } catch (error: any) {
    console.error('更新监控目标状态失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新监控目标状态失败',
      details: error.message
    }, { status: 500 })
  }
}