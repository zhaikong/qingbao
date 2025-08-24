/**
 * 情报系统TypeScript测试文件
 * 
 * 运行方法: npx tsx test-intelligence-system.ts
 * 或者: npm run test:intelligence
 */

// 确保环境变量正确加载
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { intelligenceManager, comprehensiveIntelligenceAnalysis } from './lib/intelligence-apis/intelligence-manager'

async function testIntelligenceSystem() {
  console.log('🚀 开始测试情报系统...\n')

  try {
    // 1. 检查系统状态
    console.log('📊 检查系统状态...')
    const systemStatus = await intelligenceManager.getSystemStatus()
    console.log(`总提供商: ${systemStatus.totalProviders}`)
    console.log(`可用提供商: ${systemStatus.enabledProviders}`)
    console.log(`系统健康状态: ${systemStatus.overallHealth}`)
    console.log('各类别提供商数量:', systemStatus.providersByCategory)
    
    // 显示详细状态
    console.log('\n📋 提供商详细状态:')
    for (const [name, details] of Object.entries(systemStatus.details)) {
      const status = details.available ? '✅' : '❌'
      console.log(`  ${status} ${name} (${details.category})`)
      if (!details.available && details.error) {
        console.log(`     错误: ${details.error}`)
      }
    }

    // 2. 测试免费API（无需密钥的）
    console.log('\n🆓 测试免费API...')
    
    // 测试CoinGecko（加密货币）
    try {
      console.log('  🔍 测试CoinGecko加密货币查询...')
      const cryptoReport = await intelligenceManager.businessIntelligenceAnalysis('bitcoin')
      console.log(`  ✅ 加密货币分析完成: ${cryptoReport.summary.totalDataPoints} 条数据`)
      
      if (cryptoReport.summary.totalDataPoints > 0) {
        console.log(`     威胁等级: ${cryptoReport.summary.overallThreatLevel}`)
        console.log(`     关键发现: ${cryptoReport.summary.keyFindings.join(', ')}`)
      }
    } catch (error: any) {
      console.log(`  ❌ CoinGecko测试失败: ${error.message}`)
    }

    // 测试REST Countries（国家信息）
    try {
      console.log('  🔍 测试REST Countries国家查询...')
      const geoReport = await intelligenceManager.geopoliticalRiskAnalysis('China')
      console.log(`  ✅ 地缘政治分析完成: ${geoReport.summary.totalDataPoints} 条数据`)
      
      if (geoReport.summary.totalDataPoints > 0) {
        console.log(`     威胁等级: ${geoReport.summary.overallThreatLevel}`)
        console.log(`     影响地区: ${geoReport.dataBreakdown.geopolitical.affectedRegions.join(', ')}`)
      }
    } catch (error: any) {
      console.log(`  ❌ 地缘政治分析测试失败: ${error.message}`)
    }

    // 3. 测试综合查询
    console.log('\n🔍 测试综合情报查询...')
    try {
      const comprehensiveReport = await comprehensiveIntelligenceAnalysis('cybersecurity')
      console.log(`✅ 综合查询完成: ${comprehensiveReport.summary.totalDataPoints} 条数据`)
      console.log(`   执行时间: ${comprehensiveReport.executionTime}ms`)
      console.log(`   威胁等级: ${comprehensiveReport.summary.overallThreatLevel}`)
      console.log(`   平均置信度: ${(comprehensiveReport.summary.averageConfidence * 100).toFixed(1)}%`)
      
      // 显示数据分布
      console.log('\n📊 数据分布:')
      console.log(`   安全情报: ${comprehensiveReport.dataBreakdown.security.count} 条`)
      console.log(`   地缘政治: ${comprehensiveReport.dataBreakdown.geopolitical.count} 条`)
      console.log(`   商业情报: ${comprehensiveReport.dataBreakdown.business.count} 条`)
      console.log(`   新闻情报: ${comprehensiveReport.dataBreakdown.news.count} 条`)
      
      // 显示关联分析
      if (comprehensiveReport.correlations.length > 0) {
        console.log(`\n🔗 发现 ${comprehensiveReport.correlations.length} 个跨域关联:`)
        comprehensiveReport.correlations.slice(0, 3).forEach((corr, index) => {
          console.log(`   ${index + 1}. ${corr.description} (置信度: ${(corr.confidence * 100).toFixed(1)}%)`)
        })
      }
      
      // 显示建议
      if (comprehensiveReport.summary.recommendations.length > 0) {
        console.log('\n💡 系统建议:')
        comprehensiveReport.summary.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`)
        })
      }

    } catch (error: any) {
      console.log(`❌ 综合查询测试失败: ${error.message}`)
    }

    // 4. 显示配置建议
    console.log('\n⚙️ 配置建议:')
    
    const unconfiguredAPIs = []
    const requiredEnvVars = [
      'ALIENVAULT_OTX_API_KEY',
      'VIRUSTOTAL_API_KEY', 
      'ALPHA_VANTAGE_API_KEY',
      'GNEWS_API_TOKEN'
    ]
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar] || process.env[envVar]?.includes('your_')) {
        unconfiguredAPIs.push(envVar)
      }
    }
    
    if (unconfiguredAPIs.length > 0) {
      console.log('   以下API密钥未配置，建议添加以获得完整功能:')
      unconfiguredAPIs.forEach(api => {
        console.log(`   ⚠️  ${api}`)
      })
    } else {
      console.log('   ✅ 所有推荐的API密钥都已配置')
    }

  } catch (error: any) {
    console.error('❌ 测试过程中发生错误:', error.message)
    console.error('详细错误:', error.stack)
  }

  console.log('\n✅ 测试完成!')
}

// 运行测试
if (require.main === module) {
  testIntelligenceSystem().catch(console.error)
}

export { testIntelligenceSystem }