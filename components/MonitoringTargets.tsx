'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Target, 
  Settings, 
  Globe,
  Hash,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface MonitoringTarget {
  id: string
  name: string
  type: 'keyword' | 'domain' | 'ip' | 'url' | 'social' | 'threat'
  keywords: string[]
  sources: string[]
  filters: MonitoringFilter[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  createdAt: Date
  lastTriggered?: Date
}

interface MonitoringFilter {
  field: string
  operator: 'contains' | 'equals' | 'regex' | 'gt' | 'lt' | 'in'
  value: string | number | string[]
  caseSensitive?: boolean
}

interface MonitoringSource {
  id: string
  name: string
  type: 'api' | 'rss' | 'web' | 'social' | 'threat'
  endpoint: string
  rateLimit: number
  isActive: boolean
}

export default function MonitoringTargets() {
  const [targets, setTargets] = useState<MonitoringTarget[]>([])
  const [sources, setSources] = useState<MonitoringSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<MonitoringTarget | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'keyword' as MonitoringTarget['type'],
    keywords: '',
    sources: [] as string[],
    severity: 'medium' as MonitoringTarget['severity'],
    isActive: true
  })

  useEffect(() => {
    fetchTargets()
    fetchSources()
  }, [])

  const fetchTargets = async () => {
    try {
      const response = await fetch('/api/monitoring-targets')
      const data = await response.json()
      
      if (data.success) {
        setTargets(data.targets)
      }
    } catch (error) {
      console.error('获取监控目标失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/monitoring-engine?action=sources')
      const data = await response.json()
      
      if (data.success) {
        setSources(data.sources)
      }
    } catch (error) {
      console.error('获取数据源失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const targetData = {
        name: formData.name,
        type: formData.type,
        keywords: formData.keywords.split('\\n').filter(k => k.trim()),
        sources: formData.sources,
        severity: formData.severity,
        isActive: formData.isActive
      }

      const response = await fetch('/api/monitoring-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetData)
      })

      const data = await response.json()
      
      if (data.success) {
        fetchTargets()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('创建监控目标失败:', error)
    }
  }

  const toggleTargetStatus = async (targetId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/monitoring-targets/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        fetchTargets()
      }
    } catch (error) {
      console.error('更新目标状态失败:', error)
    }
  }

  const deleteTarget = async (targetId: string) => {
    if (!confirm('确定要删除这个监控目标吗？')) return

    try {
      const response = await fetch(`/api/monitoring-targets/${targetId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTargets()
      }
    } catch (error) {
      console.error('删除监控目标失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'keyword',
      keywords: '',
      sources: [],
      severity: 'medium',
      isActive: true
    })
    setEditingTarget(null)
  }

  const getTypeIcon = (type: MonitoringTarget['type']) => {
    switch (type) {
      case 'keyword': return <Hash className="h-4 w-4" />
      case 'domain': return <Globe className="h-4 w-4" />
      case 'url': return <Globe className="h-4 w-4" />
      case 'ip': return <Target className="h-4 w-4" />
      case 'social': return <Globe className="h-4 w-4" />
      case 'threat': return <AlertTriangle className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getTypeName = (type: MonitoringTarget['type']) => {
    switch (type) {
      case 'keyword': return '关键词'
      case 'domain': return '域名'
      case 'url': return 'URL'
      case 'ip': return 'IP地址'
      case 'social': return '社交媒体'
      case 'threat': return '威胁情报'
      default: return type
    }
  }

  const getSeverityColor = (severity: MonitoringTarget['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">加载监控目标...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">监控目标管理</h1>
          <p className="text-gray-600 mt-1">配置和管理实时监控目标</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              添加监控目标
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>添加监控目标</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">目标名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="输入监控目标名称"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">监控类型</Label>
                <Select value={formData.type} onValueChange={(value: MonitoringTarget['type']) => 
                  setFormData({...formData, type: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">关键词监控</SelectItem>
                    <SelectItem value="domain">域名监控</SelectItem>
                    <SelectItem value="url">URL监控</SelectItem>
                    <SelectItem value="ip">IP地址监控</SelectItem>
                    <SelectItem value="social">社交媒体监控</SelectItem>
                    <SelectItem value="threat">威胁情报监控</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="keywords">关键词列表</Label>
                <Textarea
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  placeholder="每行一个关键词"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sources">数据源</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {sources.filter(s => s.isActive).map((source) => (
                    <label key={source.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.sources.includes(source.id)}
                        onChange={(e) => {
                          const newSources = e.target.checked
                            ? [...formData.sources, source.id]
                            : formData.sources.filter(s => s !== source.id)
                          setFormData({...formData, sources: newSources})
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{source.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="severity">严重程度</Label>
                <Select value={formData.severity} onValueChange={(value: MonitoringTarget['severity']) => 
                  setFormData({...formData, severity: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="critical">严重</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  创建目标
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">总目标数</p>
              <p className="text-2xl font-bold">{targets.length}</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">活跃目标</p>
              <p className="text-2xl font-bold">{targets.filter(t => t.isActive).length}</p>
            </div>
            <Play className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">严重目标</p>
              <p className="text-2xl font-bold">{targets.filter(t => t.severity === 'critical').length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">高优先级</p>
              <p className="text-2xl font-bold">{targets.filter(t => t.severity === 'high' || t.severity === 'critical').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* 监控目标列表 */}
      <div className="space-y-4">
        {targets.map((target) => (
          <Card key={target.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(target.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{target.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getTypeName(target.type)}
                      </Badge>
                      <Badge className={`text-xs ${getSeverityColor(target.severity)}`}>
                        {target.severity}
                      </Badge>
                      {target.isActive ? (
                        <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                          活跃
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-gray-100 text-gray-800 border-gray-200">
                          停止
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTargetStatus(target.id, !target.isActive)}
                >
                  {target.isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      停止
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      启动
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTarget(target.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">关键词 ({target.keywords.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {target.keywords.slice(0, 5).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {target.keywords.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{target.keywords.length - 5} 更多
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">数据源 ({target.sources.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {target.sources.map((sourceId) => {
                    const source = sources.find(s => s.id === sourceId)
                    return source ? (
                      <Badge key={sourceId} variant="outline" className="text-xs">
                        {source.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>创建时间: {new Date(target.createdAt).toLocaleString()}</span>
                {target.lastTriggered && (
                  <span>最后触发: {new Date(target.lastTriggered).toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>ID: {target.id.slice(-8)}</span>
              </div>
            </div>
          </Card>
        ))}

        {targets.length === 0 && (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无监控目标</h3>
            <p className="text-gray-600 mb-4">添加您的第一个监控目标开始实时监控</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加监控目标
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}