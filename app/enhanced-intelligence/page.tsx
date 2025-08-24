'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import IntelligentProgressDisplay from '@/components/IntelligentProgressDisplay'

interface EnhancedIntelligenceReport {
  id: string
  query: string
  timestamp: string
  analysisDepth: string
  targetAudience: string
  urgencyLevel: string
  summary: {
    totalDataPoints: number
    highRiskItems: number
    correlations: number
    threatIndicators: number
    averageConfidence: number
  }
  keyFindings: string[]
  recommendations: string[]
  correlations: Array<{
    id: string
    patternName: string
    severity: string
    confidence: number
    description: string
    evidence: string[]
  }>
  threatIntelligence: Array<{
    threatType: string
    indicators: string[]
    timeline: Array<{
      timestamp: string
      event: string
    }>
    attackPatterns: string[]
    impactAssessment: {
      potentialImpact: string
      likelihood: number
    }
  }>
  detailedAnalysis: Array<{
    id: string
    title: string
    source: string
    type: string
    riskLevel: string
    priority: number
    sentiment: string
    mainTopic: string
    keyEntities: string[]
    summary: string
    insights: string[]
  }>
  sourceStatus: Array<{
    id: string
    name: string
    enabled: boolean
    credibility: number
    category: string
  }>
  systemStats: {
    totalSources: number
    enabledSources: number
    totalCollections: number
    averageCredibility: number
  }
}

export default function EnhancedIntelligencePage() {
  const [query, setQuery] = useState('')
  const [analysisDepth, setAnalysisDepth] = useState('detailed')
  const [targetAudience, setTargetAudience] = useState('professional')
  const [urgencyLevel, setUrgencyLevel] = useState('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [report, setReport] = useState<EnhancedIntelligenceReport | null>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // 获取系统状态
    fetchSystemStatus()
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/enhanced-intelligence')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    }
  }

  const handleGenerateReport = async () => {
    if (!query.trim()) {
      setError('请输入分析查询')
      return
    }

    setIsGenerating(true)
    setShowProgress(true)
    setError('')
    setReport(null)

    try {
      const response = await fetch('/api/enhanced-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          analysisDepth,
          targetAudience,
          urgencyLevel
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReport(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || '生成报告失败')
      }
    } catch (error) {
      console.error('生成报告时出错:', error)
      setError(`生成报告失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsGenerating(false)
      setShowProgress(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-400/30'
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'low': return 'bg-green-500/20 text-green-300 border-green-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const handleProgressComplete = (reportData: any) => {
    if (reportData && reportData.success) {
      setReport(reportData)
    }
    setIsGenerating(false)
    setShowProgress(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🚀 增强型智能情报分析系统
          </h1>
          <p className="text-xl text-white/80 mb-6">
            实时多源情报收集 • 深度语义分析 • 智能推理关联
          </p>
          <div className="flex justify-center space-x-4">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
              多源实时数据
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
              深度语义理解
            </Badge>
            <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
              智能推理引擎
            </Badge>
            <Badge className="bg-red-500/20 text-red-300 border-red-400/30">
              威胁情报关联
            </Badge>
          </div>
        </div>

        {/* 系统状态 */}
        {systemStatus && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">🔧 系统状态</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {systemStatus.statistics?.enabledSources || 0}/{systemStatus.statistics?.totalSources || 0}
                  </div>
                  <div className="text-white/70 text-sm">数据源激活</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {systemStatus.statistics?.totalCollections || 0}
                  </div>
                  <div className="text-white/70 text-sm">数据采集</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {systemStatus.activeCorrelations || 0}
                  </div>
                  <div className="text-white/70 text-sm">活跃关联</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {systemStatus.threatIntelligence || 0}
                  </div>
                  <div className="text-white/70 text-sm">威胁指标</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl lg:col-span-2">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                🎯 情报分析配置
              </h2>
              
              {error && (
                <Alert className="mb-6 bg-red-500/20 border-red-400/30">
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/90 font-medium mb-2">
                    分析查询
                  </label>
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="请输入要分析的情报查询，例如：网络安全威胁、地缘政治风险、商业情报等..."
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/90 font-medium mb-2">
                      分析深度
                    </label>
                    <Select value={analysisDepth} onValueChange={setAnalysisDepth}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">基础分析</SelectItem>
                        <SelectItem value="detailed">详细分析</SelectItem>
                        <SelectItem value="expert">专家分析</SelectItem>
                        <SelectItem value="strategic">战略分析</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-white/90 font-medium mb-2">
                      目标受众
                    </label>
                    <Select value={targetAudience} onValueChange={setTargetAudience}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">普通用户</SelectItem>
                        <SelectItem value="professional">专业人士</SelectItem>
                        <SelectItem value="academic">学术研究</SelectItem>
                        <SelectItem value="executive">管理层</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-white/90 font-medium mb-2">
                      紧急程度
                    </label>
                    <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="critical">紧急</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>AI正在深度分析...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>🚀</span>
                      <span>启动增强分析</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                📊 分析能力
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-300">🔍</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">多源数据采集</div>
                    <div className="text-white/60 text-sm">权威情报源实时收集</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-300">🧠</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">深度语义分析</div>
                    <div className="text-white/60 text-sm">实体识别、情感分析、主题建模</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-green-300">🔗</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">智能推理关联</div>
                    <div className="text-white/60 text-sm">模式识别、威胁关联、知识图谱</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-red-300">⚠️</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">风险评估</div>
                    <div className="text-white/60 text-sm">威胁情报、影响评估、归因分析</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-300">📈</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">可视化报告</div>
                    <div className="text-white/60 text-sm">智能洞察、行动建议</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 分析结果 */}
        {report && (
          <div className="mt-8 space-y-8">
            {/* 概览统计 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">📈 分析概览</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {report.summary.totalDataPoints}
                    </div>
                    <div className="text-white/70 text-sm">数据点</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">
                      {report.summary.highRiskItems}
                    </div>
                    <div className="text-white/70 text-sm">高风险项</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {report.summary.correlations}
                    </div>
                    <div className="text-white/70 text-sm">关联模式</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">
                      {report.summary.threatIndicators}
                    </div>
                    <div className="text-white/70 text-sm">威胁指标</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {(report.summary.averageConfidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-white/70 text-sm">平均置信度</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 关键发现 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">🔍 关键发现</h2>
                <div className="space-y-3">
                  {report.keyFindings.map((finding, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 text-white/90">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-300 text-sm">•</span>
                        </div>
                        <div>{finding}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 关联模式 */}
            {report.correlations.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">🔗 关联模式</h2>
                  <div className="space-y-4">
                    {report.correlations.map((correlation, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-medium">{correlation.patternName}</h3>
                          <Badge className={getSeverityColor(correlation.severity)}>
                            {correlation.severity}
                          </Badge>
                        </div>
                        <p className="text-white/70 text-sm mb-3">{correlation.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-white/60 text-xs">
                            置信度: {(correlation.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-white/60 text-xs">
                            证据: {correlation.evidence.length} 项
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* 威胁情报 */}
            {report.threatIntelligence.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">⚠️ 威胁情报</h2>
                  <div className="space-y-4">
                    {report.threatIntelligence.map((threat, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-medium">{threat.threatType}</h3>
                          <Badge className="bg-red-500/20 text-red-300 border-red-400/30">
                            威胁级别: {threat.impactAssessment.potentialImpact}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-white/60 text-sm mb-1">影响可能性</div>
                            <Progress value={threat.impactAssessment.likelihood * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="text-white/60 text-sm mb-1">攻击模式</div>
                            <div className="flex flex-wrap gap-1">
                              {threat.attackPatterns.slice(0, 3).map((pattern, i) => (
                                <Badge key={i} className="bg-orange-500/20 text-orange-300 text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-white/60 text-sm">
                          指标数量: {threat.indicators.length} | 时间线事件: {threat.timeline.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* 详细分析 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">📋 详细分析</h2>
                <div className="space-y-4">
                  {report.detailedAnalysis.slice(0, 5).map((analysis, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">{analysis.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRiskColor(analysis.riskLevel)}>
                            {analysis.riskLevel}
                          </Badge>
                          <Badge className="bg-blue-500/20 text-blue-300">
                            {analysis.source}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mb-3">{analysis.summary}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-white/60 text-xs">主要主题</div>
                          <div className="text-white/90 text-sm">{analysis.mainTopic}</div>
                        </div>
                        <div>
                          <div className="text-white/60 text-xs">情感倾向</div>
                          <div className="text-white/90 text-sm">{analysis.sentiment}</div>
                        </div>
                        <div>
                          <div className="text-white/60 text-xs">优先级</div>
                          <div className="text-white/90 text-sm">{(analysis.priority * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 行动建议 */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">💡 行动建议</h2>
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-green-500/10 border border-green-400/20 rounded-lg p-4 text-green-200">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-green-300 text-sm">✓</span>
                        </div>
                        <div>{recommendation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-white font-bold mb-2">实时数据采集</h3>
              <p className="text-white/70 text-sm">
                多个权威情报源并行采集，确保数据实时性和准确性
              </p>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-white font-bold mb-2">深度语义理解</h3>
              <p className="text-white/70 text-sm">
                AI驱动的实体识别、情感分析和主题建模
              </p>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-white font-bold mb-2">智能推理关联</h3>
              <p className="text-white/70 text-sm">
                基于知识图谱的模式识别和威胁关联分析
              </p>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-white font-bold mb-2">智能报告生成</h3>
              <p className="text-white/70 text-sm">
                自动生成结构化分析报告和行动建议
              </p>
            </div>
          </Card>
        </div>
      </div>

      {showProgress && (
        <IntelligentProgressDisplay 
          onComplete={handleProgressComplete}
        />
      )}
    </div>
  )
}