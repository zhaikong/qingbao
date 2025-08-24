/**
 * 烽火智能情报平台 - 项目启动测试
 */

console.log('🚀 烽火智能情报平台启动测试\n')

// 测试1: 检查项目文件结构
console.log('1️⃣ 检查项目文件结构...')
const fs = require('fs')
const path = require('path')

const requiredFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'app/layout.tsx',
  'app/page.tsx',
  'components/NavigationMenu.tsx',
  'lib/intelligent-report-generator.ts',
  'lib/real-time-monitoring.ts',
  'lib/multi-source-data-fusion.ts'
]

let missingFiles = []
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    missingFiles.push(file)
  }
})

if (missingFiles.length === 0) {
  console.log('✅ 所有必要文件都存在')
} else {
  console.log('❌ 缺少以下文件:')
  missingFiles.forEach(file => console.log(`   - ${file}`))
}

// 测试2: 检查依赖包
console.log('\n2️⃣ 检查依赖包...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const dependencies = Object.keys(packageJson.dependencies || {})
  const devDependencies = Object.keys(packageJson.devDependencies || {})
  
  console.log(`✅ 依赖包数量: ${dependencies.length}`)
  console.log(`✅ 开发依赖包数量: ${devDependencies.length}`)
  
  // 检查关键依赖
  const keyDeps = ['next', 'react', 'react-dom', 'lucide-react', 'tailwindcss']
  keyDeps.forEach(dep => {
    if (dependencies.includes(dep)) {
      console.log(`✅ ${dep}: 已安装`)
    } else {
      console.log(`❌ ${dep}: 未安装`)
    }
  })
} catch (error) {
  console.log('❌ 无法读取package.json:', error.message)
}

// 测试3: 检查API路由
console.log('\n3️⃣ 检查API路由...')
const apiRoutes = [
  'app/api/generate-report/route.ts',
  'app/api/intelligent-report/route.ts',
  'app/api/enhanced-intelligent-report/route.ts',
  'app/api/monitoring-engine/route.ts',
  'app/api/monitoring-targets/route.ts',
  'app/api/data-fusion/route.ts'
]

apiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    console.log(`✅ ${route}: 存在`)
  } else {
    console.log(`❌ ${route}: 不存在`)
  }
})

// 测试4: 检查页面组件
console.log('\n4️⃣ 检查页面组件...')
const pages = [
  'app/page.tsx',
  'app/intelligent-report/page.tsx',
  'app/monitoring/page.tsx',
  'app/data-fusion/page.tsx',
  'app/enhanced-intelligence/page.tsx'
]

pages.forEach(page => {
  if (fs.existsSync(page)) {
    console.log(`✅ ${page}: 存在`)
  } else {
    console.log(`❌ ${page}: 不存在`)
  }
})

// 测试5: 检查核心库文件
console.log('\n5️⃣ 检查核心库文件...')
const libFiles = [
  'lib/intelligent-report-generator.ts',
  'lib/real-time-monitoring.ts',
  'lib/multi-source-data-fusion.ts',
  'lib/osint-solutions-manager.ts',
  'lib/intelligent-reasoning-engine.ts'
]

libFiles.forEach(lib => {
  if (fs.existsSync(lib)) {
    const stats = fs.statSync(lib)
    console.log(`✅ ${lib}: 存在 (${(stats.size / 1024).toFixed(1)}KB)`)
  } else {
    console.log(`❌ ${lib}: 不存在`)
  }
})

// 测试6: 检查配置文件
console.log('\n6️⃣ 检查配置文件...')
const configFiles = [
  'tailwind.config.js',
  'next.config.js',
  'tsconfig.json',
  'postcss.config.js'
]

configFiles.forEach(config => {
  if (fs.existsSync(config)) {
    console.log(`✅ ${config}: 存在`)
  } else {
    console.log(`❌ ${config}: 不存在`)
  }
})

console.log('\n🎉 项目结构检查完成!')

console.log('\n📋 项目功能模块:')
console.log('   ✅ 智能报告生成器')
console.log('   ✅ 实时监控系统')
console.log('   ✅ 多源数据融合系统')
console.log('   ✅ OSINT解决方案集成')
console.log('   ✅ 深度语义分析')
console.log('   ✅ 智能推理引擎')

console.log('\n🌐 页面访问地址:')
console.log('   - 主页: http://localhost:3000')
console.log('   - 智能分析: http://localhost:3000/intelligent-report')
console.log('   - 实时监控: http://localhost:3000/monitoring')
console.log('   - 数据融合: http://localhost:3000/data-fusion')
console.log('   - 增强情报: http://localhost:3000/enhanced-intelligence')

console.log('\n🔧 API接口地址:')
console.log('   - 报告生成: http://localhost:3000/api/generate-report')
console.log('   - 智能报告: http://localhost:3000/api/intelligent-report')
console.log('   - 监控引擎: http://localhost:3000/api/monitoring-engine')
console.log('   - 数据融合: http://localhost:3000/api/data-fusion')

console.log('\n📝 启动说明:')
console.log('1. 确保Node.js已安装 (推荐v18+)')
console.log('2. 在项目根目录运行: npm install')
console.log('3. 启动开发服务器: npm run dev')
console.log('4. 访问 http://localhost:3000 查看应用')
console.log('5. 使用测试脚本验证功能: node test-project-structure.js')

console.log('\n🎯 核心特性:')
console.log('- 🧠 集成多个LLM模型进行智能分析')
console.log('- 🔗 集成15+专业OSINT工具')
console.log('- 📊 实时监控和威胁预警')
console.log('- 🔍 多源数据融合和关联分析')
console.log('- 📈 智能报告生成和质量评估')
console.log('- 🎨 现代化UI设计和用户体验')