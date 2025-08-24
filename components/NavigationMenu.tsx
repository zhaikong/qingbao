'use client'

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function NavigationMenu() {
  const pathname = usePathname()

  const menuItems = [
    {
      href: '/',
      title: '📊 快速生成',
      description: '传统报告生成',
      badge: '经典版'
    },
    {
      href: '/intelligent-report',
      title: '🧠 智能分析',
      description: '集成OSINT的智能报告生成',
      badge: '智能版'
    },
    {
      href: '/enhanced-intelligence',
      title: '🚀 增强情报',
      description: '多源实时深度分析',
      badge: '专业版'
    },
    {
      href: '/monitoring',
      title: '🔍 实时监控',
      description: '多源情报监控与预警',
      badge: '监控版'
    },
    {
      href: '/data-fusion',
      title: '🔗 数据融合',
      description: '多源数据融合与关联分析',
      badge: '融合版'
    },
    {
      href: '/osint-solutions',
      title: '🔍 OSINT方案',
      description: '成熟开源情报工具集成',
      badge: '企业版'
    },
    {
      href: '/quick-generate',
      title: '⚡ 极速生成',
      description: '快速情报报告',
      badge: '快速'
    }
  ]

  return (
    <div className="fixed top-4 right-4 z-40">
      <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block p-3 rounded-lg transition-all duration-300 ${
                pathname === item.href
                  ? 'bg-blue-500/20 border border-blue-400/30'
                  : 'hover:bg-white/10 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">
                    {item.title}
                  </div>
                  <div className="text-white/70 text-xs">
                    {item.description}
                  </div>
                </div>
                <Badge 
                  className={`text-xs ${
                    item.badge === '企业版' 
                      ? 'bg-red-500/20 text-red-300 border-red-400/30'
                      : item.badge === '专业版' 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                      : item.badge === '智能版'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                      : item.badge === '监控版'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                      : item.badge === '融合版'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-400/30'
                      : item.badge === '最新'
                      ? 'bg-green-500/20 text-green-300 border-green-400/30'
                      : item.badge === '快速'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                  }`}
                >
                  {item.badge}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}