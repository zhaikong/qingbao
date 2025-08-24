import { NextRequest, NextResponse } from 'next/server'
import { monitoringEngine, AlertRule } from '@/lib/real-time-monitoring'

// 添加预警规则
export async function POST(request: NextRequest) {
  try {
    const ruleData = await request.json()
    
    const rule: AlertRule = {
      id: '',
      name: ruleData.name,
      condition: ruleData.condition,
      actions: ruleData.actions || [],
      isActive: ruleData.isActive !== false,
      cooldown: ruleData.cooldown || 300, // 默认5分钟
      lastTriggered: undefined
    }

    // 验证必要字段
    if (!rule.name || !rule.condition) {
      return NextResponse.json({
        success: false,
        error: '预警规则名称和条件不能为空'
      }, { status: 400 })
    }

    const ruleId = monitoringEngine.addRule(rule)

    return NextResponse.json({
      success: true,
      ruleId,
      message: '预警规则添加成功'
    })

  } catch (error: any) {
    console.error('添加预警规则失败:', error)
    return NextResponse.json({
      success: false,
      error: '添加预警规则失败',
      details: error.message
    }, { status: 500 })
  }
}

// 获取预警规则列表
export async function GET(request: NextRequest) {
  try {
    const rules = monitoringEngine.getRules()
    
    return NextResponse.json({
      success: true,
      rules,
      count: rules.length
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