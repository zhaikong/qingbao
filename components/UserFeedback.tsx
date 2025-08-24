'use client'

import { useState } from 'react'

interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'question'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: string
  userInfo?: {
    email?: string
    role?: string
  }
}

interface UserFeedbackProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (feedback: FeedbackData) => void
}

export function UserFeedback({ isOpen, onClose, onSubmit }: UserFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'improvement',
    title: '',
    description: '',
    priority: 'medium',
    category: '报告生成',
    userInfo: {}
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const feedbackTypes = [
    { value: 'bug', label: '🐛 错误报告', description: '系统功能异常或错误' },
    { value: 'feature', label: '✨ 功能建议', description: '希望添加的新功能' },
    { value: 'improvement', label: '🔧 改进建议', description: '现有功能的优化建议' },
    { value: 'question', label: '❓ 使用问题', description: '使用过程中的疑问' }
  ]

  const priorityOptions = [
    { value: 'low', label: '低', color: 'text-green-600 bg-green-50' },
    { value: 'medium', label: '中', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'high', label: '高', color: 'text-red-600 bg-red-50' }
  ]

  const categoryOptions = [
    '报告生成', '数据采集', '质量评估', '用户界面', '系统性能', '数据源管理', '其他'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!feedback.title.trim() || !feedback.description.trim()) {
      alert('请填写标题和详细描述')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feedback,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        onSubmit?.(feedback)
        
        // 重置表单
        setTimeout(() => {
          setFeedback({
            type: 'improvement',
            title: '',
            description: '',
            priority: 'medium',
            category: '报告生成',
            userInfo: {}
          })
          setSubmitStatus('idle')
          onClose()
        }, 2000)
      } else {
        throw new Error('提交失败')
      }
    } catch (error) {
      console.error('反馈提交失败:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">用户反馈</h2>
            <p className="text-sm text-gray-600 mt-1">
              您的反馈对我们改进系统非常重要
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 反馈类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              反馈类型 *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedbackTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    feedback.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={feedback.type === type.value}
                    onChange={(e) => setFeedback({ ...feedback, type: e.target.value as any })}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                  {feedback.type === type.value && (
                    <div className="text-blue-500">✓</div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 *
            </label>
            <input
              type="text"
              value={feedback.title}
              onChange={(e) => setFeedback({ ...feedback, title: e.target.value })}
              placeholder="请简要描述问题或建议"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* 详细描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描述 *
            </label>
            <textarea
              value={feedback.description}
              onChange={(e) => setFeedback({ ...feedback, description: e.target.value })}
              placeholder="请详细描述问题的具体情况、重现步骤或改进建议..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* 优先级和分类 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <select
                value={feedback.priority}
                onChange={(e) => setFeedback({ ...feedback, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                相关功能
              </label>
              <select
                value={feedback.category}
                onChange={(e) => setFeedback({ ...feedback, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 联系信息（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              联系邮箱（可选）
            </label>
            <input
              type="email"
              value={feedback.userInfo?.email || ''}
              onChange={(e) => setFeedback({ 
                ...feedback, 
                userInfo: { ...feedback.userInfo, email: e.target.value }
              })}
              placeholder="如需回复，请留下邮箱地址"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* 提交状态 */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <span>✅</span>
                <span className="font-medium">反馈提交成功！</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                感谢您的反馈，我们会认真处理您的建议。
              </p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <span>❌</span>
                <span className="font-medium">提交失败</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                请检查网络连接后重试，或联系技术支持。
              </p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !feedback.title.trim() || !feedback.description.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  提交中...
                </>
              ) : (
                '提交反馈'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 反馈按钮组件
export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="用户反馈"
      >
        <span className="text-xl">💬</span>
      </button>

      <UserFeedback
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(feedback) => {
          console.log('用户反馈:', feedback)
        }}
      />
    </>
  )
}