'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Target, 
  Globe, 
  Shield, 
  TrendingUp, 
  Brain,
  Calendar,
  Settings,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

// 分析类型定义
const ANALYSIS_TYPES = [
  {
    id: 'geopolitical',
    name: '地缘政治分析',
    description: '分析国际关系、政治稳定性、冲突风险和战略影响',
    icon: Globe,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    examples: ['中美关系走向', '俄乌冲突影响', '台海局势分析']
  },
  {
    id: 'security',
    name: '安全威胁评估',
    description: '识别网络安全、恐怖主义、军事威胁等各类安全风险',
    icon: Shield,
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
    examples: ['网络安全威胁', '反恐情报分析', '军事动向监测']
  },
  {
    id: 'economic',
    name: '经济情报分析',
    description: '评估经济趋势、市场风险、贸易政策和投资机会',
    icon: TrendingUp,
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
    examples: ['贸易战影响', '供应链分析', '市场趋势预测']
  },
  {
    id: 'comprehensive',
    name: '综合情报分析',
    description: '多维度综合分析，涵盖政治、经济、社会、技术等方面',
    icon: Brain,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    examples: ['国家发展评估', '行业全景分析', '重大事件影响']
  }
]

const TIME_RANGES = [
  { value: '7', label: '最近7天' },
  { value: '30', label: '最近30天' },
  { value: '90', label: '最近3个月' },
  { value: '180', label: '最近6个月' },
  { value: '365', label: '最近1年' },
  { value: 'custom', label: '自定义时间' }
]

const ANALYSIS_DEPTHS = [
  { value: 'quick', label: '快速分析', description: '5-10分钟，基础信息梳理' },
  { value: 'standard', label: '标准分析', description: '15-30分钟，深度分析' },
  { value: 'deep', label: '深度分析', description: '30-60分钟，全面深入研究' }
]

const PRIORITIES = [
  { value: 'high', label: '高优先级', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: '中优先级', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: '低优先级', color: 'bg-gray-100 text-gray-800' }
]

export default function IntelligenceCreatePage() {
  const [selectedType, setSelectedType] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [timeRange, setTimeRange] = useState('30')
  const [analysisDepth, setAnalysisDepth] = useState('standard')
  const [priority, setPriority] = useState('medium')
  const [isCreating, setIsCreating] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  const selectedTypeData = ANALYSIS_TYPES.find(type => type.id === selectedType)

  const handleCreateTask = async () => {
    if (!selectedType || !topic.trim()) {
      toast({
        title: "请完善任务信息",
        description: "请选择分析类型并输入情报主题",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    
    try {
      const taskId = `intel-${Date.now()}`
      
      // 创建情报任务
      const taskData = {
        id: taskId,
        type: selectedType,
        topic: topic.trim(),
        description: description.trim(),
        timeRange: parseInt(timeRange),
        analysisDepth,
        priority,
        status: 'created',
        createdAt: new Date().toISOString(),
        progress: {
          collection: 0,
          processing: 0,
          analysis: 0,
          report: 0
        }
      }

      // 保存任务数据
      const existingTasks = JSON.parse(localStorage.getItem('intelligence_tasks') || '[]')
      existingTasks.unshift(taskData)
      localStorage.setItem('intelligence_tasks', JSON.stringify(existingTasks))

      toast({
        title: "任务创建成功！",
        description: "正在启动情报收集引擎...",
      })

      // 跳转到任务详情页面
      setTimeout(() => {
        router.push(`/intelligence/${taskId}/collection`)
      }, 1500)

    } catch (error: any) {
      console.error('任务创建失败:', error)
      toast({
        title: "创建失败",
        description: error.message || "请重试",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">创建情报分析任务</h1>
            </div>
            <div className="ml-auto">
              <Link href="/intelligence/dashboard">
                <Button variant="ghost">返回仪表板</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isCreating ? (
          <div className="space-y-8">
            {/* 介绍卡片 */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Brain className="h-7 w-7 text-blue-600" />
                  专业情报分析系统
                </CardTitle>
                <CardDescription className="text-lg">
                  目标驱动的智能情报收集与分析平台
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    多源自动收集
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    智能数据清洗
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    专业分析报告
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    可信度评估
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 分析类型选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  选择分析类型
                </CardTitle>
                <CardDescription>
                  根据您的情报需求选择最合适的分析类型
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ANALYSIS_TYPES.map((type) => {
                    const Icon = type.icon
                    const isSelected = selectedType === type.id
                    return (
                      <div
                        key={type.id}
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/80 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedType(type.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${type.lightColor}`}>
                            <Icon className={`h-6 w-6 ${type.textColor}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {type.examples.slice(0, 2).map((example, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 情报主题 */}
            <Card>
              <CardHeader>
                <CardTitle>定义情报主题</CardTitle>
                <CardDescription>
                  清晰准确地描述您需要分析的主题或问题
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    主题标题 *
                  </label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="例如：中美贸易争端对全球供应链的影响分析"
                    className="text-base"
                  />
                  {selectedTypeData && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">建议主题示例：</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTypeData.examples.map((example, idx) => (
                          <button
                            key={idx}
                            onClick={() => setTopic(example)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    详细描述 (可选)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="进一步描述分析重点、关注角度或特殊要求..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 高级设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  分析参数设置
                </CardTitle>
                <CardDescription>
                  配置情报收集和分析的详细参数
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    时间范围
                  </label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分析深度
                  </label>
                  <Select value={analysisDepth} onValueChange={setAnalysisDepth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANALYSIS_DEPTHS.map((depth) => (
                        <SelectItem key={depth.value} value={depth.value}>
                          <div>
                            <div className="font-medium">{depth.label}</div>
                            <div className="text-xs text-gray-500">{depth.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    优先级别
                  </label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((prio) => (
                        <SelectItem key={prio.value} value={prio.value}>
                          <Badge className={prio.color}>
                            {prio.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 任务预览 */}
            {selectedType && topic.trim() && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    任务预览
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">分析类型:</span>
                      <span className="ml-2">{selectedTypeData?.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">时间范围:</span>
                      <span className="ml-2">{TIME_RANGES.find(r => r.value === timeRange)?.label}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">分析深度:</span>
                      <span className="ml-2">{ANALYSIS_DEPTHS.find(d => d.value === analysisDepth)?.label}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">预计时间:</span>
                      <span className="ml-2">{ANALYSIS_DEPTHS.find(d => d.value === analysisDepth)?.description}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white/80 rounded-lg">
                    <span className="font-medium text-gray-600">主题:</span>
                    <p className="mt-1 font-medium">{topic}</p>
                    {description && (
                      <>
                        <span className="font-medium text-gray-600 mt-2 block">描述:</span>
                        <p className="mt-1 text-gray-700">{description}</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 创建按钮 */}
            <div className="flex justify-center">
              <Button
                onClick={handleCreateTask}
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={!selectedType || !topic.trim()}
              >
                <Zap className="h-5 w-5 mr-2" />
                启动情报收集引擎
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          // 创建中状态
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <Target className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">创建情报任务</h3>
                    <p className="text-gray-600">正在初始化多源数据收集引擎...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}