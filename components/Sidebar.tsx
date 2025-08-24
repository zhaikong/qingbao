'use client'

import { cn } from '@/lib/utils'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  collapsed: boolean
}

const menuItems = [
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: '📊',
    description: '平台概览'
  },
  {
    id: 'project-creation',
    label: '创建项目',
    icon: '🚀',
    description: '新建情报分析任务'
  },
  {
    id: 'report-generation',
    label: '报告生成',
    icon: '📝',
    description: 'AI智能生成报告'
  },
  {
    id: 'data-collection',
    label: '数据采集',
    icon: '🔍',
    description: '信息源管理'
  },
  {
    id: 'analysis',
    label: '智能分析',
    icon: '🧠',
    description: 'AI分析工具'
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: '⚙️',
    description: '平台配置'
  }
]

export function Sidebar({ currentPage, onNavigate, collapsed }: SidebarProps) {
  return (
    <div className={cn(
      "fixed left-0 top-0 h-full fenghuo-sidebar border-r border-slate-700 transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo区域 */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg fire-pulse">
          <span className="text-white font-bold text-lg">🔥</span>
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-white font-bold text-lg">烽火平台</h1>
            <p className="text-slate-400 text-xs">智能情报分析</p>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "fenghuo-nav-item w-full text-left group relative",
              currentPage === item.id && "active"
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className="text-xl">{item.icon}</span>
            {!collapsed && (
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-slate-400 group-hover:text-slate-300">
                  {item.description}
                </div>
              </div>
            )}
            
            {/* 悬浮提示 */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* 底部状态 */}
      <div className="absolute bottom-4 left-4 right-4">
        {!collapsed && (
          <div className="fenghuo-card p-3 bg-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>系统运行正常</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              版本 v1.0.0 MVP
            </div>
          </div>
        )}
      </div>
    </div>
  )
}