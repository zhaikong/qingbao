/**
 * 测试多源数据融合系统
 */

async function testDataFusionSystem() {
  console.log('🚀 开始测试多源数据融合系统...\n')

  // 1. 测试融合系统状态
  console.log('1️⃣ 测试融合系统状态...')
  try {
    const statusResponse = await fetch('http://localhost:3000/api/data-fusion?action=status')
    const statusData = await statusResponse.json()
    
    if (statusData.success) {
      console.log('✅ 融合系统状态正常')
      console.log('   - 实体数量:', statusData.status.entities)
      console.log('   - 关系数量:', statusData.status.relationships)
      console.log('   - 数据源数量:', statusData.status.dataSources)
    } else {
      console.log('❌ 获取融合系统状态失败:', statusData.error)
    }
  } catch (error) {
    console.log('❌ 融合系统状态测试失败:', error.message)
  }

  // 2. 测试数据源状态
  console.log('\n2️⃣ 测试数据源状态...')
  try {
    const sourcesResponse = await fetch('http://localhost:3000/api/data-fusion?action=sources')
    const sourcesData = await sourcesResponse.json()
    
    if (sourcesData.success) {
      console.log('✅ 数据源状态获取成功')
      sourcesData.sources.forEach(source => {
        console.log(`   - ${source.name}: 可信度 ${(source.credibility * 100).toFixed(1)}%`)
      })
    } else {
      console.log('❌ 数据源状态获取失败:', sourcesData.error)
    }
  } catch (error) {
    console.log('❌ 数据源状态测试失败:', error.message)
  }

  // 3. 测试数据融合处理
  console.log('\n3️⃣ 测试数据融合处理...')
  try {
    const testData = [
      {
        source: 'virustotal',
        entities: [
          {
            type: 'ip',
            value: '192.168.1.100',
            confidence: 0.9,
            attributes: { malicious: true, detections: 5 },
            tags: ['malicious', 'c2']
          },
          {
            type: 'domain',
            value: 'example-malicious.com',
            confidence: 0.8,
            attributes: { category: 'phishing' },
            tags: ['suspicious']
          }
        ],
        content: '检测到恶意IP 192.168.1.100 和域名 example-malicious.com'
      },
      {
        source: 'otx',
        entities: [
          {
            type: 'ip',
            value: '192.168.1.100',
            confidence: 0.85,
            attributes: { threat_type: 'botnet' },
            tags: ['botnet', 'compromised']
          },
          {
            type: 'domain',
            value: 'example-malicious.com',
            confidence: 0.75,
            attributes: { threat_actor: 'APT_GROUP' },
            tags: ['apt', 'targeted']
          }
        ],
        content: 'OTX报告显示IP 192.168.1.100 涉嫌僵尸网络活动'
      },
      {
        source: 'shodan',
        entities: [
          {
            type: 'ip',
            value: '10.0.0.50',
            confidence: 0.95,
            attributes: { port: 80, service: 'http' },
            tags: ['web_server', 'exposed']
          }
        ],
        content: 'Shodan发现暴露的Web服务器 10.0.0.50'
      }
    ]

    const fusionResponse = await fetch('http://localhost:3000/api/data-fusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: testData })
    })

    const fusionData = await fusionResponse.json()
    
    if (fusionData.success) {
      console.log('✅ 数据融合处理成功')
      console.log('   - 处理时间:', fusionData.metadata.processingTime, 'ms')
      console.log('   - 输入数据量:', fusionData.metadata.inputSize)
      console.log('   - 输出实体数:', fusionData.metadata.outputEntities)
      console.log('   - 输出关系数:', fusionData.metadata.outputRelationships)
      console.log('   - 输出集群数:', fusionData.metadata.outputClusters)
      console.log('   - 输出洞察数:', fusionData.metadata.outputInsights)
      
      // 显示融合结果统计
      const stats = fusionData.result.statistics
      console.log('\n   📊 融合统计:')
      console.log('   - 实体类型分布:', stats.entityTypes)
      console.log('   - 关系类型分布:', stats.relationshipTypes)
      console.log('   - 置信度分布:', stats.confidenceDistribution)
      console.log('   - 时间范围:', stats.temporalRange.start, '至', stats.temporalRange.end)
      
      // 显示洞察
      if (fusionData.result.insights.length > 0) {
        console.log('\n   💡 发现的洞察:')
        fusionData.result.insights.forEach((insight, index) => {
          console.log(`   ${index + 1}. ${insight.title}`)
          console.log(`      - 类型: ${insight.type}`)
          console.log(`      - 影响: ${insight.impact}`)
          console.log(`      - 置信度: ${(insight.confidence * 100).toFixed(1)}%`)
        })
      }
      
    } else {
      console.log('❌ 数据融合处理失败:', fusionData.error)
    }
  } catch (error) {
    console.log('❌ 数据融合处理测试失败:', error.message)
  }

  // 4. 测试融合数据源管理
  console.log('\n4️⃣ 测试融合数据源管理...')
  try {
    const newSource = {
      id: 'test_source',
      name: '测试数据源',
      type: 'api',
      credibility: 0.8,
      freshness: 0.9,
      coverage: 0.7,
      metadata: { test: true }
    }

    const addSourceResponse = await fetch('http://localhost:3000/api/fusion-data-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSource)
    })

    const addSourceData = await addSourceResponse.json()
    
    if (addSourceData.success) {
      console.log('✅ 融合数据源添加成功')
      
      // 获取数据源列表
      const sourcesResponse = await fetch('http://localhost:3000/api/fusion-data-sources')
      const sourcesData = await sourcesResponse.json()
      
      if (sourcesData.success) {
        console.log('✅ 融合数据源列表获取成功')
        console.log('   - 数据源总数:', sourcesData.count)
        console.log('   - 最新添加:', sourcesData.sources[sourcesData.sources.length - 1]?.name)
      }
    } else {
      console.log('❌ 融合数据源添加失败:', addSourceData.error)
    }
  } catch (error) {
    console.log('❌ 融合数据源管理测试失败:', error.message)
  }

  console.log('\n🎉 多源数据融合系统测试完成!')
  console.log('\n📋 功能特性:')
  console.log('   ✅ 多源数据采集和预处理')
  console.log('   ✅ 智能实体解析和去重')
  console.log('   ✅ 关系网络构建和分析')
  console.log('   ✅ 时空模式识别和异常检测')
  console.log('   ✅ 实体聚类和集群分析')
  console.log('   ✅ 置信度评估和质量过滤')
  console.log('   ✅ 智能洞察生成和建议')
  console.log('   ✅ 可视化结果展示')
  
  console.log('\n🌐 访问地址:')
  console.log('   - 数据融合仪表板: http://localhost:3000/data-fusion')
  console.log('   - 融合处理API: http://localhost:3000/api/data-fusion')
  console.log('   - 数据源管理: http://localhost:3000/api/fusion-data-sources')
  
  console.log('\n🔧 核心算法:')
  console.log('   - 实体解析: 模糊匹配、时空关联')
  console.log('   - 关系发现: 多种关系类型推断')
  console.log('   - 聚类分析: 基于图论的实体聚类')
  console.log('   - 时空分析: 时间模式、空间分布')
  console.log('   - 置信度评估: 多维度质量评分')
  console.log('   - 洞察生成: 基于规则的智能分析')
}

// 运行测试
testDataFusionSystem().catch(console.error)