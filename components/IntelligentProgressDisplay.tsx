'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface ProgressStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  details?: string[]
  startTime?: Date
  endTime?: Date
  updatedAt?: Date
}

interface IntelligentProgressDisplayProps {
  reportId?: string
  onComplete?: (report: any) => void
}

export default function IntelligentProgressDisplay({ 
  reportId, 
  onComplete 
}: IntelligentProgressDisplayProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'keyword-analysis',
      title: '🧠 智能关键词分析',
      description: 'Google Gemini深度分析主题，生成多维度搜索关键词',
      status: 'running',
      progress: 25
    },
    {
      id: 'data-collection',
      title: '🌐 多源数据收集',
      description: '11个专业数据源并行搜索，Chrome MCP自动化',
      status: 'pending',
      progress: 0
    },
    {
      id: 'chrome-automation',
      title: '🤖 Chrome MCP自动化',
      description: '浏览器自动化搜索，GLM-4.5V多模态分析',
      status: 'pending',
      progress: 0
    },
    {
      id: 'quality-assessment',
      title: '📊 数据质量评估',
      description: 'AI智能体评估数据质量和相关性',
      status: 'pending',
      progress: 0
    },
    {
      id: 'dynamic-supplement',
      title: '🔄 动态数据补充',
      description: '根据质量评估结果，动态补充高质量数据',
      status: 'pending',
      progress: 0
    },
    {
      id: 'threat-analysis',
      title: '⚠️ 威胁等级分析',
      description: 'GLM-4.5深度分析威胁等级和影响范围',
      status: 'pending',
      progress: 0
    },
    {
      id: 'report-generation',
      title: '📝 智能报告生成',
      description: '生成专业级情报分析报告',
      status: 'pending',
      progress: 0
    },
    {
      id: 'final-review',
      title: '✅ 最终审核完成',
      description: '报告质量检查和格式优化',
      status: 'pending',
      progress: 0
    }
  ])

  const [overallProgress, setOverallProgress] = useState(12.5)
  const [isRunning, setIsRunning] = useState(true)
  const [startTime, setStartTime] = useState<Date | null>(new Date())
  const [realTimeLogs, setRealTimeLogs] = useState<string[]>([
    '🚀 启动智能情报分析系统...',
    '🧠 开始智能关键词分析...',
    '📝 正在分析主题内容...'
  ])

  // 连接到真实的后端进度API
  useEffect(() => {
    if (!isRunning) return

    let eventSource: EventSource | null = null
    let pollInterval: NodeJS.Timeout | null = null
    
    const connectToProgressStream = () => {
      try {
        // 尝试连接服务器发送事件流
        eventSource = new EventSource('/api/progress-stream')
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'log') {
              setRealTimeLogs(prev => [...prev, data.message])
            } else if (data.type === 'progress') {
              updateStepProgress(data.stepId, data.progress, data.status)
            } else if (data.type === 'complete') {
              setIsRunning(false)
              if (onComplete) {
                onComplete(data.report)
              }
            }
          } catch (error) {
            console.error('解析进度数据失败:', error)
          }
        }
        
        eventSource.onerror = (error) => {
          console.error('进度流连接错误:', error)
          eventSource?.close()
          startPollingMode()
        }
      } catch (error) {
        console.error('无法连接进度流:', error)
        startPollingMode()
      }
    }

    const startPollingMode = () => {
      console.log('启动轮询模式获取进度...')
      
      const pollProgress = async () => {
        try {
          const response = await fetch('/api/progress-status')
          if (response.ok) {
            const data = await response.json()
            
            if (data.logs && data.logs.length > 0) {
              setRealTimeLogs(data.logs)
            }
            
            if (data.steps && data.steps.length > 0) {
              // 直接更新步骤状态
              setSteps(prevSteps => {
                const newSteps = [...prevSteps]
                data.steps.forEach((serverStep: any) => {
                  const stepIndex = newSteps.findIndex(s => s.id === serverStep.id)
                  if (stepIndex >= 0) {
                    newSteps[stepIndex] = {
                      ...newSteps[stepIndex],
                      progress: serverStep.progress,
                      status: serverStep.status,
                      updatedAt: serverStep.updatedAt
                    }
                  }
                })
                
                // 重新计算总体进度
                const completedSteps = newSteps.filter(step => step.status === 'completed').length
                const runningSteps = newSteps.filter(step => step.status === 'running').length
                const totalProgress = (completedSteps * 100 + runningSteps * 50) / newSteps.length
                setOverallProgress(totalProgress)
                
                return newSteps
              })
            }
            
            if (data.completed) {
              setIsRunning(false)
              if (onComplete && data.report) {
                onComplete(data.report)
              }
            }
          }
        } catch (error) {
          console.error('轮询进度失败:', error)
        }
      }

      // 立即执行一次，然后设置定时器
      pollProgress()
      pollInterval = setInterval(pollProgress, 1000)
    }

    // 优先尝试SSE，失败则降级到轮询
    connectToProgressStream()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isRunning, onComplete])

  const updateStepProgress = (stepId: string, progress: number, status: string) => {
    setSteps(prevSteps => {
      const newSteps = [...prevSteps]
      const stepIndex = newSteps.findIndex(step => step.id === stepId)
      
      if (stepIndex >= 0) {
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          progress,
          status: status as 'pending' | 'running' | 'completed' | 'error',
          ...(status === 'running' && !newSteps[stepIndex].startTime ? { startTime: new Date() } : {}),
          ...(status === 'completed' ? { endTime: new Date() } : {})
        }
      }

      // 重新计算总体进度
      const completedSteps = newSteps.filter(step => step.status === 'completed').length
      const runningSteps = newSteps.filter(step => step.status === 'running').length
      const totalProgress = (completedSteps * 100 + runningSteps * 50) / newSteps.length
      setOverallProgress(totalProgress)

      return newSteps
    })
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'running':
        return '⚡'
      case 'error':
        return '❌'
      default:
        return '⏳'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'running':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-400/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-gray-800/95 backdrop-blur-xl border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">🧠 智能情报分析进度</h3>
            <div className="flex space-x-2">
              <Badge className="bg-red-500/20 text-red-300 border-red-400/30">
                实时同步
              </Badge>
              {isRunning && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                  运行中
                </Badge>
              )}
            </div>
          </div>

          {/* 总体进度 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">总体进度</span>
              <span className="text-white font-bold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 bg-gray-700" />
            {startTime && (
              <div className="text-sm text-gray-400 mt-2">
                开始时间: {startTime.toLocaleTimeString()}
                {isRunning && (
                  <span className="ml-4">
                    运行时长: {Math.floor((Date.now() - startTime.getTime()) / 1000)}秒
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 步骤列表 */}
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  step.status === 'running'
                    ? 'bg-yellow-500/10 border-yellow-400/30 shadow-lg'
                    : step.status === 'completed'
                    ? 'bg-green-500/10 border-green-400/30'
                    : step.status === 'error'
                    ? 'bg-red-500/10 border-red-400/30'
                    : 'bg-gray-700/30 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStepIcon(step.status)}</span>
                    <div>
                      <h4 className="font-bold text-white">{step.title}</h4>
                      <p className="text-sm text-gray-300">{step.description}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(step.status)}>
                    {step.status === 'pending' && '等待中'}
                    {step.status === 'running' && '进行中'}
                    {step.status === 'completed' && '已完成'}
                    {step.status === 'error' && '错误'}
                  </Badge>
                </div>
                
                {step.progress > 0 && (
                  <div className="mb-2">
                    <Progress value={step.progress} className="h-2 bg-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 实时日志 */}
          <div className="mt-6">
            <h4 className="text-lg font-bold text-white mb-3">📋 实时日志</h4>
            <div className="bg-gray-900/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              {realTimeLogs.slice(-10).map((log, index) => (
                <div key={index} className="text-sm text-gray-300 mb-1 font-mono">
                  <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
            </div>
          </div>

          {/* 完成提示 */}
          {!isRunning && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-400/30 rounded-lg text-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-green-300 font-bold text-lg">智能情报分析完成！</div>
              <div className="text-green-200 text-sm mt-2">
                报告已生成，关键词分析已完成
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}