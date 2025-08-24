"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  Users, 
  FileText, 
  BarChart3,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// 根据项目ID和模板类型生成项目数据
const getProjectData = (projectId: string) => {
  // 从localStorage获取项目数据（MVP版本简化实现）
  let projects = []
  try {
    projects = JSON.parse(localStorage.getItem('projects') || '[]')
  } catch (error) {
    console.error('解析项目数据失败:', error)
  }
  
  const savedProject = projects.find((p: any) => p.id === projectId)
  
  // 根据模板类型设置不同的项目配置
  const templateConfigs = {
    'economic-analysis': {
      name: '经济情报分析',
      description: '专注于经济数据、市场趋势、政策影响等经济领域的深度分析',
      customFields: {
        market: '全球股市',
        timeframe: '未来3个月',
        focus_areas: '通胀趋势、货币政策'
      }
    },
    'geopolitical-analysis': {
      name: '地缘政治分析',
      description: '分析特定地区的政治稳定性、冲突风险和战略影响',
      customFields: {
        region: '东南亚',
        timeframe: '未来6个月',
        focus_areas: '政治稳定性、军事冲突'
      }
    },
    'deep-analysis': {
      name: '深度研判报告',
      description: '适用于复杂议题的深度分析，包含背景、现状、趋势预测等完整结构',
      customFields: {
        topic: '人工智能发展',
        timeframe: '未来12个月',
        focus_areas: '技术趋势、政策影响'
      }
    }
  }
  
  const template = savedProject?.template || 'deep-analysis'
  const config = templateConfigs[template as keyof typeof templateConfigs] || templateConfigs['deep-analysis']
  
  return {
    id: projectId,
    name: savedProject?.name || config.name + ' - ' + new Date().toLocaleDateString('zh-CN'),
    description: savedProject?.description || config.description,
    status: 'active',
    priority: 'high',
    progress: 35,
    createdAt: savedProject?.createdAt ? new Date(savedProject.createdAt).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
    template: template,
    customFields: config.customFields,
    team: [
      { name: '张分析师', role: '主要分析师', avatar: '👨‍💼' },
      { name: '李研究员', role: '数据研究员', avatar: '👩‍💻' },
      { name: '王专家', role: '地区专家', avatar: '👨‍🎓' }
    ],
    tasks: [
      { id: 1, name: '数据收集', status: 'completed', progress: 100 },
      { id: 2, name: '初步分析', status: 'in-progress', progress: 60 },
      { id: 3, name: '深度分析', status: 'pending', progress: 0 },
      { id: 4, name: '报告生成', status: 'pending', progress: 0 }
    ],
    reports: [
      { id: 1, name: '初步情报报告', type: 'preliminary', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'), status: 'completed' },
      { id: 2, name: '深度分析报告', type: 'detailed', date: new Date().toLocaleDateString('zh-CN'), status: 'in-progress' }
    ]
  }
}

const STATUS_CONFIG = {
  active: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: Play },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800', icon: AlertCircle }
}

const PRIORITY_CONFIG = {
  low: { label: '低', color: 'bg-gray-100 text-gray-800' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-800' },
  high: { label: '高', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-800' }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      const projectData = getProjectData(params.id as string)
      setProject(projectData)
      setIsLoading(false)
    }
  }, [params.id])

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">加载项目信息中...</p>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG]
  const priorityConfig = PRIORITY_CONFIG[project.priority as keyof typeof PRIORITY_CONFIG]
  const StatusIcon = statusConfig.icon

  const handleStartAnalysis = () => {
    // 直接使用window.location.href确保跳转成功
    window.location.href = `/projects/${project.id}/generate`
  }

  const getTemplateDisplayName = (template: string) => {
    const templateNames = {
      'economic-analysis': '经济情报分析',
      'geopolitical-analysis': '地缘政治分析',
      'deep-analysis': '深度研判报告'
    }
    return templateNames[template as keyof typeof templateNames] || '深度研判报告'
  }

  const getCustomFieldLabel = (key: string) => {
    const labels = {
      'region': '目标地区',
      'market': '目标市场',
      'topic': '分析主题',
      'timeframe': '时间范围',
      'focus_areas': '关注领域'
    }
    return labels[key as keyof typeof labels] || key
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" asChild className="mr-4">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回仪表板
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600">项目ID: {project.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge className={priorityConfig.color}>
                {priorityConfig.label}优先级
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 项目概览 */}
            <Card className="fenghuo-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  项目概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">项目描述</h3>
                    <p className="text-gray-600">{project.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      创建时间: {project.createdAt}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      截止时间: {project.deadline}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">项目进度</span>
                      <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      variant="default" 
                      onClick={handleStartAnalysis}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      开始情报分析
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      项目设置
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 任务列表 */}
            <Card className="fenghuo-card">
              <CardHeader>
                <CardTitle>任务进度</CardTitle>
                <CardDescription>项目各阶段的执行情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <span className="font-medium">{task.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24">
                          <Progress value={task.progress} className="h-1" />
                        </div>
                        <span className="text-sm text-gray-600 w-12">{task.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 生成的报告 */}
            <Card className="fenghuo-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  生成的报告
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.reports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-gray-600">生成时间: {report.date}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                          {report.status === 'completed' ? '已完成' : '进行中'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          查看
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧边栏 */}
          <div className="space-y-6">
            {/* 项目配置 */}
            <Card className="fenghuo-card">
              <CardHeader>
                <CardTitle>项目配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">分析模板</label>
                  <p className="text-sm text-gray-600">{getTemplateDisplayName(project.template)}</p>
                </div>
                {Object.entries(project.customFields).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-700">
                      {getCustomFieldLabel(key)}
                    </label>
                    <p className="text-sm text-gray-600">{value as string}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 团队成员 */}
            <Card className="fenghuo-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  团队成员
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.team.map((member: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="text-2xl">{member.avatar}</div>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card className="fenghuo-card">
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  导出项目报告
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  编辑项目设置
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  管理团队成员
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}