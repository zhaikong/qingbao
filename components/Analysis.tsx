'use client'

import { useState } from 'react'

export function Analysis() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')

  const analysisTools = [
    {
      id: 'sentiment',
      name: '情感分析',
      description: '分析文本的情感倾向和态度',
      icon: '😊',
      category: 'nlp',
      features: ['正负面情感识别', '情感强度评分', '关键词提取']
    },
    {
      id: 'entity',
      name: '实体识别',
      description: '识别文本中的人名、地名、机构等实体',
      icon: '🏷️',
      category: 'nlp',
      features: ['命名实体识别', '实体关系分析', '实体分类']
    },
    {
      id: 'keyword',
      name: '关键词提取',
      description: '提取文本中的关键词和主题',
      icon: '🔑',
      category: 'nlp',
      features: ['TF-IDF算法', '主题建模', '词频统计']
    },
    {
      id: 'summary',
      name: '文本摘要',
      description: '自动生成文本摘要和要点',
      icon: '📄',
      category: 'nlp',
      features: ['抽取式摘要', '生成式摘要', '多文档摘要']
    },
    {
      id: 'trend',
      name: '趋势分析',
      description: '分析数据的时间序列趋势',
      icon: '📈',
      category: 'analytics',
      features: ['趋势预测', '周期性分析', '异常检测']
    },
    {
      id: 'network',
      name: '关系网络',
      description: '构建和分析实体关系网络',
      icon: '🕸️',
      category: 'analytics',
      features: ['网络图谱', '中心性分析', '社区发现']
    }
  ]

  const handleAnalyze = async () => {
    if (!selectedTool || !analysisData.trim()) {
      alert('请选择分析工具并输入数据')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult('')

    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 根据选择的工具生成模拟结果
    let mockResult = ''
    const tool = analysisTools.find(t => t.id === selectedTool)
    
    switch (selectedTool) {
      case 'sentiment':
        mockResult = `
# 情感分析结果

## 整体情感倾向
- **情感极性**: 正面 (0.72)
- **情感强度**: 中等偏强 (0.68)
- **置信度**: 85%

## 详细分析
- 正面情感词汇: 发展、机遇、创新、突破、优势
- 负面情感词汇: 挑战、风险、困难、问题
- 中性词汇: 分析、研究、数据、报告

## 情感分布
- 正面情感: 45%
- 中性情感: 35%
- 负面情感: 20%

## 关键情感词汇
1. "发展机遇" - 正面 (0.8)
2. "技术创新" - 正面 (0.75)
3. "潜在风险" - 负面 (-0.6)
4. "市场挑战" - 负面 (-0.55)
        `
        break
      case 'entity':
        mockResult = `
# 实体识别结果

## 识别到的实体

### 人名 (PERSON)
- 王分析师 (置信度: 0.95)
- 李研究员 (置信度: 0.88)

### 机构名 (ORG)
- 国家发改委 (置信度: 0.92)
- 中科院 (置信度: 0.89)
- 清华大学 (置信度: 0.91)

### 地名 (GPE)
- 北京 (置信度: 0.94)
- 上海 (置信度: 0.87)
- 深圳 (置信度: 0.83)

### 时间 (DATE)
- 2024年 (置信度: 0.96)
- 近三年 (置信度: 0.78)

### 技术术语 (TECH)
- 人工智能 (置信度: 0.93)
- 大数据 (置信度: 0.85)
- 云计算 (置信度: 0.82)

## 实体关系
- 王分析师 → 工作于 → 中科院
- 人工智能 → 应用于 → 大数据分析
- 北京 → 包含 → 清华大学
        `
        break
      case 'keyword':
        mockResult = `
# 关键词提取结果

## 高频关键词 (TF-IDF)
1. **人工智能** (权重: 0.85)
   - 出现频次: 15次
   - 重要性: 极高
   
2. **技术发展** (权重: 0.72)
   - 出现频次: 12次
   - 重要性: 高
   
3. **政策支持** (权重: 0.68)
   - 出现频次: 9次
   - 重要性: 高
   
4. **市场机遇** (权重: 0.61)
   - 出现频次: 8次
   - 重要性: 中高
   
5. **创新驱动** (权重: 0.58)
   - 出现频次: 7次
   - 重要性: 中高

## 主题聚类
### 主题1: 技术创新 (30%)
- 人工智能、机器学习、深度学习、算法优化

### 主题2: 政策环境 (25%)
- 政策支持、法规完善、标准制定、监管框架

### 主题3: 市场应用 (25%)
- 商业化、产业化、市场需求、应用场景

### 主题4: 发展趋势 (20%)
- 未来展望、发展预测、技术路线、战略规划
        `
        break
      case 'summary':
        mockResult = `
# 文本摘要结果

## 核心摘要 (100字)
当前人工智能技术发展迅速，在政策支持和市场需求双重驱动下，相关产业呈现蓬勃发展态势。技术创新不断突破，应用场景持续拓展，但同时也面临数据安全、算法公平性等挑战，需要建立完善的监管体系。

## 详细摘要 (300字)
人工智能作为新一轮科技革命的核心驱动力，正在深刻改变各行各业的发展模式。在技术层面，深度学习、自然语言处理、计算机视觉等关键技术不断取得突破，模型性能和应用效果显著提升。政策环境方面，国家高度重视AI发展，出台了一系列支持政策，为产业发展提供了良好的制度保障。

市场应用日趋成熟，从智能制造、金融科技到医疗健康、教育培训，AI技术正在各个领域发挥重要作用，创造了巨大的经济价值。同时，产业生态不断完善，形成了从基础设施、核心技术到应用服务的完整产业链。

然而，AI发展也面临诸多挑战，包括数据隐私保护、算法偏见、技术伦理等问题，需要在推动技术创新的同时，加强风险防控和规范治理，确保AI技术健康可持续发展。

## 关键要点
1. 技术突破：核心算法持续优化，性能显著提升
2. 政策支持：国家层面高度重视，政策体系日趋完善
3. 市场应用：应用场景不断拓展，商业价值逐步显现
4. 产业生态：产业链条日趋完整，生态体系不断完善
5. 风险挑战：需要关注伦理风险，加强规范治理
        `
        break
      case 'trend':
        mockResult = `
# 趋势分析结果

## 时间序列分析
- **数据周期**: 2021-2024年
- **趋势方向**: 上升趋势
- **增长率**: 年均增长 23.5%
- **季节性**: 存在明显的季度周期性

## 趋势特征
### 整体趋势
- 2021-2022年: 快速增长期 (增长率 35%)
- 2022-2023年: 稳定发展期 (增长率 18%)
- 2023-2024年: 调整优化期 (增长率 15%)

### 周期性分析
- **季度周期**: Q4通常为高峰期，Q1为低谷期
- **月度周期**: 每月中旬活跃度最高
- **周度周期**: 工作日活跃度高于周末

## 预测结果
### 短期预测 (未来6个月)
- 预期增长率: 12-15%
- 置信区间: [10%, 18%]
- 关键影响因素: 政策变化、市场需求

### 中期预测 (未来1-2年)
- 预期增长率: 8-12%
- 发展阶段: 成熟稳定期
- 主要驱动力: 技术创新、应用拓展

## 异常检测
- 2023年3月: 异常高峰 (可能原因: 政策发布)
- 2023年8月: 异常低谷 (可能原因: 市场调整)
- 2024年1月: 数据异常 (需要进一步验证)

## 风险提示
1. 政策变化可能影响发展趋势
2. 技术瓶颈可能导致增长放缓
3. 市场竞争加剧可能影响增长质量
        `
        break
      case 'network':
        mockResult = `
# 关系网络分析结果

## 网络基本信息
- **节点数量**: 156个
- **边数量**: 342条
- **网络密度**: 0.028
- **平均路径长度**: 3.2
- **聚类系数**: 0.45

## 核心节点分析
### 中心性排名 (Top 10)
1. **人工智能** (中心性: 0.85)
   - 连接度: 23
   - 中介中心性: 0.72
   - 特征向量中心性: 0.91

2. **大数据** (中心性: 0.78)
   - 连接度: 19
   - 中介中心性: 0.65
   - 特征向量中心性: 0.83

3. **云计算** (中心性: 0.71)
   - 连接度: 16
   - 中介中心性: 0.58
   - 特征向量中心性: 0.76

4. **机器学习** (中心性: 0.68)
   - 连接度: 15
   - 中介中心性: 0.52
   - 特征向量中心性: 0.74

5. **深度学习** (中心性: 0.64)
   - 连接度: 14
   - 中介中心性: 0.48
   - 特征向量中心性: 0.69

## 社区发现
### 社区1: 核心技术群 (35个节点)
- 主要节点: 人工智能、机器学习、深度学习
- 内部连接密度: 0.42
- 主要特征: 技术相关性强

### 社区2: 应用场景群 (28个节点)
- 主要节点: 智能制造、金融科技、医疗AI
- 内部连接密度: 0.38
- 主要特征: 应用导向明显

### 社区3: 政策环境群 (22个节点)
- 主要节点: 政策支持、法规制定、标准规范
- 内部连接密度: 0.35
- 主要特征: 制度环境相关

### 社区4: 产业生态群 (31个节点)
- 主要节点: 产业链、生态系统、商业模式
- 内部连接密度: 0.33
- 主要特征: 产业发展相关

## 关键路径分析
### 最短路径 (Top 5)
1. 人工智能 → 机器学习 → 深度学习 (路径长度: 2)
2. 大数据 → 数据挖掘 → 预测分析 (路径长度: 2)
3. 云计算 → 边缘计算 → 物联网 (路径长度: 2)
4. 政策支持 → 产业发展 → 技术创新 (路径长度: 2)
5. 智能制造 → 工业4.0 → 数字化转型 (路径长度: 2)

## 网络演化趋势
- **节点增长**: 每月新增3-5个节点
- **连接增强**: 现有节点间连接不断加强
- **结构优化**: 网络结构趋向更加均衡
- **社区融合**: 不同社区间交互增加
        `
        break
      default:
        mockResult = '分析结果将在此处显示...'
    }

    setAnalysisResult(mockResult)
    setIsAnalyzing(false)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nlp':
        return 'bg-blue-100 text-blue-800'
      case 'analytics':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="fenghuo-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🧠</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">智能分析</h1>
            <p className="text-gray-600">AI驱动的多维度数据分析工具</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：分析工具选择 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 工具选择 */}
          <div className="fenghuo-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">分析工具</h2>
            <div className="space-y-3">
              {analysisTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTool === tool.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{tool.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {tool.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded ${getCategoryColor(tool.category)}`}>
                          {tool.category === 'nlp' ? 'NLP' : '分析'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{tool.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {tool.features.slice(0, 2).map((feature, index) => (
                          <span key={index} className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 数据输入 */}
          <div className="fenghuo-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">数据输入</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分析数据 *
                </label>
                <textarea
                  value={analysisData}
                  onChange={(e) => setAnalysisData(e.target.value)}
                  placeholder="请输入要分析的文本数据..."
                  rows={6}
                  className="fenghuo-textarea w-full"
                  disabled={isAnalyzing}
                />
              </div>
              
              <button
                onClick={handleAnalyze}
                disabled={!selectedTool || !analysisData.trim() || isAnalyzing}
                className="fenghuo-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="loading-spinner"></div>
                    分析中...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    开始分析
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 分析统计 */}
          <div className="fenghuo-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">分析统计</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">今日分析</span>
                <span className="font-semibold text-gray-900">23次</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">本周分析</span>
                <span className="font-semibold text-gray-900">156次</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">常用工具</span>
                <span className="font-semibold text-gray-900">情感分析</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">平均耗时</span>
                <span className="font-semibold text-gray-900">2.3秒</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：分析结果 */}
        <div className="lg:col-span-2">
          <div className="fenghuo-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">分析结果</h2>
              {selectedTool && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">当前工具:</span>
                  <span className="font-medium text-gray-900">
                    {analysisTools.find(t => t.id === selectedTool)?.name}
                  </span>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg h-96 lg:h-[600px] overflow-auto">
              {analysisResult ? (
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                    {analysisResult}
                  </pre>
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-600">正在进行智能分析...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedTool && `使用 ${analysisTools.find(t => t.id === selectedTool)?.name} 分析中`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🧠</div>
                    <p className="text-lg font-medium mb-2">等待分析</p>
                    <p className="text-sm">请选择分析工具并输入数据</p>
                  </div>
                </div>
              )}
            </div>

            {/* MVP说明 */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">💡</span>
                <div className="text-sm text-blue-800">
                  <strong>MVP版本说明：</strong> 当前版本使用模拟的分析结果。
                  正式版本将集成spaCy、Hugging Face Transformers等NLP工具库，提供真实的AI分析能力。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}