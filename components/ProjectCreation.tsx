'use client'

import { useState } from 'react'

interface ProjectCreationProps {
  onNavigate: (page: string) => void
}

export function ProjectCreation({ onNavigate }: ProjectCreationProps) {
  const [projectName, setProjectName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 根据技术蓝图，MVP阶段提供多个分析模板
  const templates = [
    {
      id: 'economic-analysis',
      name: '经济情报分析',
      description: '专注于经济数据、市场趋势、政策影响等经济领域的深度分析',
      icon: '💰',
      features: ['经济数据分析', '市场趋势预测', '政策影响评估', '风险预警']
    },
    {
      id: 'geopolitical-analysis',
      name: '地缘政治分析',
      description: '分析特定地区的政治稳定性、冲突风险和战略影响',
      icon: '🌍',
      features: ['政治稳定性', '冲突风险评估', '战略影响分析', '区域动态']
    },
    {
      id: 'deep-analysis',
      name: '深度研判报告',
      description: '适用于复杂议题的深度分析，包含背景、现状、趋势预测等完整结构',
      icon: '📊',
      features: ['多维度分析', '趋势预测', '风险评估', '政策建议']
    }
  ]

  // 表单验证
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!projectName.trim()) {
      newErrors.projectName = '请输入项目名称'
    } else if (projectName.trim().length < 2) {
      newErrors.projectName = '项目名称至少需要2个字符'
    }
    
    if (!selectedTemplate) {
      newErrors.template = '请选择一个报告模板'
    }
    
    if (description.trim().length > 500) {
      newErrors.description = '项目描述不能超过500个字符'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateProject = async () => {
    // 验证表单
    if (!validateForm()) {
      return
    }

    setIsCreating(true)
    
    try {
      // 根据选择的模板生成项目ID
      const projectId = `${selectedTemplate}-${Date.now()}`
      
      // 将项目信息存储到localStorage（MVP版本简化实现）
      const projectData = {
        id: projectId,
        name: projectName.trim(),
        description: description.trim(),
        template: selectedTemplate,
        createdAt: new Date().toISOString(),
        status: 'active'
      }
      
      // 存储项目数据
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]')
      existingProjects.push(projectData)
      localStorage.setItem('projects', JSON.stringify(existingProjects))
      
      // 模拟创建过程
      setTimeout(() => {
        setIsCreating(false)
        
        // 直接跳转到项目页面，简化流程
        window.location.href = `/projects/${projectId}`
      }, 1500)
      
    } catch (error) {
      setIsCreating(false)
      alert('项目创建失败，请重试')
      console.error('项目创建错误:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="fenghuo-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🚀</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">创建新项目</h1>
            <p className="text-gray-600">开始您的情报分析任务</p>
          </div>
        </div>
      </div>

      {/* 项目基本信息 */}
      <div className="fenghuo-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">项目信息</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value)
                if (errors.projectName) {
                  setErrors({...errors, projectName: ''})
                }
              }}
              placeholder="例如：中美AI领域最新政策对比分析"
              className={`fenghuo-input w-full ${errors.projectName ? 'border-red-500' : ''}`}
            />
            {errors.projectName && (
              <p className="text-red-500 text-sm mt-1">{errors.projectName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目描述
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) {
                  setErrors({...errors, description: ''})
                }
              }}
              placeholder="简要描述项目目标和分析重点..."
              rows={3}
              className={`fenghuo-textarea w-full ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {description.length}/500 字符
            </p>
          </div>
        </div>
      </div>

      {/* 模板选择 */}
      <div className="fenghuo-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          选择报告模板 <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          根据您的分析需求选择合适的报告模板，AI将基于模板结构生成专业报告
        </p>

        <div className="grid grid-cols-1 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : errors.template 
                    ? 'border-red-300 hover:border-red-400'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedTemplate(template.id)
                if (errors.template) {
                  setErrors({...errors, template: ''})
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{template.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    {selectedTemplate === template.id && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {template.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.template && (
          <p className="text-red-500 text-sm mt-2">{errors.template}</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => onNavigate('dashboard')}
          className="fenghuo-button-secondary"
          disabled={isCreating}
        >
          返回仪表盘
        </button>

        <button
          onClick={handleCreateProject}
          disabled={isCreating}
          className="fenghuo-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <div className="loading-spinner"></div>
              创建中...
            </>
          ) : (
            <>
              <span>🚀</span>
              创建项目
            </>
          )}
        </button>
      </div>

      {/* 简化的流程说明 */}
      <div className="fenghuo-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">创建后将自动进入分析流程</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">📝</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">配置分析参数</h4>
            <p className="text-xs text-gray-600">设置分析主题和数据源</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">🤖</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">AI智能分析</h4>
            <p className="text-xs text-gray-600">自动生成专业报告</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">📊</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">查看结果</h4>
            <p className="text-xs text-gray-600">获取完整分析报告</p>
          </div>
        </div>
      </div>
    </div>
  )
}