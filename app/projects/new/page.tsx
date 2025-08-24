"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Target, Globe, TrendingUp, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

const PROJECT_TEMPLATES = [
  {
    id: 'geopolitical',
    name: '地缘政治分析',
    description: '分析特定地区的政治稳定性、冲突风险和战略影响',
    icon: Globe,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    fields: [
      { name: 'region', label: '目标地区', placeholder: '如：东南亚、中东等' },
      { name: 'timeframe', label: '分析时间范围', placeholder: '如：未来6个月' },
      { name: 'focus_areas', label: '重点关注领域', placeholder: '如：政治稳定性、军事冲突等' }
    ]
  },
  {
    id: 'economic',
    name: '经济情报分析',
    description: '评估经济趋势、市场风险和投资机会',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    fields: [
      { name: 'market', label: '目标市场', placeholder: '如：新兴市场、科技行业等' },
      { name: 'indicators', label: '关键指标', placeholder: '如：GDP、通胀率、就业率等' },
      { name: 'risk_factors', label: '风险因素', placeholder: '如：政策变化、汇率波动等' }
    ]
  },
  {
    id: 'security',
    name: '安全威胁评估',
    description: '识别和评估各类安全威胁及其影响',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    fields: [
      { name: 'threat_type', label: '威胁类型', placeholder: '如：网络安全、恐怖主义等' },
      { name: 'target_assets', label: '目标资产', placeholder: '如：关键基础设施、数据等' },
      { name: 'threat_actors', label: '威胁行为者', placeholder: '如：国家级、犯罪组织等' }
    ]
  },
  {
    id: 'technology',
    name: '科技竞争分析',
    description: '分析技术发展趋势和竞争格局',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    fields: [
      { name: 'technology_area', label: '技术领域', placeholder: '如：人工智能、量子计算等' },
      { name: 'competitors', label: '主要竞争者', placeholder: '如：国家、公司、研究机构等' },
      { name: 'innovation_metrics', label: '创新指标', placeholder: '如：专利数量、研发投入等' }
    ]
  }
]

export default function NewProjectPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    priority: 'medium',
    deadline: '',
    customFields: {} as Record<string, string>
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setProjectData(prev => ({
        ...prev,
        name: template.name + ' - ' + new Date().toLocaleDateString(),
        description: template.description
      }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldName]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTemplate) {
      toast({
        title: "请选择模板",
        description: "请先选择一个项目模板",
        variant: "destructive",
      })
      return
    }

    if (!projectData.name.trim()) {
      toast({
        title: "请输入项目名称",
        description: "项目名称不能为空",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 创建项目ID
      const projectId = `project-${Date.now()}`

      // 保存项目数据到localStorage
      const newProject = {
        id: projectId,
        name: projectData.name,
        description: projectData.description,
        template: selectedTemplate,
        priority: projectData.priority,
        deadline: projectData.deadline,
        customFields: projectData.customFields,
        createdAt: new Date().toISOString(),
        status: 'active'
      }

      // 获取现有项目列表
      let projects = []
      try {
        projects = JSON.parse(localStorage.getItem('projects') || '[]')
      } catch (error) {
        console.error('解析项目数据失败:', error)
      }

      // 添加新项目
      projects.push(newProject)

      // 保存回localStorage
      localStorage.setItem('projects', JSON.stringify(projects))

      toast({
        title: "项目创建成功",
        description: "正在直接进入报告生成...",
      })

      // 直接跳转到报告生成页面，跳过项目详情页
      router.push(`/projects/${projectId}/generate`)
    } catch (error) {
      toast({
        title: "创建失败",
        description: "项目创建过程中出现错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTemplateData = PROJECT_TEMPLATES.find(t => t.id === selectedTemplate)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回仪表板
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-900">创建新项目</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 模板选择 */}
          <Card className="fenghuo-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                选择项目模板
              </CardTitle>
              <CardDescription>
                选择最适合您需求的情报分析模板
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROJECT_TEMPLATES.map((template) => {
                  const Icon = template.icon
                  return (
                    <div
                      key={template.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${template.bgColor}`}>
                          <Icon className={`h-6 w-6 ${template.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 基本信息 */}
          <Card className="fenghuo-card">
            <CardHeader>
              <CardTitle>项目基本信息</CardTitle>
              <CardDescription>
                填写项目的基本信息和配置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    项目名称 *
                  </label>
                  <Input
                    id="name"
                    value={projectData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="请输入项目名称"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                    优先级
                  </label>
                  <select
                    id="priority"
                    value={projectData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  项目描述
                </label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="请描述项目的目标和范围"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                  截止日期
                </label>
                <Input
                  id="deadline"
                  type="date"
                  value={projectData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 模板特定字段 */}
          {selectedTemplateData && (
            <Card className="fenghuo-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <selectedTemplateData.icon className={`h-5 w-5 mr-2 ${selectedTemplateData.color}`} />
                  {selectedTemplateData.name} 配置
                </CardTitle>
                <CardDescription>
                  根据选择的模板填写特定的分析参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplateData.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <Input
                      id={field.name}
                      value={projectData.customFields[field.name] || ''}
                      onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">取消</Link>
            </Button>
            <Button
              type="submit"
              variant="fenghuo"
              disabled={isLoading || !selectedTemplate}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  创建中...
                </div>
              ) : (
                "创建项目"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}