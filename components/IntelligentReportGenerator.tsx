'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataSourceStatus } from './DataSourceStatus'
import ReportQualityAssessment from './ReportQualityAssessment'
import { Report } from '@/lib/data-sources/report-types'

interface IntelligentReportGeneratorProps {
  className?: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  sections: string[]
  suitableFor: string[]
  features: string[]
}

interface GenerationProgress {
  stage: string
  progress: number
  status: 'pending' | 'running' | 'completed' | 'error'
  message: string
  details?: string
}

export function IntelligentReportGenerator({ className }: IntelligentReportGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<any>(null)
  const [reportForAssessment, setReportForAssessment] = useState<Report | null>(null)
  const [progress, setProgress] = useState<GenerationProgress[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('comprehensive')
  const [targetAudience, setTargetAudience] = useState('professional')
  const [analysisDepth, setAnalysisDepth] = useState('expert')
  const [osintIntegration, setOsintIntegration] = useState(true)
  const [semanticAnalysis, setSemanticAnalysis] = useState(true)
  const [reasoning, setReasoning] = useState(true)

  // 报告模板配置
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'comprehensive',
      name: '综合情报分析报告',
      description: '包含背景分析、多维度分析、趋势预测、风险评估的完整报告',
      sections: ['执行摘要', '背景分析', '多源融合分析', '深度语义洞察', '智能推理分析', '趋势预测', '决策建议', '监控框架'],
      suitableFor: ['专业分析师', '决策者', '研究人员'],
      features: ['OSINT集成', '语义分析', '智能推理', '多源融合']
    },
    {
      id: 'osint',
      name: 'OSINT专业情报报告',
      description: '专注于开源情报工具分析的专业报告',
      sections: ['情报摘要', '数据采集概况', '专业工具分析', '关联分析融合', '威胁评估预警', '防御建议对策', '持续监控方案'],
      suitableFor: ['安全分析师', '情报专家', '应急响应团队'],
      features: ['专业OSINT工具', '威胁情报', '攻击面分析', '行为模式识别']
    },
    {
      id: 'executive',
      name: '高层决策简报',
      description: '面向高层决策者的简洁要点报告',
      sections: ['关键要点', '核心发现', '即时建议', '风险警示', '机遇识别', '下一步行动'],
      suitableFor: ['高层管理者', '决策者', '董事会'],
      features: ['精简要点', '决策支持', '风险预警', '行动导向']
    },
    {
      id: 'technical',
      name: '技术分析报告',
      description: '专注于技术细节和实现方案的专业报告',
      sections: ['技术背景', '架构分析', '技术评估', '实现方案', '安全考虑', '性能分析', '部署建议'],
      suitableFor: ['技术团队', '开发人员', '系统架构师'],
      features: ['技术深度', '架构分析', '实现指导', '性能优化']
    },
    {
      id: 'brief',
      name: '简要分析报告',
      description: '快速生成的核心分析报告',
      sections: ['核心要点', '现状分析', '关键发现', '建议措施', '结论'],
      suitableFor: ['一般用户', '快速了解', '初步评估'],
      features: ['快速生成', '核心信息', '实用建议']
    }
  ]

  // 生成进度阶段
  const generationStages = [
    { 
      key: 'data-collection', 
      name: '智能数据采集', 
      description: 'OSINT工具和网络搜索数据收集',
      icon: '📡',
      estimatedTime: '30-60秒'
    },
    { 
      key: 'semantic-analysis', 
      name: '深度语义分析', 
      description: '主题建模、实体识别、情感分析',
      icon: '🧠',
      estimatedTime: '20-40秒'
    },
    { 
      key: 'reasoning-analysis', 
      name: '智能推理分析', 
      description: '模式识别、风险评估、机遇识别',
      icon: '🔍',
      estimatedTime: '15-30秒'
    },
    { 
      key: 'llm-generation', 
      name: 'LLM智能生成', 
      description: '多模型智能分析和报告生成',
      icon: '🤖',
      estimatedTime: '40-80秒'
    },
    { 
      key: 'quality-assessment', 
      name: '质量评估优化', 
      description: '多维度质量评估和内容优化',
      icon: '🔬',
      estimatedTime: '10-20秒'
    },
    { 
      key: 'final-structuring', 
      name: '结构化输出', 
      description: '报告格式化和元数据构建',
      icon: '📝',
      estimatedTime: '5-10秒'
    }
  ]

  // 初始化进度
  const initializeProgress = () => {
    setProgress(generationStages.map(stage => ({
      stage: stage.key,
      progress: 0,
      status: 'pending' as const,
      message: stage.name,
      details: stage.description
    })))
  }

  // 更新进度
  const updateProgress = (stageKey: string, progress: number, status: GenerationProgress['status'], message?: string) => {
    setProgress(prev => prev.map(p => 
      p.stage === stageKey 
        ? { ...p, progress, status, message: message || p.message }
        : p
    ))
  }

  // 生成智能报告
  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('请输入分析议题')
      return
    }

    setIsGenerating(true)
    initializeProgress()
    setGeneratedReport(null)
    setReportForAssessment(null)

    try {
      // 开始生成流程
      updateProgress('data-collection', 10, 'running', '正在启动OSINT工具...')

      // 调用增强智能报告API
      const response = await fetch('/api/enhanced-intelligent-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          template: selectedTemplate,
          language: 'zh',
          targetAudience,
          analysisDepth,
          osintIntegration,
          enableSemanticAnalysis: semanticAnalysis,
          enableReasoning: reasoning,
          dataSources: {
            osintTools: ['shodan', 'otx', 'virustotal'],
            maxSources: 15,
            timeRange: 'month',
            credibilityThreshold: 0.6
          },
          llmConfig: {
            provider: 'zhipu',
            model: 'glm-4',
            temperature: 0.3,
            maxTokens: 4000,
            enableChainOfThought: true
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || '报告生成失败')
      }

      updateProgress('data-collection', 100, 'completed', '数据采集完成')
      updateProgress('semantic-analysis', 50, 'running', '正在进行语义分析...')
      updateProgress('reasoning-analysis', 30, 'running', '启动推理分析...')
      updateProgress('llm-generation', 20, 'running', 'LLM模型分析中...')

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '报告生成失败')
      }

      updateProgress('llm-generation', 100, 'completed', 'LLM生成完成')
      updateProgress('quality-assessment', 80, 'running', '质量评估中...')
      updateProgress('final-structuring', 90, 'running', '结构化输出...')

      await new Promise(resolve => setTimeout(resolve, 1000))

      // 设置生成结果
      setGeneratedReport(data.report)
      
      updateProgress('quality-assessment', 100, 'completed', '质量评估完成')
      updateProgress('final-structuring', 100, 'completed', '报告生成完成')

      // 创建 Report 对象用于质量评估
      const reportObj: Report = {
        id: data.report.metadata.id,
        title: topic,
        content: data.report.content.detailedAnalysis,
        summary: data.report.content.executiveSummary,
        articles: [],
        summaries: [data.report.content.executiveSummary, ...data.report.content.keyFindings].map((content: string, index: number) => ({
          id: `summary-${index}`,
          content,
          source: 'AI生成',
          timestamp: new Date().toISOString()
        })),
        key_findings: data.report.content.keyFindings,
        analysis: data.report.content.detailedAnalysis,
        metadata: {
          created_at: data.report.metadata.generatedAt,
          updated_at: new Date().toISOString(),
          word_count: data.report.content.detailedAnalysis.length,
          source_count: data.report.metadata.dataSources.totalSources
        }
      }
      setReportForAssessment(reportObj)

    } catch (error: any) {
      console.error('报告生成失败:', error)
      alert(`报告生成失败: ${error.message}`)
      
      // 更新错误状态
      const currentStage = progress.find(p => p.status === 'running')
      if (currentStage) {
        updateProgress(currentStage.stage, 0, 'error', `生成失败: ${error.message}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // 导出报告
  const handleExport = () => {
    if (!generatedReport) return

    const reportContent = `# ${generatedReport.metadata.topic} - 智能情报分析报告

## 执行摘要
${generatedReport.content.executiveSummary}

## 关键发现
${generatedReport.content.keyFindings.map((finding: string, index: number) => `${index + 1}. ${finding}`).join('\n')}

## 详细分析
${generatedReport.content.detailedAnalysis}

## 建议措施
${generatedReport.content.recommendations.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n')}

---
**报告元数据**
- 生成时间: ${new Date(generatedReport.metadata.generatedAt).toLocaleString('zh-CN')}
- 数据源数量: ${generatedReport.metadata.dataSources.totalSources}
- OSINT工具: ${generatedReport.metadata.dataSources.osintSources}
- 质量评分: ${generatedReport.metadata.quality.overallScore}/100
- 分析深度: ${generatedReport.metadata.analysis.semanticDepth}
`

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedReport.metadata.topic}-智能情报报告.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const selectedTemplateInfo = reportTemplates.find(t => t.id === selectedTemplate)

  return (
    <div className={`max-w-7xl mx-auto space-y-6 ${className}`}>
      {/* 页面标题 */}
      <div className="fenghuo-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🧠</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">智能情报报告生成</h1>
            <p className="text-gray-600">集成OSINT专业工具和LLM智能分析的专业报告生成系统</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：配置和控制 */}
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
                  placeholder="例如：中美AI领域最新政策对比分析、网络安全威胁态势评估"
                  rows={3}
                  className="fenghuo-textarea w-full"
                  disabled={isGenerating}
                />
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
                    <span>🚀</span>
                    开始生成智能报告
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 报告配置 */}
          <div className="fenghuo-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">报告配置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  报告模板
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="fenghuo-select w-full"
                  disabled={isGenerating}
                >
                  {reportTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标受众
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="fenghuo-select w-full"
                  disabled={isGenerating}
                >
                  <option value="general">一般公众</option>
                  <option value="professional">专业人士</option>
                  <option value="academic">学术研究</option>
                  <option value="executive">高层决策</option>
                  <option value="analyst">情报分析师</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分析深度
                </label>
                <select
                  value={analysisDepth}
                  onChange={(e) => setAnalysisDepth(e.target.value)}
                  className="fenghuo-select w-full"
                  disabled={isGenerating}
                >
                  <option value="basic">基础分析</option>
                  <option value="detailed">详细分析</option>
                  <option value="expert">专家级分析</option>
                  <option value="strategic">战略级分析</option>
                </select>
              </div>
            </div>
          </div>

          {/* 高级功能 */}
          <div className="fenghuo-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">高级功能</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={osintIntegration}
                  onChange={(e) => setOsintIntegration(e.target.checked)}
                  disabled={isGenerating}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">启用OSINT专业工具</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={semanticAnalysis}
                  onChange={(e) => setSemanticAnalysis(e.target.checked)}
                  disabled={isGenerating}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">启用深度语义分析</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reasoning}
                  onChange={(e) => setReasoning(e.target.checked)}
                  disabled={isGenerating}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">启用智能推理分析</span>
              </label>
            </div>
          </div>

          {/* 模板信息 */}
          {selectedTemplateInfo && (
            <div className="fenghuo-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedTemplateInfo.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {selectedTemplateInfo.description}
              </p>
              
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">主要章节：</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplateInfo.sections.slice(0, 5).map((section, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {section}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">特色功能：</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplateInfo.features.map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">适用对象：</h4>
                <div className="text-xs text-gray-600">
                  {selectedTemplateInfo.suitableFor.join('、')}
                </div>
              </div>
            </div>
          )}

          {/* 数据源状态监控 */}
          <DataSourceStatus onRefresh={() => {
            console.log('数据源状态已刷新')
          }} />
        </div>

        {/* 右侧：生成进度和报告预览 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 生成进度 */}
          {isGenerating && (
            <div className="fenghuo-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">生成进度</h3>
              <div className="space-y-4">
                {progress.map((stage, index) => (
                  <div
                    key={stage.stage}
                    className={`p-4 rounded-lg border transition-all ${
                      stage.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : stage.status === 'running'
                        ? 'bg-blue-50 border-blue-200'
                        : stage.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{generationStages.find(s => s.key === stage.stage)?.icon || '⏳'}</span>
                        <div>
                          <div className="font-medium text-gray-900">{stage.message}</div>
                          <div className="text-xs text-gray-500">
                            {generationStages.find(s => s.key === stage.stage)?.estimatedTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stage.status === 'completed' && (
                          <span className="text-green-600">✓</span>
                        )}
                        {stage.status === 'running' && (
                          <div className="loading-spinner"></div>
                        )}
                        {stage.status === 'error' && (
                          <span className="text-red-600">✗</span>
                        )}
                        <span className="text-sm font-medium text-gray-600">
                          {stage.progress}%
                        </span>
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          stage.status === 'completed'
                            ? 'bg-green-500'
                            : stage.status === 'running'
                            ? 'bg-blue-500'
                            : stage.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                        }`}
                        style={{ width: `${stage.progress}%` }}
                      ></div>
                    </div>

                    {stage.status === 'error' && stage.details && (
                      <div className="mt-2 text-sm text-red-600">
                        {stage.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 报告预览 */}
          {generatedReport && (
            <div className="fenghuo-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">报告预览</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="fenghuo-button-secondary"
                  >
                    导出报告
                  </button>
                </div>
              </div>

              {/* 报告元数据 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">报告信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">生成时间</div>
                    <div className="font-medium">
                      {new Date(generatedReport.metadata.generatedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">数据源数量</div>
                    <div className="font-medium">{generatedReport.metadata.dataSources.totalSources}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">质量评分</div>
                    <div className="font-medium">
                      <Badge className={
                        generatedReport.metadata.quality.overallScore >= 85
                          ? 'bg-green-100 text-green-800'
                          : generatedReport.metadata.quality.overallScore >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {generatedReport.metadata.quality.overallScore}/100
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">分析深度</div>
                    <div className="font-medium">{generatedReport.metadata.analysis.semanticDepth}</div>
                  </div>
                </div>
              </div>

              {/* 执行摘要 */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">执行摘要</h3>
                <div className="p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
                  {generatedReport.content.executiveSummary}
                </div>
              </div>

              {/* 关键发现 */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">关键发现</h3>
                <ul className="space-y-2">
                  {generatedReport.content.keyFindings.map((finding: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-700">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 详细分析 */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">详细分析</h3>
                <div className="p-4 border rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {generatedReport.content.detailedAnalysis}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 报告质量评估 */}
          {reportForAssessment && (
            <ReportQualityAssessment
              report={reportForAssessment}
              className="mt-6"
            />
          )}
        </div>
      </div>
    </div>
  )
}