'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OSINTTool {
  id: string
  name: string
  category: string
  type: string
  description: string
  website: string
  pricing: 'free' | 'freemium' | 'paid'
  capabilities: string[]
  reliability: number
  lastUpdated: string
}

interface OSINTResult {
  toolId: string
  toolName: string
  query: string
  results: any[]
  metadata: {
    executionTime: number
    resultCount: number
    success: boolean
    error?: string
  }
  credibility: number
  timestamp: string
}

export default function OSINTSolutionsPage() {
  const [tools, setTools] = useState<OSINTTool[]>([])
  const [selectedTool, setSelectedTool] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OSINTResult[]>([])
  const [isQuerying, setIsQuerying] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [statistics, setStatistics] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<OSINTTool[]>([])
  const [selectedUseCase, setSelectedUseCase] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadTools()
    loadStatistics()
  }, [])

  useEffect(() => {
    if (selectedUseCase) {
      loadRecommendations(selectedUseCase)
    }
  }, [selectedUseCase])

  const loadTools = async (category?: string) => {
    try {
      const params = new URLSearchParams()
      if (category && category !== 'all') {
        params.append('category', category)
      }

      const response = await fetch(`/api/osint-solutions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTools(data.tools)
      }
    } catch (error) {
      console.error('Failed to load tools:', error)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/osint-solutions')
      if (response.ok) {
        const data = await response.json()
        // 计算统计信息
        const stats = {
          totalTools: data.tools.length,
          freeTools: data.tools.filter((t: OSINTTool) => t.pricing === 'free').length,
          paidTools: data.tools.filter((t: OSINTTool) => t.pricing === 'paid').length,
          averageReliability: data.tools.reduce((sum: number, t: OSINTTool) => sum + t.reliability, 0) / data.tools.length,
          categories: data.tools.reduce((acc: any, t: OSINTTool) => {
            acc[t.category] = (acc[t.category] || 0) + 1
            return acc
          }, {})
        }
        setStatistics(stats)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const loadRecommendations = async (useCase: string) => {
    try {
      const response = await fetch(`/api/osint-solutions?useCase=${useCase}`)
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendedTools)
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    }
  }

  const executeQuery = async () => {
    if (!selectedTool || !query.trim()) {
      setError('请选择工具并输入查询内容')
      return
    }

    setIsQuerying(true)
    setError('')
    setResults([])

    try {
      const response = await fetch('/api/osint-solutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId: selectedTool,
          query: query.trim(),
          options: {}
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults([data.result])
      } else {
        const errorData = await response.json()
        setError(errorData.error || '查询失败')
      }
    } catch (error) {
      console.error('Query execution error:', error)
      setError(`查询失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsQuerying(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'web_recon': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      'threat_intel': 'bg-red-500/20 text-red-300 border-red-400/30',
      'social_media': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      'network_analysis': 'bg-green-500/20 text-green-300 border-green-400/30',
      'geospatial': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      'dark_web': 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
    return colors[category] || 'bg-gray-500/20 text-gray-300 border-gray-400/30'
  }

  const getPricingColor = (pricing: string) => {
    const colors: Record<string, string> = {
      'free': 'bg-green-500/20 text-green-300 border-green-400/30',
      'freemium': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      'paid': 'bg-red-500/20 text-red-300 border-red-400/30'
    }
    return colors[pricing] || 'bg-gray-500/20 text-gray-300 border-gray-400/30'
  }

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.9) return 'text-green-400'
    if (reliability >= 0.8) return 'text-yellow-400'
    if (reliability >= 0.7) return 'text-orange-400'
    return 'text-red-400'
  }

  const categories = [
    { id: 'all', name: '全部工具', icon: '🔧' },
    { id: 'web_recon', name: 'Web侦察', icon: '🌐' },
    { id: 'threat_intel', name: '威胁情报', icon: '⚠️' },
    { id: 'social_media', name: '社交媒体', icon: '📱' },
    { id: 'network_analysis', name: '网络分析', icon: '🔍' },
    { id: 'geospatial', name: '地理空间', icon: '🗺️' },
    { id: 'dark_web', name: '暗网', icon: '🌑' }
  ]

  const useCases = [
    { id: 'threat_hunting', name: '威胁狩猎', description: '寻找和分析安全威胁' },
    { id: 'domain_recon', name: '域名侦察', description: '收集域名和子域名信息' },
    { id: 'social_intel', name: '社交情报', description: '分析社交媒体活动' },
    { id: 'network_analysis', name: '网络分析', description: '分析网络基础设施' },
    { id: 'geospatial', name: '地理空间', description: '卫星图像和地理分析' },
    { id: 'dark_web', name: '暗网监控', description: '监控暗网威胁活动' }
  ]

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
            🔍 OSINT解决方案集成
          </h1>
          <p className="text-xl text-white/80 mb-6">
            成熟开源情报工具和权威数据源集成平台
          </p>
          <div className="flex justify-center space-x-4">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
              15+ 专业工具
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
              6大情报类别
            </Badge>
            <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
              实时数据采集
            </Badge>
          </div>
        </div>

        {/* 统计信息 */}
        {statistics && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">📊 平台统计</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{statistics.totalTools}</div>
                  <div className="text-white/70 text-sm">集成工具</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{statistics.freeTools}</div>
                  <div className="text-white/70 text-sm">免费工具</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{statistics.paidTools}</div>
                  <div className="text-white/70 text-sm">付费工具</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {(statistics.averageReliability * 100).toFixed(0)}%
                  </div>
                  <div className="text-white/70 text-sm">平均可靠性</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="tools" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools" className="bg-white/10 text-white">🔧 工具库</TabsTrigger>
            <TabsTrigger value="query" className="bg-white/10 text-white">🔍 智能查询</TabsTrigger>
            <TabsTrigger value="recommendations" className="bg-white/10 text-white">💡 推荐系统</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-6">
            {/* 分类选择 */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  onClick={() => {
                    setActiveCategory(category.id)
                    loadTools(category.id === 'all' ? undefined : category.id)
                  }}
                  className={`${
                    activeCategory === category.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>

            {/* 工具列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <Card key={tool.id} className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">{tool.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPricingColor(tool.pricing)}>
                          {tool.pricing === 'free' ? '免费' : tool.pricing === 'freemium' ? '增值' : '付费'}
                        </Badge>
                        <div className={`text-sm font-medium ${getReliabilityColor(tool.reliability)}`}>
                          {(tool.reliability * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={getCategoryColor(tool.category) + " mb-3"}>
                      {categories.find(c => c.id === tool.category)?.name || tool.category}
                    </Badge>
                    
                    <p className="text-white/70 text-sm mb-4">{tool.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-white/80 text-sm font-medium mb-2">主要功能:</h4>
                      <div className="flex flex-wrap gap-1">
                        {tool.capabilities.slice(0, 3).map((capability, index) => (
                          <Badge key={index} className="bg-white/5 text-white/60 text-xs">
                            {capability}
                          </Badge>
                        ))}
                        {tool.capabilities.length > 3 && (
                          <Badge className="bg-white/5 text-white/60 text-xs">
                            +{tool.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-white/50 text-xs">
                        更新: {new Date(tool.lastUpdated).toLocaleDateString()}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTool(tool.id)
                          document.getElementById('query-tab')?.click()
                        }}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                      >
                        使用工具
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="query" className="space-y-6" id="query-tab">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">🔍 智能查询</h2>
                  
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
                        选择工具
                      </label>
                      <Select value={selectedTool} onValueChange={setSelectedTool}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="选择OSINT工具" />
                        </SelectTrigger>
                        <SelectContent>
                          {tools.map((tool) => (
                            <SelectItem key={tool.id} value={tool.id}>
                              {tool.name} ({tool.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-white/90 font-medium mb-2">
                        查询内容
                      </label>
                      <Textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="输入要查询的内容，例如：域名、IP地址、关键词、邮箱等..."
                        rows={4}
                        className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400/50 resize-none"
                      />
                    </div>

                    <Button
                      onClick={executeQuery}
                      disabled={isQuerying || !selectedTool || !query.trim()}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {isQuerying ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>正在查询...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>🚀</span>
                          <span>执行查询</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">📋 查询结果</h2>
                  
                  {results.length === 0 ? (
                    <div className="text-center text-white/60 py-12">
                      <div className="text-6xl mb-4">🔍</div>
                      <p>选择工具并输入查询内容后，结果将显示在这里</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-medium">{result.toolName}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={
                                result.metadata.success 
                                  ? 'bg-green-500/20 text-green-300 border-green-400/30'
                                  : 'bg-red-500/20 text-red-300 border-red-400/30'
                              }>
                                {result.metadata.success ? '成功' : '失败'}
                              </Badge>
                              <div className="text-white/60 text-xs">
                                可信度: {(result.credibility * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-white/70 text-sm mb-2">
                            查询: {result.query}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-white/50">执行时间:</span>
                              <span className="text-white/70 ml-2">{result.metadata.executionTime}ms</span>
                            </div>
                            <div>
                              <span className="text-white/50">结果数量:</span>
                              <span className="text-white/70 ml-2">{result.metadata.resultCount}</span>
                            </div>
                          </div>
                          
                          {result.metadata.error && (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-400/20 rounded">
                              <div className="text-red-200 text-sm">错误: {result.metadata.error}</div>
                            </div>
                          )}
                          
                          {result.results.length > 0 && (
                            <div className="mt-4">
                              <details className="text-white/70">
                                <summary className="cursor-pointer hover:text-white/90">
                                  查看详细结果 ({result.results.length} 项)
                                </summary>
                                <div className="mt-2 p-3 bg-white/5 rounded max-h-40 overflow-y-auto">
                                  <pre className="text-white/60 text-xs whitespace-pre-wrap">
                                    {JSON.stringify(result.results, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="mb-6">
              <label className="block text-white/90 font-medium mb-2">
                选择使用场景
              </label>
              <Select value={selectedUseCase} onValueChange={setSelectedUseCase}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white w-80">
                  <SelectValue placeholder="选择使用场景" />
                </SelectTrigger>
                <SelectContent>
                  {useCases.map((useCase) => (
                    <SelectItem key={useCase.id} value={useCase.id}>
                      {useCase.name} - {useCase.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUseCase && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">
                    💡 {useCases.find(u => u.id === selectedUseCase)?.name} 推荐工具
                  </h3>
                  <p className="text-white/70 text-sm">
                    {useCases.find(u => u.id === selectedUseCase)?.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((tool) => (
                    <Card key={tool.id} className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white">{tool.name}</h3>
                          <Badge className={getPricingColor(tool.pricing)}>
                            {tool.pricing === 'free' ? '免费' : tool.pricing === 'freemium' ? '增值' : '付费'}
                          </Badge>
                        </div>
                        
                        <Badge className={getCategoryColor(tool.category) + " mb-3"}>
                          {categories.find(c => c.id === tool.category)?.name || tool.category}
                        </Badge>
                        
                        <p className="text-white/70 text-sm mb-4">{tool.description}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className={`text-sm font-medium ${getReliabilityColor(tool.reliability)}`}>
                            可靠性: {(tool.reliability * 100).toFixed(0)}%
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-white/80 text-sm font-medium mb-2">核心功能:</h4>
                          <div className="flex flex-wrap gap-1">
                            {tool.capabilities.slice(0, 2).map((capability, index) => (
                              <Badge key={index} className="bg-white/5 text-white/60 text-xs">
                                {capability}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTool(tool.id)
                            setSelectedUseCase('')
                            document.getElementById('query-tab')?.click()
                          }}
                          className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                        >
                          使用此工具
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!selectedUseCase && (
              <div className="text-center text-white/60 py-12">
                <div className="text-6xl mb-4">💡</div>
                <p>选择使用场景以获取个性化工具推荐</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-white font-bold mb-2">专业工具集成</h3>
              <p className="text-white/70 text-sm">
                集成15+专业OSINT工具，涵盖Web侦察、威胁情报、社交媒体等多个领域
              </p>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-white font-bold mb-2">智能推荐系统</h3>
              <p className="text-white/70 text-sm">
                基于使用场景的个性化工具推荐，优化工作效率和结果质量
              </p>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-white font-bold mb-2">统一查询接口</h3>
              <p className="text-white/70 text-sm">
                简化多工具查询流程，提供统一的API和结果展示界面
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}