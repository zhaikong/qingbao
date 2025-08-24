'use client'

import { useState } from 'react'
import MonitoringDashboard from '@/components/MonitoringDashboard'
import MonitoringTargets from '@/components/MonitoringTargets'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Target, 
  AlertTriangle, 
  Settings, 
  BarChart3,
  Shield,
  Bell
} from 'lucide-react'

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">实时监控与预警</h1>
          <p className="text-gray-600 mt-2">
            多源情报实时监控、威胁检测、智能预警系统
          </p>
        </div>

        {/* 功能特性 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-900">实时监控</h3>
                <p className="text-sm text-gray-600">多源数据实时采集</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-red-500">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-gray-900">威胁检测</h3>
                <p className="text-sm text-gray-600">智能威胁识别</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-900">实时预警</h3>
                <p className="text-sm text-gray-600">多通道预警通知</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold text-gray-900">趋势分析</h3>
                <p className="text-sm text-gray-600">历史趋势分析</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>监控仪表板</span>
            </TabsTrigger>
            <TabsTrigger value="targets" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>监控目标</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>预警规则</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <MonitoringDashboard />
          </TabsContent>

          <TabsContent value="targets">
            <MonitoringTargets />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card className="p-6">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">预警规则管理</h3>
                <p className="text-gray-600 mb-4">
                  配置智能预警规则，自动化威胁检测和响应
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>规则引擎</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span>多通道通知</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>自动化响应</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}