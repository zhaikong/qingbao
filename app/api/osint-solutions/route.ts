import { NextRequest, NextResponse } from 'next/server';
import { osintSolutionsManager } from '@/lib/osint-solutions-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const useCase = searchParams.get('useCase');

    if (useCase) {
      // 获取推荐工具
      const recommendedTools = osintSolutionsManager.getRecommendedTools(useCase);
      return NextResponse.json({
        success: true,
        useCase,
        recommendedTools,
        count: recommendedTools.length
      });
    }

    // 获取可用工具
    const tools = osintSolutionsManager.getAvailableTools(category || undefined);
    
    return NextResponse.json({
      success: true,
      tools,
      count: tools.length,
      category: category || 'all'
    });

  } catch (error) {
    console.error('OSINT tools error:', error);
    return NextResponse.json({ 
      error: 'Failed to get OSINT tools',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolId, query, options = {}, batch = false } = body;

    if (!toolId || !query) {
      return NextResponse.json({ 
        error: 'Tool ID and query are required' 
      }, { status: 400 });
    }

    if (batch) {
      // 批量查询
      const queries = body.queries || [];
      if (!Array.isArray(queries) || queries.length === 0) {
        return NextResponse.json({ 
          error: 'Queries array is required for batch mode' 
        }, { status: 400 });
      }

      const results = await osintSolutionsManager.executeBatchQuery(queries);
      
      return NextResponse.json({
        success: true,
        batch: true,
        results,
        totalQueries: queries.length,
        successfulQueries: results.filter(r => r.metadata.success).length,
        failedQueries: results.filter(r => !r.metadata.success).length
      });
    } else {
      // 单个查询
      const result = await osintSolutionsManager.executeOSINTQuery(toolId, query, options);
      
      return NextResponse.json({
        success: true,
        batch: false,
        result
      });
    }

  } catch (error) {
    console.error('OSINT query error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute OSINT query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 清理缓存
    osintSolutionsManager.clearCache();
    
    return NextResponse.json({
      success: true,
      message: 'OSINT cache cleared successfully'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}