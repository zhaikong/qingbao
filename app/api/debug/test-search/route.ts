import { NextRequest, NextResponse } from 'next/server'
import { intelligentKeywordExpert } from '@/lib/intelligent-keyword-expert'
import { realTimeDataCollector } from '@/lib/real-time-data-collector'

export async function POST(req: NextRequest) {
  try {
    const { topic, analysisType = 'comprehensive' } = await req.json()
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    console.log(`🧪 测试启动: ${topic}`)
    
    // 第一步：测试智能关键词生成
    console.log('🧠 测试智能关键词专家系统...')
    const keywordResult = await intelligentKeywordExpert.generateSearchStrategy(topic, analysisType)
    
    console.log('✅ 关键词策略生成结果:', {
      totalQueries: keywordResult.totalQueries,
      strategies: keywordResult.strategies.map(s => ({
        language: s.language,
        keywords: s.keywords.slice(0, 3), // 只显示前3个
        queries: s.searchQueries.length,
        sources: s.recommendedSources.length
      }))
    })

    // 第二步：测试真实API调用
    console.log('🔍 测试真实多源搜索...')
    const logs: string[] = []
    
    const searchResult = await realTimeDataCollector.collectIntelligenceData(
      topic,
      analysisType as any,
      (log: string, progress: number) => {
        console.log(`📊 [${progress}%] ${log}`)
        logs.push(`[${progress}%] ${log}`)
      }
    )

    console.log('✅ 搜索完成:', {
      totalResults: searchResult.results.length,
      keywordStrategies: searchResult.keywordStrategy.strategies.length,
      collectionMetrics: searchResult.collectionMetrics
    })

    return NextResponse.json({
      success: true,
      topic,
      analysisType,
      executionTime: Date.now(),
      keywordStrategy: {
        totalQueries: keywordResult.totalQueries,
        estimatedResults: keywordResult.estimatedResults,
        strategies: keywordResult.strategies.map(s => ({
          language: s.language,
          keywords: s.keywords,
          searchQueries: s.searchQueries,
          recommendedSources: s.recommendedSources,
          rationale: s.searchRationale
        }))
      },
      searchResults: {
        totalResults: searchResult.results.length,
        resultsBySource: searchResult.results.reduce((acc: any, r) => {
          acc[r.source] = (acc[r.source] || 0) + 1
          return acc
        }, {}),
        sampleResults: searchResult.results.slice(0, 3).map(r => ({
          title: r.title,
          source: r.source,
          relevanceScore: r.relevanceScore,
          credibilityLevel: r.metadata?.credibilityLevel || 'T2'
        }))
      },
      executionLogs: logs,
      collectionMetrics: searchResult.collectionMetrics,
      multiLanguageTest: {
        chinese: keywordResult.strategies.find(s => s.language === '中文')?.keywords || [],
        english: keywordResult.strategies.find(s => s.language === 'English')?.keywords || [],
        arabic: keywordResult.strategies.find(s => s.language === 'العربية')?.keywords || []
      }
    })

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message)
    console.error(error.stack)
    
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: '智能搜索测试API',
    usage: 'POST /api/debug/test-search with { "topic": "your topic", "analysisType": "security|geopolitical|economic|comprehensive" }',
    example: {
      topic: '中东地区最新安全局势',
      analysisType: 'security'
    }
  })
}