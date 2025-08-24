'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react'

interface DataSourceStatusProps {
  onRefresh?: () => void
}

export function DataSourceStatus({ onRefresh }: DataSourceStatusProps) {
  const [dataSourceStatus, setDataSourceStatus] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 检查数据源状态
  const checkDataSourceStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/data-sources/status')
      if (!response.ok) {
        throw new Error('获取数据源状态失败')
      }
      const data = await response.json()
      
      // 将从API获取的状态数据转换为组件需要的格式
      const formattedStatus: Record<string, boolean> = {}
      for (const key in data.sources) {
        // 假设每个数据源的状态对象都有一个 'available' 属性
        if (data.sources[key] && typeof data.sources[key].available === 'boolean') {
          formattedStatus[key] = data.sources[key].available
        }
      }
      
      setDataSourceStatus(formattedStatus)
      setLastUpdated(new Date(data.lastUpdate))
      
      // 调用父组件的刷新回调
      onRefresh?.()
    } catch (error) {
      console.error('检查数据源状态失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时检查状态
  useEffect(() => {
    checkDataSourceStatus()
  }, [])

  // 获取状态图标和颜色
  const getStatusIcon = (isActive: boolean) => {
    if (isActive) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800">已配置</Badge>
    } else {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">未配置</Badge>
    }
  }

  // 计算配置完成度
  const configuredCount = Object.values(dataSourceStatus).filter(Boolean).length
  const totalCount = Object.keys(dataSourceStatus).length
  const completionRate = totalCount > 0 ? Math.round((configuredCount / totalCount) * 100) : 0

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">数据源状态监控</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {configuredCount}/{totalCount} 已配置
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={checkDataSourceStatus}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 配置完成度进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>配置完成度</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* 数据源状态列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(dataSourceStatus).map(([sourceName, isActive]) => (
            <div 
              key={sourceName}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(isActive)}
                <div>
                  <div className="font-medium text-sm">{sourceName}</div>
                  <div className="text-xs text-gray-500">
                    {isActive ? '连接正常' : '需要配置API密钥'}
                  </div>
                </div>
              </div>
              {getStatusBadge(isActive)}
            </div>
          ))}
        </div>

        {/* 配置提示 */}
        {configuredCount < totalCount && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 mb-1">配置提示</div>
                <div className="text-yellow-700">
                  部分数据源未配置，请在 <code className="bg-yellow-100 px-1 rounded">.env.local</code> 文件中添加相应的API密钥以获得更好的搜索效果。
                </div>
                <div className="mt-2">
                  <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300">
                    <Settings className="h-3 w-3 mr-1" />
                    查看配置指南
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 最后更新时间 */}
        {lastUpdated && (
          <div className="text-xs text-gray-500 text-center">
            最后更新: {lastUpdated.toLocaleString('zh-CN')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}