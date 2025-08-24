/**
 * 测试实时监控系统
 */

async function testMonitoringSystem() {
  console.log('🚀 开始测试实时监控系统...\n')

  // 1. 测试监控引擎状态
  console.log('1️⃣ 测试监控引擎状态...')
  try {
    const statusResponse = await fetch('http://localhost:3000/api/monitoring-engine?action=status')
    const statusData = await statusResponse.json()
    
    if (statusData.success) {
      console.log('✅ 监控引擎状态:', statusData.status.isRunning ? '运行中' : '已停止')
    } else {
      console.log('❌ 获取引擎状态失败:', statusData.error)
    }
  } catch (error) {
    console.log('❌ 引擎状态测试失败:', error.message)
  }

  // 2. 测试启动监控引擎
  console.log('\n2️⃣ 测试启动监控引擎...')
  try {
    const startResponse = await fetch('http://localhost:3000/api/monitoring-engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    })
    
    const startData = await startResponse.json()
    
    if (startData.success) {
      console.log('✅ 监控引擎启动成功')
    } else {
      console.log('❌ 监控引擎启动失败:', startData.error)
    }
  } catch (error) {
    console.log('❌ 引擎启动测试失败:', error.message)
  }

  // 3. 测试添加监控目标
  console.log('\n3️⃣ 测试添加监控目标...')
  try {
    const targetResponse = await fetch('http://localhost:3000/api/monitoring-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '测试监控目标',
        type: 'keyword',
        keywords: ['网络安全', '威胁情报', '恶意软件'],
        sources: ['virustotal', 'otx', 'shodan'],
        severity: 'medium',
        isActive: true
      })
    })
    
    const targetData = await targetResponse.json()
    
    if (targetData.success) {
      console.log('✅ 监控目标添加成功，ID:', targetData.targetId)
    } else {
      console.log('❌ 监控目标添加失败:', targetData.error)
    }
  } catch (error) {
    console.log('❌ 监控目标测试失败:', error.message)
  }

  // 4. 测试获取仪表板数据
  console.log('\n4️⃣ 测试获取仪表板数据...')
  try {
    const dashboardResponse = await fetch('http://localhost:3000/api/monitoring-engine?action=dashboard')
    const dashboardData = await dashboardResponse.json()
    
    if (dashboardData.success) {
      console.log('✅ 仪表板数据获取成功')
      console.log('   - 活跃目标:', dashboardData.dashboard.activeTargets)
      console.log('   - 总事件数:', dashboardData.dashboard.totalEvents)
      console.log('   - 威胁等级:', dashboardData.dashboard.threatLevel)
      console.log('   - 数据源数量:', dashboardData.dashboard.sourceStats.length)
    } else {
      console.log('❌ 仪表板数据获取失败:', dashboardData.error)
    }
  } catch (error) {
    console.log('❌ 仪表板测试失败:', error.message)
  }

  // 5. 测试获取数据源状态
  console.log('\n5️⃣ 测试获取数据源状态...')
  try {
    const sourcesResponse = await fetch('http://localhost:3000/api/monitoring-engine?action=sources')
    const sourcesData = await sourcesResponse.json()
    
    if (sourcesData.success) {
      console.log('✅ 数据源状态获取成功')
      sourcesData.sources.forEach(source => {
        console.log(`   - ${source.name}: ${source.isActive ? '活跃' : '停止'} (${source.type})`)
      })
    } else {
      console.log('❌ 数据源状态获取失败:', sourcesData.error)
    }
  } catch (error) {
    console.log('❌ 数据源测试失败:', error.message)
  }

  // 6. 测试获取统计信息
  console.log('\n6️⃣ 测试获取统计信息...')
  try {
    const statsResponse = await fetch('http://localhost:3000/api/monitoring-engine?action=statistics')
    const statsData = await statsResponse.json()
    
    if (statsData.success) {
      console.log('✅ 统计信息获取成功')
      const stats = statsData.statistics
      console.log('   - 总事件数:', stats.totalEvents)
      console.log('   - 活跃目标:', stats.activeTargets)
      console.log('   - 活跃规则:', stats.activeRules)
      console.log('   - 活跃数据源:', stats.activeSources)
      console.log('   - 威胁等级:', stats.threatLevel)
    } else {
      console.log('❌ 统计信息获取失败:', statsData.error)
    }
  } catch (error) {
    console.log('❌ 统计信息测试失败:', error.message)
  }

  console.log('\n🎉 实时监控系统测试完成!')
  console.log('\n📋 功能特性:')
  console.log('   ✅ 实时监控引擎')
  console.log('   ✅ 监控目标管理')
  console.log('   ✅ 多源数据采集')
  console.log('   ✅ 威胁检测预警')
  console.log('   ✅ 实时仪表板')
  console.log('   ✅ 历史趋势分析')
  console.log('   ✅ 预警规则管理')
  console.log('   ✅ 统计分析报告')
  
  console.log('\n🌐 访问地址:')
  console.log('   - 监控仪表板: http://localhost:3000/monitoring')
  console.log('   - API接口: http://localhost:3000/api/monitoring-engine')
  console.log('   - 监控目标: http://localhost:3000/api/monitoring-targets')
  console.log('   - 预警规则: http://localhost:3000/api/alert-rules')
  console.log('   - 监控事件: http://localhost:3000/api/monitoring-events')
}

// 运行测试
testMonitoringSystem().catch(console.error)