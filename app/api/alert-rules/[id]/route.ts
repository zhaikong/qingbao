import { NextRequest, NextResponse } from 'next/server'
import { monitoringEngine } from '@/lib/real-time-monitoring'

// 获取单个预警规则
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id
    const rules = monitoringEngine.getRules()
    const rule = rules.find(r => r.id === ruleId)

    if (!rule) {
      return NextResponse.json({
        success: false,
        error: '预警规则不存在'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      rule
    })

  } catch (error: any) {
    console.error('获取预警规则失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取预警规则失败',
      details: error.message
    }, { status: 500 })
  }
}

// 更新预警规则
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id
    
    // 获取现有规则
    const rules = monitoringEngine.getRules()
    const existingRule = rules.find(r => r.id === ruleId)
    
    if (!existingRule) {
      return NextResponse.json({
        success: false,
        error: '预警规则不存在'
      }, { status: 404 })
    }

    // 删除旧规则，创建新规则
    monitoringEngine.removeRule(ruleId)
    
    const updates = await request.json()
    const updatedRule = { ...existingRule, ...updates }
    
    const newRuleId = monitoringEngine.addRule(updatedRule)

    return NextResponse.json({
      success: true,
      ruleId: newRuleId,
      message: '预警规则更新成功'
    })

  } catch (error: any) {
    console.error('更新预警规则失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新预警规则失败',
      details: error.message
    }, { status: 500 })
  }
}

// 删除预警规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id
    const success = monitoringEngine.removeRule(ruleId)

    if (!success) {
      return NextResponse.json({
        success: false,
        error: '预警规则不存在或删除失败'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '预警规则删除成功'
    })

  } catch (error: any) {
    console.error('删除预警规则失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除预警规则失败',
      details: error.message
    }, { status: 500 })
  }
}

// 启用/禁用预警规则
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id
    const { isActive } = await request.json()

    // 获取现有规则
    const rules = monitoringEngine.getRules()
    const existingRule = rules.find(r => r.id === ruleId)
    
    if (!existingRule) {
      return NextResponse.json({
        success: false,
        error: '预警规则不存在'
      }, { status: 404 })
    }

    // 删除旧规则，创建新规则
    monitoringEngine.removeRule(ruleId)
    existingRule.isActive = isActive
    
    const newRuleId = monitoringEngine.addRule(existingRule)

    return NextResponse.json({
      success: true,
      ruleId: newRuleId,
      message: `预警规则已${isActive ? '启用' : '禁用'}`
    })

  } catch (error: any) {
    console.error('更新预警规则状态失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新预警规则状态失败',
      details: error.message
    }, { status: 500 })
  }
}