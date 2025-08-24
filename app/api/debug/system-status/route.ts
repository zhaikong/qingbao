import { NextResponse } from 'next/server'

export async function GET() {
  // 检查环境变量配置
  const envCheck = {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    ZHIPU_API_KEY: !!process.env.ZHIPU_API_KEY,
    TWITTER_BEARER_TOKEN: !!process.env.TWITTER_BEARER_TOKEN,
    NEWSAPI_KEY: !!process.env.NEWSAPI_KEY,
    ALIENVAULT_OTX_API_KEY: !!process.env.ALIENVAULT_OTX_API_KEY,
    SHODAN_API_KEY: !!process.env.SHODAN_API_KEY
  }

  // 模拟多语言搜索测试
  const testData = {
    multiLanguageKeywords: {
      chinese: ["中东冲突", "地缘政治", "安全局势"],
      english: ["Middle East conflict", "geopolitical situation", "security crisis"],
      arabic: ["صراع الشرق الأوسط", "الوضع الجيوسياسي", "أزمة الأمن"]
    },
    searchSources: [
      { name: 'Gemini-2.5-Flash', status: envCheck.GEMINI_API_KEY ? 'ready' : 'missing_key', priority: 'high' },
      { name: '智谱AI', status: envCheck.ZHIPU_API_KEY ? 'ready' : 'missing_key', priority: 'high' },
      { name: 'Chrome-MCP-Google', status: 'ready', priority: 'high' },
      { name: 'Chrome-MCP-Bing', status: 'ready', priority: 'medium' },
      { name: 'Twitter-API', status: envCheck.TWITTER_BEARER_TOKEN ? 'ready' : 'missing_key', priority: 'medium' },
      { name: 'NewsAPI', status: envCheck.NEWSAPI_KEY ? 'ready' : 'missing_key', priority: 'medium' },
      { name: 'AlienVault-OTX', status: envCheck.ALIENVAULT_OTX_API_KEY ? 'ready' : 'missing_key', priority: 'low' },
      { name: 'Shodan', status: envCheck.SHODAN_API_KEY ? 'ready' : 'missing_key', priority: 'low' }
    ]
  }

  // 创建测试任务数据
  const testTask = {
    id: 'debug-test-' + Date.now(),
    topic: '中东地区最新安全局势分析',
    type: 'security',
    priority: 'high',
    analysisDepth: 'standard',
    timeRange: 7,
    createdAt: new Date().toISOString()
  }

  console.log('🔍 系统调试信息:')
  console.log('📊 环境变量状态:', envCheck)
  console.log('🌐 数据源状态:', testData.searchSources)
  console.log('🧠 多语言关键词:', testData.multiLanguageKeywords)

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: envCheck,
    dataSources: testData.searchSources,
    multiLanguageSupport: testData.multiLanguageKeywords,
    testTask: testTask,
    systemReady: Object.values(envCheck).filter(Boolean).length >= 2, // 至少需要2个API可用
    recommendations: [
      envCheck.GEMINI_API_KEY ? '✅ Gemini API可用' : '❌ 需要配置GEMINI_API_KEY',
      envCheck.ZHIPU_API_KEY ? '✅ 智谱AI可用' : '❌ 需要配置ZHIPU_API_KEY',
      envCheck.TWITTER_BEARER_TOKEN ? '✅ Twitter API可用' : '⚠️ 建议配置TWITTER_BEARER_TOKEN',
      envCheck.NEWSAPI_KEY ? '✅ NewsAPI可用' : '⚠️ 建议配置NEWSAPI_KEY',
      '🌐 Chrome MCP浏览器搜索始终可用',
      '📱 多语言搜索策略已就绪',
      '🔄 数据处理和AI分析模块已集成'
    ]
  })
}