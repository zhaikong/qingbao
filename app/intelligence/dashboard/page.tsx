'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Target,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Globe,
  Shield,
  Brain,
  FileText,
  BarChart3,
  Settings,
  Search
} from 'lucide-react'
import Link from 'next/link'

interface IntelligenceTask {
  id: string
  type: string
  topic: string
  description?: string
  status: 'created' | 'collecting' | 'processing' | 'analyzing' | 'completed' | 'failed'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  progress: {
    collection: number
    processing: number
    analysis: number
    report: number
  }
  analysisDepth: string
  timeRange: number
}

const TYPE_CONFIG = {
  geopolitical: {
    name: '地缘政治',
    icon: Globe,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  security: {
    name: '安全威胁',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
  economic: {
    name: '经济分析',
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  comprehensive: {
    name: '综合分析',
    icon: Brain,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  }
}

const STATUS_CONFIG = {
  created: { label: '已创建', color: 'bg-gray-100 text-gray-800', icon: Clock },
  collecting: { label: '收集中', color: 'bg-blue-100 text-blue-800', icon: Search },
  processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-800', icon: Settings },
  analyzing: { label: '分析中', color: 'bg-orange-100 text-orange-800', icon: BarChart3 },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: '失败', color: 'bg-red-100 text-red-800', icon: AlertCircle }
}

const PRIORITY_CONFIG = {
  high: { label: '高', color: 'bg-red-100 text-red-800' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
  low: { label: '低', color: 'bg-gray-100 text-gray-800' }
}

export default function IntelligenceDashboard() {
  const [tasks, setTasks] = useState<IntelligenceTask[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0
  })
  const router = useRouter()

  useEffect(() => {
    // 加载任务数据
    const loadTasks = () => {
      const tasksData = JSON.parse(localStorage.getItem('intelligence_tasks') || '[]')
      setTasks(tasksData)
      
      // 计算统计数据
      const total = tasksData.length
      const active = tasksData.filter((t: IntelligenceTask) => 
        ['created', 'collecting', 'processing', 'analyzing'].includes(t.status)
      ).length
      const completed = tasksData.filter((t: IntelligenceTask) => t.status === 'completed').length
      const failed = tasksData.filter((t: IntelligenceTask) => t.status === 'failed').length
      
      setStats({ total, active, completed, failed })
    }

    loadTasks()
    
    // 每30秒刷新一次数据
    const interval = setInterval(loadTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  const getOverallProgress = (task: IntelligenceTask) => {
    const { collection, processing, analysis, report } = task.progress
    return Math.round((collection + processing + analysis + report) / 4)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">情报分析仪表板</h1>
            </div>
            <Link href="/intelligence/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                创建新任务
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总任务数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">进行中</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">已完成</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">失败</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 任务列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              情报任务列表
            </CardTitle>
            <CardDescription>
              管理和监控您的所有情报分析任务
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无情报任务</h3>
                <p className="text-gray-500 mb-6">创建您的第一个情报分析任务</p>
                <Link href="/intelligence/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    创建任务
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const typeConfig = TYPE_CONFIG[task.type as keyof typeof TYPE_CONFIG]
                  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]
                  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
                  const TypeIcon = typeConfig?.icon
                  const StatusIcon = statusConfig?.icon
                  const progress = getOverallProgress(task)
                  
                  return (
                    <div
                      key={task.id}
                      className={`p-6 border-2 rounded-xl hover:shadow-md transition-all cursor-pointer ${typeConfig?.border} ${typeConfig?.bg}`}
                      onClick={() => router.push(`/intelligence/${task.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-white rounded-lg">
                            {TypeIcon && <TypeIcon className={`h-5 w-5 ${typeConfig?.color}`} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {task.topic}
                              </h3>
                              <Badge className={priorityConfig?.color}>
                                {priorityConfig?.label}优先级
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span>{typeConfig?.name}</span>
                              <span>•</span>
                              <span>{formatDate(task.createdAt)}</span>
                              <span>•</span>
                              <span>{task.timeRange}天内数据</span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusConfig?.color}>
                            {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                            {statusConfig?.label}
                          </Badge>
                          {task.status !== 'completed' && task.status !== 'failed' && (
                            <div className="text-right">
                              <div className="text-sm text-gray-600 mb-1">
                                进度 {progress}%
                              </div>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 进度详情 */}
                      {task.status !== 'created' && progress > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/50">
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">收集</div>
                            <div className="text-sm font-semibold">{task.progress.collection}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">处理</div>
                            <div className="text-sm font-semibold">{task.progress.processing}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">分析</div>
                            <div className="text-sm font-semibold">{task.progress.analysis}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">报告</div>
                            <div className="text-sm font-semibold">{task.progress.report}%</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}