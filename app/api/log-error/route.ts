import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()
    
    // 记录错误信息
    console.error('🚨 前端错误报告:', {
      timestamp: errorData.timestamp,
      message: errorData.message,
      url: errorData.url,
      userAgent: errorData.userAgent,
      stack: errorData.stack?.substring(0, 1000), // 限制堆栈长度
      componentStack: errorData.componentStack?.substring(0, 500)
    })

    // 在生产环境中，这里可以集成到错误监控服务
    // 如 Sentry, LogRocket, Bugsnag 等
    if (process.env.NODE_ENV === 'production') {
      // 示例：发送到外部监控服务
      // await sendToMonitoringService(errorData)
    }

    // 可以选择将错误存储到数据库
    // await storeErrorInDatabase(errorData)

    return NextResponse.json({
      success: true,
      message: '错误已记录',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ 错误日志记录失败:', error)
    
    return NextResponse.json(
      { 
        error: '错误日志记录失败',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// 获取错误统计信息（仅开发环境）
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '仅在开发环境可用' },
      { status: 403 }
    )
  }

  try {
    // 返回错误监控状态
    return NextResponse.json({
      status: 'active',
      environment: process.env.NODE_ENV,
      errorLogging: {
        enabled: true,
        storage: 'console', // 可以是 'database', 'external-service' 等
        retention: '7 days'
      },
      monitoring: {
        frontend: true,
        backend: true,
        database: false // 需要配置数据库监控
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: '获取错误监控状态失败', details: error.message },
      { status: 500 }
    )
  }
}