'use client'

import { useState } from 'react'
import { DataSourceStatus } from './DataSourceStatus'
import ReportQualityAssessment from './ReportQualityAssessment'
import { QualityMetrics } from '@/lib/quality-assessment'
import { Report } from '@/lib/data-sources/report-types'

interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
}

export function ReportGeneration() {
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState('')
  const [reportForAssessment, setReportForAssessment] = useState<Report | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [collectedData, setCollectedData] = useState<string[]>([])
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null)
  const [reportMetadata, setReportMetadata] = useState<any>(null)
  const [template, setTemplate] = useState<'comprehensive' | 'brief' | 'technical' | 'policy' | 'market'>('comprehensive')
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'detailed' | 'expert'>('detailed')

  // 根据技术蓝图的硬编码深度研判报告模板
  const reportTemplate = `
# {topic} - 深度研判报告

## 执行摘要
{executive_summary}

## 一、背景与现状分析
### 1.1 议题背景
{background_analysis}

### 1.2 当前态势
{current_situation}

## 二、多维度深度分析
### 2.1 政策层面分析
{policy_analysis}

### 2.2 技术层面分析
{technology_analysis}

### 2.3 经济影响分析
{economic_analysis}

## 三、趋势预测与风险评估
### 3.1 发展趋势预测
{trend_prediction}

### 3.2 潜在风险识别
{risk_assessment}

### 3.3 机遇与挑战
{opportunities_challenges}

## 四、对策建议
### 4.1 短期应对措施
{short_term_recommendations}

### 4.2 中长期战略规划
{long_term_strategy}

## 五、结论
{conclusion}

---
*报告生成时间：{timestamp}*
*数据来源：{data_sources}*
*分析师：AI智能分析系统*
  `

  const generationSteps = [
    { name: 'AI侦察', description: '调用搜索引擎获取相关信息', icon: '🔍' },
    { name: '信息采集', description: '抓取和解析网页内容', icon: '📡' },
    { name: '数据分诊', description: '清洗和结构化处理数据', icon: '🧹' },
    { name: '智能生成', description: 'AI基于真实数据生成报告', icon: '🤖' },
    { name: '完成', description: '报告生成完毕，可进行编辑', icon: '✅' }
  ]

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('请输入分析议题')
      return
    }

    setIsGenerating(true)
    setCurrentStep(0)
    setGeneratedReport('')
    setSearchResults([])
    setCollectedData([])
    setQualityMetrics(null)
    setReportMetadata(null)

    try {
      // 步骤1: 准备生成参数
      setCurrentStep(0)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 步骤2: 调用新的高质量报告生成API
      setCurrentStep(1)
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          template,
          language: 'zh',
          analysisDepth,
          maxDataSources: 15,
          focusAreas: []
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || '报告生成失败')
      }

      // 步骤3: 处理响应数据
      setCurrentStep(2)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '报告生成失败')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      // 步骤4: 设置生成结果
      setCurrentStep(3)
      setGeneratedReport(data.report)
      setReportMetadata(data.metadata)
      setQualityMetrics(data.qualityAssessment)

      // 创建 Report 对象用于质量评估
      const reportObj: Report = {
        id: `report-${Date.now()}`,
        title: topic,
        content: data.report,
        summary: data.report.split('\n').slice(0, 3).join('\n'),
        articles: [],
        summaries: data.report.split('\n\n').map((section: string, index: number) => ({
          id: `summary-${index}`,
          content: section,
          source: 'AI生成',
          timestamp: new Date().toISOString()
        })),
        key_findings: [],
        analysis: data.report,
        metadata: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          word_count: data.report.length,
          source_count: data.metadata?.dataSourceCount || 0
        }
      }
      setReportForAssessment(reportObj)

      // 模拟搜索结果（用于显示）
      if (data.metadata?.dataSources) {
        setSearchResults(data.metadata.dataSources.slice(0, 10))
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      // 步骤5: 完成
      setCurrentStep(4)
      
    } catch (error: any) {
      console.error('报告生成失败:', error)
      alert(`报告生成失败: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // 基于真实数据生成各部分内容的函数
  const generateExecutiveSummary = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `本报告针对"${topic}"进行分析。由于数据采集受限，本次分析基于公开信息和行业通用认知进行。建议配置搜索API以获取更准确的实时数据。`
    }
    
    const keyPoints = extractKeyPoints(data)
    const relevantContent = data.slice(0, 3).map(content => 
      content.split('。')[0].substring(0, 100)
    ).filter(Boolean)
    
    return `基于对${data.length}个权威信源的深度分析，${topic}当前呈现出以下核心特征：${keyPoints.slice(0, 3).join('；')}。通过对收集到的实际数据分析，发现${relevantContent[0] || '相关领域发展迅速'}。本报告通过多维度数据分析，为相关决策提供科学依据和战略建议。`
  }

  const generateBackgroundAnalysis = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `${topic}作为当前重要议题，需要基于实时数据进行深入分析。建议配置相关API密钥以获取最新的背景信息和发展动态。`
    }
    
    const backgroundInfo = data.find(content => 
      content.includes('背景') || content.includes('历史') || content.includes('发展')
    ) || data[0]
    
    const extractedBackground = backgroundInfo.split('。').slice(0, 2).join('。')
    
    return `${topic}作为当前重要议题，其发展背景复杂多元。根据收集到的实际资料显示：${extractedBackground}。通过对${data.length}份资料的分析，可以看出该议题的演进过程体现了多方利益博弈和政策导向的变化。`
  }

  const generateCurrentSituation = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `当前${topic}的具体态势需要基于实时数据进行分析。请配置搜索API以获取最新的发展动态和现状信息。`
    }
    
    const recentDevelopments = extractRecentDevelopments(data)
    const currentInfo = data.find(content => 
      content.includes('当前') || content.includes('现在') || content.includes('目前')
    )
    
    let situationDetails = recentDevelopments
    if (currentInfo) {
      const currentSentence = currentInfo.split('。').find(s => 
        s.includes('当前') || s.includes('现在') || s.includes('目前')
      )
      if (currentSentence) {
        situationDetails += `。${currentSentence}`
      }
    }
    
    return `当前，${topic}正处于关键发展阶段。根据最新收集的信息显示：${situationDetails}。各方立场日趋明确，相关政策措施密集出台，但同时也面临诸多不确定性因素。`
  }

  const generatePolicyAnalysis = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `${topic}的政策分析需要基于最新的政策文件和官方表态。建议配置API以获取实时政策信息。`
    }
    
    const policyContent = data.find(content => 
      content.includes('政策') || content.includes('法规') || content.includes('规定') || content.includes('政府')
    )
    
    let policyDetails = '政策导向明确，支持力度不断加强'
    if (policyContent) {
      const policySentence = policyContent.split('。').find(s => 
        s.includes('政策') || s.includes('法规') || s.includes('规定')
      )
      if (policySentence) {
        policyDetails = policySentence.substring(0, 150)
      }
    }
    
    return `从政策层面分析，相关部门对${topic}给予高度重视。基于收集到的政策文件和官方表态：${policyDetails}。政策实施过程中注重统筹协调，为后续发展奠定了良好的制度基础。`
  }

  const generateTechnologyAnalysis = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `${topic}的技术发展分析需要基于最新的技术报告和行业动态。建议配置API以获取实时技术信息。`
    }
    
    const techContent = data.find(content => 
      content.includes('技术') || content.includes('创新') || content.includes('研发') || content.includes('科技')
    )
    
    let techDetails = '核心技术不断突破，应用场景持续拓展'
    if (techContent) {
      const techSentence = techContent.split('。').find(s => 
        s.includes('技术') || s.includes('创新') || s.includes('研发')
      )
      if (techSentence) {
        techDetails = techSentence.substring(0, 150)
      }
    }
    
    return `技术发展层面，${topic}相关技术呈现快速迭代态势。通过对技术报告和行业动态的分析：${techDetails}。技术生态日趋完善，创新活跃度保持高位，为产业发展提供强劲动力。`
  }

  const generateEconomicAnalysis = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `${topic}的经济影响分析需要基于最新的市场数据和经济指标。建议配置API以获取实时经济信息。`
    }
    
    const economicContent = data.find(content => 
      content.includes('经济') || content.includes('市场') || content.includes('投资') || content.includes('产业')
    )
    
    let economicDetails = '投资热度持续升温，市场规模快速扩张'
    if (economicContent) {
      const economicSentence = economicContent.split('。').find(s => 
        s.includes('经济') || s.includes('市场') || s.includes('投资')
      )
      if (economicSentence) {
        economicDetails = economicSentence.substring(0, 150)
      }
    }
    
    return `经济影响方面，${topic}对相关产业链产生深远影响。根据收集到的市场数据：${economicDetails}。同时，产业结构优化升级，新的商业模式不断涌现，但也需要关注潜在的市场风险。`
  }

  const generateTrendPrediction = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `${topic}的趋势预测需要基于历史数据和当前发展态势。建议配置API以获取更全面的趋势分析数据。`
    }
    
    const trendContent = data.find(content => 
      content.includes('趋势') || content.includes('未来') || content.includes('预测') || content.includes('发展')
    )
    
    let trendDetails = '技术成熟度不断提升，应用领域持续扩大'
    if (trendContent) {
      const trendSentence = trendContent.split('。').find(s => 
        s.includes('趋势') || s.includes('未来') || s.includes('预测')
      )
      if (trendSentence) {
        trendDetails = trendSentence.substring(0, 150)
      }
    }
    
    return `基于当前数据分析，预计未来3-5年${topic}将继续保持快速发展态势。根据收集到的信息：${trendDetails}。国际合作与竞争并存，发展过程中将呈现出更加多元化和专业化的特征。`
  }

  const generateRiskAssessment = (topic: string, data: string[]): string => {
    const risks = identifyRisks(data)
    
    if (data.length === 0) {
      return `${topic}的风险评估需要基于实时数据和专业分析。建议配置API以获取更准确的风险识别信息。主要关注技术发展不及预期、政策环境变化、市场竞争加剧等风险因素。`
    }
    
    const riskContent = data.find(content => 
      content.includes('风险') || content.includes('挑战') || content.includes('问题')
    )
    
    let riskDetails = risks.join('、')
    if (riskContent) {
      const riskSentence = riskContent.split('。').find(s => 
        s.includes('风险') || s.includes('挑战') || s.includes('问题')
      )
      if (riskSentence) {
        riskDetails += `。实际调研发现：${riskSentence.substring(0, 100)}`
      }
    }
    
    return `潜在风险主要包括：${riskDetails}等。这些风险因素相互交织，可能对发展进程产生重要影响。需要建立完善的风险识别、评估和应对机制，确保发展的可持续性。`
  }

  const generateOpportunitiesChallenges = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `${topic}的机遇与挑战分析需要基于全面的市场调研和政策分析。建议配置API以获取更详细的机遇挑战信息。`
    }
    
    const opportunityContent = data.find(content => 
      content.includes('机遇') || content.includes('机会') || content.includes('优势')
    )
    
    let details = '政策支持力度加大、市场需求旺盛、技术创新活跃'
    if (opportunityContent) {
      const opportunitySentence = opportunityContent.split('。').find(s => 
        s.includes('机遇') || s.includes('机会') || s.includes('优势')
      )
      if (opportunitySentence) {
        details = opportunitySentence.substring(0, 150)
      }
    }
    
    return `机遇与挑战并存是${topic}发展的显著特征。根据实际调研：${details}；挑战则包括技术壁垒、国际竞争、监管要求等。需要统筹兼顾，趋利避害。`
  }

  const generateShortTermRecommendations = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `${topic}的短期建议需要基于当前实际情况制定。建议配置API以获取更精准的决策支持信息。`
    }
    
    const actionableInsights = data.slice(0, 2).map(content => {
      const sentences = content.split('。').filter(s => 
        s.includes('建议') || s.includes('应该') || s.includes('需要') || s.includes('重点')
      )
      return sentences[0]
    }).filter(Boolean)
    
    let recommendations = '密切跟踪政策动向，加强技术研发投入，完善产业布局，建立风险防控机制'
    if (actionableInsights.length > 0) {
      recommendations = actionableInsights.join('；')
    }
    
    return `短期内建议重点关注以下方面：基于实际调研结果，${recommendations}。确保及时响应政策变化，提升核心竞争力，优化资源配置，防范潜在风险。`
  }

  const generateLongTermStrategy = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `${topic}的中长期战略规划需要基于深度行业分析和前瞻性研究。建议配置API以获取更全面的战略规划信息。`
    }
    
    const strategicContent = data.find(content => 
      content.includes('战略') || content.includes('规划') || content.includes('长期')
    )
    
    let strategyDetails = '构建完整的发展生态，加强顶层设计，完善制度体系'
    if (strategicContent) {
      const strategySentence = strategicContent.split('。').find(s => 
        s.includes('战略') || s.includes('规划') || s.includes('长期')
      )
      if (strategySentence) {
        strategyDetails = strategySentence.substring(0, 150)
      }
    }
    
    return `中长期战略规划应着眼于构建完整的发展生态。基于调研结果：${strategyDetails}。深化国际合作，拓展发展空间；培育核心竞争力，实现创新驱动；推动可持续发展，实现长期价值创造。`
  }

  const generateConclusion = (topic: string, data: string[]): string => {
    if (data.length === 0) {
      return `综合分析认为，${topic}具有重要的战略意义和发展潜力。建议配置完整的数据采集API以获取更准确的分析结论。`
    }
    
    const conclusiveContent = data.slice(0, 3).map(content => 
      content.split('。')[0]
    ).join('；')
    
    return `综合分析认为，${topic}具有重要的战略意义和广阔的发展前景。基于${data.length}个信源的实际调研：${conclusiveContent.substring(0, 200)}。在政策支持和技术推动下，预计将实现快速健康发展。建议相关部门和机构加强协作，共同推动事业发展。`
  }

  // 辅助函数：从数据中提取关键点
  const extractKeyPoints = (data: string[]): string[] => {
    const keywords = ['发展', '政策', '技术', '市场', '创新', '合作', '挑战', '机遇']
    const points: string[] = []
    
    data.forEach(content => {
      keywords.forEach(keyword => {
        if (content.includes(keyword) && points.length < 5) {
          const sentences = content.split('。').filter(s => s.includes(keyword))
          if (sentences.length > 0) {
            points.push(`${keyword}方面呈现积极态势`)
          }
        }
      })
    })
    
    return points.length > 0 ? points : ['政策环境总体有利', '技术发展势头良好', '市场前景广阔']
  }

  // 辅助函数：提取最新发展动态
  const extractRecentDevelopments = (data: string[]): string => {
    const timeKeywords = ['最新', '近期', '今年', '2024', '2025', '最近']
    let developments = ''
    
    for (const content of data) {
      for (const keyword of timeKeywords) {
        if (content.includes(keyword)) {
          const sentences = content.split('。').filter(s => s.includes(keyword))
          if (sentences.length > 0) {
            developments = sentences[0].substring(0, 100) + '...'
            break
          }
        }
      }
      if (developments) break
    }
    
    return developments || '相关领域出现重要进展，各方关注度持续提升'
  }

  // 辅助函数：识别风险因素
  const identifyRisks = (data: string[]): string[] => {
    const riskKeywords = ['风险', '挑战', '问题', '困难', '不确定', '波动']
    const risks: string[] = []
    
    data.forEach(content => {
      riskKeywords.forEach(keyword => {
        if (content.includes(keyword) && risks.length < 4) {
          risks.push(`${keyword}因素`)
        }
      })
    })
    
    return risks.length > 0 ? risks : ['技术发展不及预期', '政策环境变化', '市场竞争加剧', '国际形势影响']
  }

  const handleExport = () => {
    const blob = new Blob([generatedReport], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic}-深度研判报告.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="fenghuo-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📝</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI报告生成</h1>
            <p className="text-gray-600">基于深度研判模板的智能报告生成</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：输入和控制 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 议题输入 */}
          <div className="fenghuo-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">分析议题</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  请输入要分析的议题 *
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：中美AI领域最新政策对比分析"
                  rows={3}
                  className="fenghuo-textarea w-full"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  报告模板
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as any)}
                  className="fenghuo-select w-full"
                  disabled={isGenerating}
                >
                  <option value="comprehensive">综合分析报告</option>
                  <option value="brief">简要分析报告</option>
                  <option value="technical">技术分析报告</option>
                  <option value="policy">政策分析报告</option>
                  <option value="market">市场分析报告</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分析深度
                </label>
                <select
                  value={analysisDepth}
                  onChange={(e) => setAnalysisDepth(e.target.value as any)}
                  className="fenghuo-select w-full"
                  disabled={isGenerating}
                >
                  <option value="basic">基础分析</option>
                  <option value="detailed">详细分析</option>
                  <option value="expert">专家级分析</option>
                </select>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating}
                className="fenghuo-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="loading-spinner"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    开始生成高质量报告
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 生成进度 */}
          {isGenerating && (
            <div className="fenghuo-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">生成进度</h3>
              <div className="space-y-3">
                {generationSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      index < currentStep
                        ? 'bg-green-50 text-green-800'
                        : index === currentStep
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="text-xl">{step.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{step.name}</div>
                      <div className="text-xs opacity-75">{step.description}</div>
                    </div>
                    {index < currentStep && (
                      <span className="text-green-600">✓</span>
                    )}
                    {index === currentStep && (
                      <div className="loading-spinner"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 数据源状态监控 */}
          <DataSourceStatus onRefresh={() => {
            console.log('数据源状态已刷新')
          }} />

          {/* 模板信息 */}
          <div className="fenghuo-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">使用模板</h3>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-medium text-gray-900">深度研判报告</h4>
                <p className="text-sm text-gray-600 mt-1">
                  包含背景分析、多维度分析、趋势预测、风险评估和对策建议的完整结构
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {['执行摘要', '背景分析', '深度分析', '趋势预测', '对策建议'].map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：报告预览和质量评估 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 报告预览 */}
          <div className="fenghuo-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">报告预览</h2>
              {generatedReport && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="fenghuo-button-secondary"
                  >
                    导出报告
                  </button>
                </div>
              )}
            </div>
            
            {generatedReport ? (
              <div className="prose max-w-none">
                <textarea
                  value={generatedReport}
                  onChange={(e) => setGeneratedReport(e.target.value)}
                  className="w-full h-[600px] p-4 border rounded-md font-mono text-sm"
                />
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">报告内容将在此处显示</p>
              </div>
            )}
          </div>

          {/* 报告质量评估 */}
          {reportForAssessment && (
            <ReportQualityAssessment
              report={reportForAssessment}
              className="mt-6"
            />
          )}

          {/* 数据来源 */}
          {searchResults.length > 0 && (
            <div className="fenghuo-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">数据来源</h3>
              <ul className="space-y-3">
                {searchResults.map((result, index) => (
                  <li key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {result.title}
                    </a>
                    <p className="text-sm text-gray-600 mt-1">{result.snippet}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}