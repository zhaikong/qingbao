'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user] = useState({ email: '461273316@qq.com' })
  const router = useRouter()

  const handleLogout = () => {
    router.push('/')
  }

  const handleStartAnalysis = () => {
    router.push('/search')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">烽火智能情报</h1>
                <p className="text-xs text-slate-500">专业级战略情报分析与威胁评估系统</p>
              </div>
            </div>
            
            {/* 用户信息 */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-slate-600">欢迎回来</p>
                <p className="text-sm font-medium text-slate-900">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* 欢迎区域 */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-light text-slate-900 mb-4 tracking-tight">
            🔥 烽火智能情报分析平台
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            专业级战略情报分析与威胁评估系统
          </p>
          
          {/* 技术标签 */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <span className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
              GLM-4.5 深度分析
            </span>
            <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
              11个专业数据源
            </span>
            <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
              Chrome MCP 自动化
            </span>
          </div>
        </div>

        {/* 核心功能卡片 */}
        <div className="mb-16">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60 shadow-xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">智能关键词分析系统</h2>
            </div>
            <p className="text-center text-slate-600 mb-8 max-w-3xl mx-auto">
              使用GLM-4.5深度分析任何主题，自动生成精准关键词策略，实现专业级情报收集
            </p>
            <div className="text-center">
              <button
                onClick={handleStartAnalysis}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                </svg>
                开始情报分析
              </button>
            </div>
          </div>
        </div>

        {/* 功能特性网格 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* 智能关键词分析 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 hover:shadow-lg transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">智能关键词分析</h3>
            <p className="text-slate-600 mb-6">
              GLM-4.5深度分析主题，动态生成精准关键词和策略
            </p>
            <button className="text-orange-500 hover:text-orange-600 font-medium text-sm transition-colors">
              核心功能 →
            </button>
          </div>

          {/* 多源数据收集 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 hover:shadow-lg transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">多源数据收集</h3>
            <p className="text-slate-600 mb-6">
              11个专业数据源并行搜索，Chrome MCP浏览器自动化
            </p>
            <button className="text-orange-500 hover:text-orange-600 font-medium text-sm transition-colors">
              数据引擎 →
            </button>
          </div>

          {/* 威胁评估分析 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 hover:shadow-lg transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">威胁评估分析</h3>
            <p className="text-slate-600 mb-6">
              AI智能体实时评估威胁等级，动态调整分析策略
            </p>
            <button className="text-orange-500 hover:text-orange-600 font-medium text-sm transition-colors">
              分析引擎 →
            </button>
          </div>
        </div>

        {/* 技术栈展示 */}
        <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">🛡️ 专业情报技术栈</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">GLM-4.5</h3>
              <p className="text-sm text-slate-600">深度模型分析</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">GLM-4.5V</h3>
              <p className="text-sm text-slate-600">多模态分析</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">GLM-4.5-Flash</h3>
              <p className="text-sm text-slate-600">高速响应处理</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Chrome MCP</h3>
              <p className="text-sm text-slate-600">浏览器自动化</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}