import dotenv from 'dotenv';
// 加载环境变量
dotenv.config({ path: '.env.local' });

async function testMcpSearch() {
  const { chromeMcpIntegration } = await import('./lib/chrome-mcp-integration.ts');
  console.log('🚀 开始测试基于Chrome MCP的X平台实时搜索...');
  const testQuery = "AI in healthcare";

  try {
    const results = await chromeMcpIntegration.accessXPlatform(testQuery);

    if (results && results.length > 0) {
      console.log(`✅ MCP搜索成功，为查询 "${testQuery}" 找到 ${results.length} 条结果:`);
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log('⚠️ MCP搜索完成，但没有返回结果。');
    }
  } catch (error: any) {
    console.error('❌ MCP搜索测试失败:', error.message);
  }
}

testMcpSearch();