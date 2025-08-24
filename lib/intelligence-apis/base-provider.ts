/**
 * 基础API提供商抽象类
 */

import { APIProvider, APIResponse, IntelligenceDataPoint, QueryOptions } from './types'

export abstract class BaseAPIProvider implements APIProvider {
  abstract name: string
  abstract category: 'security' | 'geopolitical' | 'business' | 'news'
  
  enabled: boolean = true
  
  abstract rateLimit: {
    requests: number
    period: 'minute' | 'hour' | 'day'
    remaining?: number
    resetTime?: number
  }

  protected cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  protected lastRequestTime: number = 0
  protected requestCount: number = 0
  protected rateLimitWindow: number = 0

  constructor(protected config: any = {}) {
    this.validateConfig()
  }

  /**
   * 核心查询方法 - 子类必须实现
   */
  abstract query(query: string, options?: QueryOptions): Promise<APIResponse<IntelligenceDataPoint[]>>

  /**
   * 获取API状态
   */
  async getStatus(): Promise<{ available: boolean; lastCheck: string; error?: string }> {
    try {
      // 执行简单的健康检查
      const testResult = await this.healthCheck()
      return {
        available: testResult,
        lastCheck: new Date().toISOString()
      }
    } catch (error: any) {
      return {
        available: false,
        lastCheck: new Date().toISOString(),
        error: error.message
      }
    }
  }

  /**
   * 健康检查 - 子类可以重写
   */
  protected async healthCheck(): Promise<boolean> {
    return this.enabled && this.validateConfig()
  }

  /**
   * 验证配置 - 子类应该重写
   */
  validateConfig(): boolean {
    return true
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 速率限制检查
   */
  protected async checkRateLimit(): Promise<boolean> {
    const now = Date.now()
    
    // 重置计数器（如果需要）
    if (this.shouldResetRateLimit(now)) {
      this.requestCount = 0
      this.rateLimitWindow = now
    }

    // 检查是否超出限制
    if (this.requestCount >= this.rateLimit.requests) {
      const waitTime = this.getWaitTime()
      if (waitTime > 0) {
        console.warn(`[${this.name}] 达到速率限制，等待 ${waitTime}ms`)
        await this.sleep(waitTime)
        return this.checkRateLimit() // 递归检查
      }
    }

    this.requestCount++
    this.lastRequestTime = now
    this.rateLimit.remaining = Math.max(0, this.rateLimit.requests - this.requestCount)
    
    return true
  }

  /**
   * 判断是否应该重置速率限制计数器
   */
  private shouldResetRateLimit(now: number): boolean {
    const windowMs = this.getRateLimitWindowMs()
    return now - this.rateLimitWindow >= windowMs
  }

  /**
   * 获取速率限制窗口时间（毫秒）
   */
  private getRateLimitWindowMs(): number {
    switch (this.rateLimit.period) {
      case 'minute': return 60 * 1000
      case 'hour': return 60 * 60 * 1000
      case 'day': return 24 * 60 * 60 * 1000
      default: return 60 * 1000
    }
  }

  /**
   * 计算需要等待的时间
   */
  private getWaitTime(): number {
    const windowMs = this.getRateLimitWindowMs()
    const elapsed = Date.now() - this.rateLimitWindow
    return Math.max(0, windowMs - elapsed)
  }

  /**
   * 缓存操作
   */
  protected getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data as T
  }

  protected setCached<T>(key: string, data: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  /**
   * HTTP请求辅助方法
   */
  protected async makeRequest(
    url: string, 
    options: RequestInit = {},
    retries: number = 3
  ): Promise<Response> {
    
    // 检查速率限制
    await this.checkRateLimit()

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)
        
        const response = await fetch(url, {
          signal: controller.signal,
          ...options,
          headers: {
            'User-Agent': 'OSINT-Intelligence-Platform/1.0',
            ...options.headers
          }
        })
        
        clearTimeout(timeoutId)

        // 更新速率限制信息
        this.updateRateLimitFromHeaders(response.headers)

        if (response.ok) {
          return response
        }

        // 处理速率限制
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
          
          console.warn(`[${this.name}] 速率限制，等待 ${waitTime}ms (尝试 ${attempt}/${retries})`)
          
          if (attempt < retries) {
            await this.sleep(waitTime)
            continue
          }
        }

        // 其他HTTP错误
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)

      } catch (error: any) {
        console.error(`[${this.name}] 请求失败 (尝试 ${attempt}/${retries}):`, error.message)
        
        if (attempt === retries) {
          throw error
        }
        
        // 指数退避
        const backoffTime = Math.pow(2, attempt) * 1000
        await this.sleep(backoffTime)
      }
    }

    throw new Error(`请求失败，已重试 ${retries} 次`)
  }

  /**
   * 从响应头更新速率限制信息
   */
  private updateRateLimitFromHeaders(headers: Headers): void {
    const remaining = headers.get('X-RateLimit-Remaining') || headers.get('X-Rate-Limit-Remaining')
    const reset = headers.get('X-RateLimit-Reset') || headers.get('X-Rate-Limit-Reset')

    if (remaining) {
      this.rateLimit.remaining = parseInt(remaining)
    }

    if (reset) {
      this.rateLimit.resetTime = parseInt(reset) * 1000 // 转换为毫秒
    }
  }

  /**
   * 生成缓存键
   */
  protected generateCacheKey(query: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : ''
    return `${this.name}:${query}:${optionsStr}`
  }

  /**
   * 创建标准化的API响应
   */
  protected createResponse<T>(
    success: boolean,
    data?: T,
    error?: string
  ): APIResponse<T> {
    return {
      success,
      data,
      error,
      rateLimitRemaining: this.rateLimit.remaining,
      rateLimitReset: this.rateLimit.resetTime,
      source: this.name,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 创建标准化的情报数据点
   */
  protected createDataPoint(
    id: string,
    category: 'security' | 'geopolitical' | 'business' | 'news',
    subcategory: string,
    content: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    confidence: number = 0.7
  ): IntelligenceDataPoint {
    return {
      id,
      timestamp: new Date().toISOString(),
      category,
      subcategory,
      severity,
      confidence,
      source: {
        name: this.name,
        reliability: this.getSourceReliability(),
        url: this.getSourceUrl?.()
      },
      content: {
        title: content.title || '',
        description: content.description || '',
        indicators: content.indicators || [],
        entities: content.entities || [],
        location: content.location,
        impact: content.impact,
        rawData: content
      },
      metadata: {
        tags: content.tags || [],
        classification: 'TLP:WHITE',
        relatedEvents: content.relatedEvents || []
      }
    }
  }

  /**
   * 获取数据源可靠性等级 - 子类应该重写
   */
  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'B' // 默认为B级
  }

  /**
   * 获取数据源URL - 子类可以重写
   */
  protected getSourceUrl?(): string

  /**
   * 睡眠函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 日志记录
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.name}] ${message}`
    
    switch (level) {
      case 'info':
        console.log(logMessage, data || '')
        break
      case 'warn':
        console.warn(logMessage, data || '')
        break
      case 'error':
        console.error(logMessage, data || '')
        break
    }
  }
}