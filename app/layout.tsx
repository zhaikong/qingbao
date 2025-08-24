import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FeedbackButton } from '@/components/UserFeedback'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '智能情报分析平台',
  description: '基于AI的智能情报收集与分析系统，支持多源数据采集、智能报告生成和质量评估',
  keywords: ['AI', '情报分析', '报告生成', '数据采集', '智能分析'],
  authors: [{ name: '智能情报分析平台团队' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
            <FeedbackButton />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}