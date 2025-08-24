import { NextRequest, NextResponse } from 'next/server'

// API调用日志存储（生产环境应使用数据库）
const apiLogs: Array<{
  timestamp: string
  endpoint: string
  method: string
  status: number
  duration: number
  source: string
  query?: string
  language?: string
  results?: number
}> = []

export async function GET() {
  return NextResponse.json({
    success: true,
    logs: apiLogs.slice(-50), // 返回最近50条日志
    stats: {
      totalCalls: apiLogs.length,
      successRate: apiLogs.filter(log => log.status < 400).length / apiLogs.length,
      averageResponseTime: apiLogs.reduce((sum, log) => sum + log.duration, 0) / apiLogs.length,
      activeSources: [...new Set(apiLogs.map(log => log.source))],
      lastUpdate: new Date().toISOString()
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const logEntry = await req.json()
    
    apiLogs.push({
      timestamp: new Date().toISOString(),
      ...logEntry
    })
    
    // 只保留最近1000条日志
    if (apiLogs.length > 1000) {
      apiLogs.splice(0, apiLogs.length - 1000)
    }
    
    console.log(`📊 API调用记录: [${logEntry.source}] ${logEntry.method} ${logEntry.endpoint} - ${logEntry.status} (${logEntry.duration}ms)`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ API日志记录失败:', error)
    return NextResponse.json({ success: false, error: 'Log recording failed' }, { status: 500 })
  }
}

// 记录API调用的工具函数
export function logApiCall(
  source: string,
  endpoint: string,
  method: string,
  status: number,
  duration: number,
  query?: string,
  language?: string,
  results?: number
) {
  fetch('/api/monitoring/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source,
      endpoint,
      method,
      status,
      duration,
      query,
      language,
      results
    })
  }).catch(console.error)
}