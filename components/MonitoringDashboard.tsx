'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  EyeOff, 
  Plus, 
  Settings, 
  TrendingUp,
  Shield,
  Target,
  Bell,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface MonitoringDashboard {
  activeTargets: number
  totalEvents: number
  criticalAlerts: number
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  recentEvents: MonitoringEvent[]
  trendData: TrendData[]
  sourceStats: SourceStats[]
}

interface MonitoringEvent {
  id: string
  targetId: string
  type: 'match' | 'threat' | 'anomaly' | 'trend'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  source: string
  timestamp: Date
  confidence: number
  isRead: boolean
  tags: string[]
}

interface TrendData {
  timestamp: Date
  events: number
  threats: number
  criticals: number
}

interface SourceStats {
  sourceId: string
  name: string
  events: number
  lastEvent?: Date
  health: 'healthy' | 'warning' | 'error'
}

export default function MonitoringDashboard() {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [engineStatus, setEngineStatus] = useState<'stopped' | 'running'>('stopped')
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    fetchDashboard()
    fetchEngineStatus()
    
    // 每30秒刷新一次数据
    const interval = setInterval(() => {
      fetchDashboard()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/monitoring-engine?action=dashboard')
      const data = await response.json()
      
      if (data.success) {
        setDashboard(data.dashboard)
      }
    } catch (error) {
      console.error('获取仪表板数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEngineStatus = async () => {
    try {
      const response = await fetch('/api/monitoring-engine?action=status')
      const data = await response.json()
      
      if (data.success) {
        setEngineStatus(data.status.isRunning ? 'running' : 'stopped')
      }
    } catch (error) {
      console.error('获取引擎状态失败:', error)
    }
  }

  const startEngine = async () => {
    try {
      const response = await fetch('/api/monitoring-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })
      
      const data = await response.json()
      if (data.success) {
        setEngineStatus('running')
      }
    } catch (error) {
      console.error('启动引擎失败:', error)
    }
  }

  const stopEngine = async () => {
    try {
      const response = await fetch('/api/monitoring-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      })
      
      const data = await response.json()
      if (data.success) {
        setEngineStatus('stopped')
      }
    } catch (error) {
      console.error('停止引擎失败:', error)
    }
  }

  const markEventAsRead = async (eventId: string) => {
    try {
      await fetch('/api/monitoring-events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: [eventId] })
      })
      
      fetchDashboard()
    } catch (error) {
      console.error('标记事件失败:', error)
    }
  }

  const markAllEventsAsRead = async () => {
    try {
      await fetch('/api/monitoring-events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allEvents: true })
      })
      
      fetchDashboard()
    } catch (error) {
      console.error('标记所有事件失败:', error)
    }
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSourceHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载监控仪表板...</p>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">无法加载监控仪表板</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">实时监控仪表板</h1>
            <p className="text-gray-600 mt-2">多源情报监控与威胁预警</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${engineStatus === 'running' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {engineStatus === 'running' ? '运行中' : '已停止'}
              </span>
            </div>
            {engineStatus === 'stopped' ? (
              <Button onClick={startEngine} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                启动监控
              </Button>
            ) : (
              <Button onClick={stopEngine} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                停止监控
              </Button>
            )}
          </div>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">活跃监控目标</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.activeTargets}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总事件数</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.totalEvents}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">严重预警</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.criticalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">威胁等级</p>
                <Badge className={getThreatLevelColor(dashboard.threatLevel)}>
                  {dashboard.threatLevel.toUpperCase()}
                </Badge>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* 主要内容 */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="events">事件列表</TabsTrigger>
            <TabsTrigger value="sources">数据源</TabsTrigger>
            <TabsTrigger value="trends">趋势分析</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 最近事件 */}
            <Card className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">最近事件</h2>
                <Button variant="outline" size="sm" onClick={markAllEventsAsRead}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  全部已读
                </Button>
              </div>
              <div className="space-y-3">
                {dashboard.recentEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      event.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {!event.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!event.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markEventAsRead(event.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card className="bg-white border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">所有事件</h2>
              <div className="space-y-3">
                {dashboard.recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      event.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {!event.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>来源: {event.source}</span>
                          <span>置信度: {(event.confidence * 100).toFixed(0)}%</span>
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          {event.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {!event.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markEventAsRead(event.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <Card className="bg-white border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">数据源状态</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboard.sourceStats.map((source) => (
                  <div key={source.sourceId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getSourceHealthColor(source.health)}`} />
                      <div>
                        <p className="font-medium text-gray-900">{source.name}</p>
                        <p className="text-sm text-gray-600">{source.events} 个事件</p>
                        {source.lastEvent && (
                          <p className="text-xs text-gray-500">
                            最后更新: {new Date(source.lastEvent).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={getSourceHealthColor(source.health)}>
                      {source.health}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-white border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">24小时趋势</h2>
              <div className="space-y-4">
                {dashboard.trendData.slice(-8).map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600 w-24">
                        {new Date(data.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          <span className="text-sm">{data.events} 事件</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          <span className="text-sm">{data.threats} 威胁</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full" />
                          <span className="text-sm">{data.criticals} 严重</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// 添加缺失的图标组件
const Play = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const Pause = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)