'use client'

import { useState } from 'react'

interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
}

export function ReportGeneration() {
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState('')

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('请输入分析议题')
      return
    }
    setIsGenerating(true)
    // 模拟生成过程
    setTimeout(() => {
      setGeneratedReport('测试报告内容')
      setIsGenerating(false)
    }, 1000)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="fenghuo-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📝</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI报告生成</h1>
            <p className="text-gray-600">基于深度研判模板的智能报告生成</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="fenghuo-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">分析议题</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  请输入要分析的议题 *
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：中美AI领域最新政策对比分析"
                  rows={3}
                  className="fenghuo-textarea w-full"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  报告模板
                </label>
                <select
                  defaultValue="comprehensive"
                  className="fenghuo-select w-full"
                  disabled={isGenerating}
                >
                  <option value="comprehensive">综合分析报告</option>
                  <option value="brief">简要分析报告</option>
                  <option value="technical">技术分析报告</option>
                  <option value="policy">政策分析报告</option>
                  <option value="market">市场分析报告</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分析深度
                </label>
                <select
                  defaultValue="detailed"
                  className="fenghuo-select w-full"
                  disabled={isGenerating}
                >
                  <option value="basic">基础分析</option>
                  <option value="detailed">详细分析</option>
                  <option value="expert">专家级分析</option>
                </select>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating}
                className="fenghuo-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="loading-spinner"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    开始生成高质量报告
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="fenghuo-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">使用模板</h3>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-medium text-gray-900">深度研判报告</h4>
                <p className="text-sm text-gray-600 mt-1">
                  包含背景分析、多维度分析、趋势预测、风险评估和对策建议的完整结构
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {['执行摘要', '背景分析', '深度分析', '趋势预测', '对策建议'].map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="fenghuo-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">报告预览</h2>
              {generatedReport && (
                <div className="flex gap-2">
                  <button className="fenghuo-button-secondary flex items-center gap-2">
                    <span>📥</span>
                    导出报告
                  </button>
                  <button className="fenghuo-button-primary flex items-center gap-2">
                    <span>✏️</span>
                    编辑报告
                  </button>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg h-96 lg:h-[500px] overflow-auto">
              {generatedReport ? (
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                    {generatedReport}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-lg font-medium mb-2">等待生成报告</p>
                    <p className="text-sm">请输入分析议题并点击"开始生成高质量报告"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="fenghuo-card p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">智能报告生成系统 v2.0</h3>
                <p className="text-sm text-gray-600 mb-3">
                  基于多源数据采集和AI智能分析的专业报告生成系统，支持实时质量评估和多种报告模板。
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">多源数据采集</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">智能质量评估</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">专业报告模板</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">实时状态监控</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}