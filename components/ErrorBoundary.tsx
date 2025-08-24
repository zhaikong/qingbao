'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 记录错误到监控系统
    this.logErrorToService(error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // 发送到错误监控服务
    fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    }).catch(err => {
      console.error('Failed to log error:', err)
    })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              系统出现错误
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              很抱歉，系统遇到了一个意外错误。我们已经记录了这个问题，请稍后重试。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">错误详情：</h3>
                <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                刷新页面
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                如果问题持续存在，请联系技术支持
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 简化的错误边界组件，用于特定组件
export function SimpleErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ErrorBoundary 
      fallback={
        fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <span>⚠️</span>
              <span className="font-medium">组件加载失败</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              请刷新页面重试，如果问题持续存在请联系技术支持。
            </p>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  )
}