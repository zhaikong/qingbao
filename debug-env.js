/**
 * 调试环境变量加载
 */

require('dotenv').config({ path: '.env.local' })

console.log('🔍 调试环境变量加载...\n')

const apiKeys = {
  'ZHIPU_API_KEY': process.env.ZHIPU_API_KEY,
  'ALIENVAULT_OTX_API_KEY': process.env.ALIENVAULT_OTX_API_KEY,
  'VIRUSTOTAL_API_KEY': process.env.VIRUSTOTAL_API_KEY,
  'ABUSEIPDB_API_KEY': process.env.ABUSEIPDB_API_KEY,
  'URLVOID_API_KEY': process.env.URLVOID_API_KEY,
  'GNEWS_API_TOKEN': process.env.GNEWS_API_TOKEN,
  'ALPHA_VANTAGE_API_KEY': process.env.ALPHA_VANTAGE_API_KEY,
  'OPENCORPORATES_API_TOKEN': process.env.OPENCORPORATES_API_TOKEN,
  'POLYGON_API_KEY': process.env.POLYGON_API_KEY
}

for (const [name, value] of Object.entries(apiKeys)) {
  if (value) {
    const isValid = !value.includes('your_') && value.length > 10
    const maskedValue = value.length > 10 ? value.substring(0, 8) + '...' : value
    console.log(`${isValid ? '✅' : '⚠️ '} ${name}: ${maskedValue} ${isValid ? '(有效)' : '(占位符或无效)'}`)
  } else {
    console.log(`❌ ${name}: 未设置`)
  }
}

console.log('\n🔧 测试提供商创建...')

// 模拟提供商创建逻辑
function testProviderCreation() {
  let securityCount = 0
  let newsCount = 0
  let businessCount = 1 // CoinGecko总是可用

  // 安全提供商
  if (process.env.ALIENVAULT_OTX_API_KEY && !process.env.ALIENVAULT_OTX_API_KEY.includes('your_')) securityCount++
  if (process.env.VIRUSTOTAL_API_KEY && !process.env.VIRUSTOTAL_API_KEY.includes('your_')) securityCount++
  if (process.env.ABUSEIPDB_API_KEY && !process.env.ABUSEIPDB_API_KEY.includes('your_')) securityCount++
  if (process.env.URLVOID_API_KEY && !process.env.URLVOID_API_KEY.includes('your_')) securityCount++

  // 新闻提供商
  if (process.env.GNEWS_API_TOKEN && !process.env.GNEWS_API_TOKEN.includes('your_')) newsCount++

  // 商业提供商
  if (process.env.ALPHA_VANTAGE_API_KEY && !process.env.ALPHA_VANTAGE_API_KEY.includes('your_')) businessCount++
  if (process.env.OPENCORPORATES_API_TOKEN && !process.env.OPENCORPORATES_API_TOKEN.includes('your_')) businessCount++
  if (process.env.POLYGON_API_KEY && !process.env.POLYGON_API_KEY.includes('your_')) businessCount++

  console.log(`预期加载结果:`)
  console.log(`  🔒 安全情报提供商: ${securityCount} 个`)
  console.log(`  📰 新闻情报提供商: ${newsCount} 个`)
  console.log(`  💼 商业情报提供商: ${businessCount} 个`)
  console.log(`  🌍 地缘政治提供商: 3 个 (GDELT, REST Countries, World Bank - 免费)`)
  console.log(`  📊 总计: ${securityCount + newsCount + businessCount + 3} 个提供商`)
}

testProviderCreation()