// Gemini优先智能模型调度器 - 修复版本
// 添加超时机制、断路器、错误处理优化

import { GoogleGenerativeAI } from '@google/generative-ai'

export enum TaskType {
  WEB_SEARCH = 'web_search',
  DEEP_ANALYSIS = 'deep_analysis',
  REASONING = 'reasoning',
  CONTENT_GENERATION = 'content_generation',
  REAL_TIME_PROCESSING = 'real_time_processing',
  MULTIMODAL_ANALYSIS = 'multimodal_analysis'
}

export enum ModelPriority {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  FALLBACK = 'fallback'
}

export interface ModelConfig {
  name: string
  provider: 'gemini' | 'zhipu'
  priority: ModelPriority
  capabilities: TaskType[]
  maxTokens: number
  temperature: number
  enabled: boolean
  timeout: number // 添加超时配置
}

// 断路器状态
enum CircuitState {
  CLOSED = 'closed',     // 正常状态
  OPEN = 'open',         // 断开状态
  HALF_OPEN = 'half_open' // 半开状态
}

interface CircuitBreaker {
  state: CircuitState
  failureCount: number
  lastFailureTime: number
  timeout: number
  threshold: number
}

export class GeminiPrimarySchedulerFixed {
  private models: ModelConfig[] = [
    {
      name: 'gemini-2.5-pro',
      provider: 'gemini',
      priority: ModelPriority.PRIMARY,
      capabilities: [
        TaskType.WEB_SEARCH,
        TaskType.DEEP_ANALYSIS, 
        TaskType.REASONING,
        TaskType.MULTIMODAL_ANALYSIS,
        TaskType.CONTENT_GENERATION
      ],
      maxTokens: 2000000,
      temperature: 0.6,
      enabled: !!process.env.GEMINI_API_KEY,
      timeout: 30000 // 30秒超时
    },
    {
      name: 'gemini-2.5-flash',
      provider: 'gemini',
      priority: ModelPriority.PRIMARY,
      capabilities: [
        TaskType.WEB_SEARCH,
        TaskType.REAL_TIME_PROCESSING,
        TaskType.CONTENT_GENERATION
      ],
      maxTokens: 1000000,
      temperature: 0.8,
      enabled: !!process.env.GEMINI_API_KEY,
      timeout: 20000 // 20秒超时
    },
    {
      name: 'glm-4.5-air',
      provider: 'zhipu',
      priority: ModelPriority.SECONDARY,
      capabilities: [
        TaskType.CONTENT_GENERATION,
        TaskType.REAL_TIME_PROCESSING
      ],
      maxTokens: 128000,
      temperature: 0.7,
      enabled: !!process.env.ZHIPU_API_KEY,
      timeout: 15000 // 15秒超时
    }
  ]

  private geminiClient: GoogleGenerativeAI | null = null
  private zhipuClient: any = null
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()

  constructor() {
    this.initializeClients()
    this.initializeCircuitBreakers()
  }

  private async initializeClients() {
    try {
      if (process.env.GEMINI_API_KEY) {
        this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        console.log('✅ Gemini客户端初始化成功')
      }

      if (process.env.ZHIPU_API_KEY) {
        const { ZhipuClient } = await import('./zhipu-client')
        this.zhipuClient = new ZhipuClient()
        console.log('✅ 智谱AI客户端初始化成功')
      }
    } catch (error) {
      console.error('❌ 客户端初始化失败:', error)
    }
  }

  private initializeCircuitBreakers() {
    this.models.forEach(model => {
      this.circuitBreakers.set(model.name, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        timeout: 60000, // 1分钟恢复时间
        threshold: 3    // 3次失败后断开
      })
    })
  }

  // 检查断路器状态
  private checkCircuitBreaker(modelName: string): boolean {
    const breaker = this.circuitBreakers.get(modelName)
    if (!breaker) return true

    const now = Date.now()

    switch (breaker.state) {
      case CircuitState.CLOSED:
        return true
      
      case CircuitState.OPEN:
        if (now - breaker.lastFailureTime > breaker.timeout) {
          breaker.state = CircuitState.HALF_OPEN
          console.log(`🔄 断路器半开: ${modelName}`)
          return true
        }
        return false
      
      case CircuitState.HALF_OPEN:
        return true
      
      default:
        return true
    }
  }

  // 记录成功调用
  private recordSuccess(modelName: string) {
    const breaker = this.circuitBreakers.get(modelName)
    if (breaker) {
      breaker.failureCount = 0
      breaker.state = CircuitState.CLOSED
    }
  }

  // 记录失败调用
  private recordFailure(modelName: string) {
    const breaker = this.circuitBreakers.get(modelName)
    if (breaker) {
      breaker.failureCount++
      breaker.lastFailureTime = Date.now()
      
      if (breaker.failureCount >= breaker.threshold) {
        breaker.state = CircuitState.OPEN
        console.log(`⚠️ 断路器断开: ${modelName}`)
      }
    }
  }

  // 智能选择最佳模型（带断路器检查）
  selectBestModel(taskType: TaskType, contentLength?: number): ModelConfig | null {
    console.log(`🎯 为任务类型 ${taskType} 选择最佳模型...`)

    const availableModels = this.models.filter(model => 
      model.enabled && 
      model.capabilities.includes(taskType) &&
      this.checkCircuitBreaker(model.name)
    )

    if (availableModels.length === 0) {
      console.error(`❌ 没有可用的模型支持任务类型: ${taskType}`)
      return null
    }

    const priorityOrder = [ModelPriority.PRIMARY, ModelPriority.SECONDARY, ModelPriority.FALLBACK]
    
    for (const priority of priorityOrder) {
      const modelsWithPriority = availableModels.filter(model => model.priority === priority)
      
      if (modelsWithPriority.length > 0) {
        if (contentLength) {
          const suitableModel = modelsWithPriority.find(model => model.maxTokens >= contentLength * 1.5)
          if (suitableModel) {
            console.log(`✅ 选择模型: ${suitableModel.name} (优先级: ${priority})`)
            return suitableModel
          }
        } else {
          const selectedModel = modelsWithPriority[0]
          console.log(`✅ 选择模型: ${selectedModel.name} (优先级: ${priority})`)
          return selectedModel
        }
      }
    }

    const fallbackModel = availableModels[0]
    console.log(`⚠️ 使用备选模型: ${fallbackModel.name}`)
    return fallbackModel
  }

  // 带超时的任务执行
  async executeTask(
    taskType: TaskType,
    prompt: string,
    options: {
      maxTokens?: number
      temperature?: number
      includeWebSearch?: boolean
      systemPrompt?: string
      timeout?: number
    } = {}
  ): Promise<string> {
    const model = this.selectBestModel(taskType, prompt.length)
    
    if (!model) {
      throw new Error(`无法找到支持任务类型 ${taskType} 的模型`)
    }

    console.log(`🚀 使用 ${model.name} 执行 ${taskType} 任务`)

    const timeout = options.timeout || model.timeout
    
    try {
      // 使用Promise.race实现超时控制
      const taskPromise = model.provider === 'gemini' 
        ? this.executeGeminiTask(model, prompt, options)
        : this.executeZhipuTask(model, prompt, options)

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`任务超时: ${timeout}ms`))
        }, timeout)
      })

      const result = await Promise.race([taskPromise, timeoutPromise])
      
      // 记录成功
      this.recordSuccess(model.name)
      return result

    } catch (error) {
      console.error(`❌ ${model.name} 执行失败:`, error)
      
      // 记录失败
      this.recordFailure(model.name)
      
      // 尝试使用备选模型
      const fallbackModel = this.selectFallbackModel(taskType, model)
      if (fallbackModel && fallbackModel.name !== model.name) {
        console.log(`🔄 尝试备选模型: ${fallbackModel.name}`)
        
        // 递归调用，但限制递归深度
        const recursionDepth = (options as any)._recursionDepth || 0
        if (recursionDepth < 2) {
          return await this.executeTask(taskType, prompt, {
            ...options,
            _recursionDepth: recursionDepth + 1
          })
        }
      }
      
      throw error
    }
  }

  // 执行Gemini任务（优化版）
  private async executeGeminiTask(
    model: ModelConfig,
    prompt: string,
    options: any
  ): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini客户端未初始化')
    }

    try {
      const geminiModel = this.geminiClient.getGenerativeModel({ 
        model: model.name,
        generationConfig: {
          maxOutputTokens: Math.min(options.maxTokens || model.maxTokens, model.maxTokens),
          temperature: options.temperature || model.temperature
        }
      })

      let fullPrompt = prompt
      
      if (options.systemPrompt) {
        fullPrompt = `${options.systemPrompt}\n\n${prompt}`
      }

      if (options.includeWebSearch && model.capabilities.includes(TaskType.WEB_SEARCH)) {
        fullPrompt = `请使用网络搜索功能获取最新信息，然后回答以下问题：\n\n${fullPrompt}`
      }

      const result = await geminiModel.generateContent(fullPrompt)
      const response = await result.response
      return response.text()

    } catch (error) {
      console.error(`Gemini任务执行失败:`, error)
      throw error
    }
  }

  // 执行智谱AI任务（优化版）
  private async executeZhipuTask(
    model: ModelConfig,
    prompt: string,
    options: any
  ): Promise<string> {
    if (!this.zhipuClient) {
      throw new Error('智谱AI客户端未初始化')
    }

    try {
      const messages = []
      
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        })
      }

      messages.push({
        role: 'user',
        content: prompt
      })

      const response = await this.zhipuClient.chat({
        model: model.name,
        messages,
        max_tokens: Math.min(options.maxTokens || model.maxTokens, model.maxTokens),
        temperature: options.temperature || model.temperature
      })

      return response.choices[0].message.content

    } catch (error) {
      console.error(`智谱AI任务执行失败:`, error)
      throw error
    }
  }

  // 选择备选模型（优化版）
  private selectFallbackModel(taskType: TaskType, failedModel: ModelConfig): ModelConfig | null {
    const availableModels = this.models.filter(model => 
      model.enabled && 
      model.capabilities.includes(taskType) &&
      model.name !== failedModel.name &&
      this.checkCircuitBreaker(model.name)
    )

    if (availableModels.length === 0) {
      return null
    }

    // 优先选择不同提供商的模型
    const differentProviderModels = availableModels.filter(model => 
      model.provider !== failedModel.provider
    )

    if (differentProviderModels.length > 0) {
      return differentProviderModels[0]
    }

    return availableModels[0]
  }

  // 获取模型状态（包含断路器状态）
  getModelStatus() {
    return {
      geminiAvailable: !!this.geminiClient,
      zhipuAvailable: !!this.zhipuClient,
      enabledModels: this.models.filter(model => model.enabled),
      totalModels: this.models.length,
      primaryModels: this.models.filter(model => 
        model.enabled && model.priority === ModelPriority.PRIMARY
      ).length,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([name, breaker]) => ({
        modelName: name,
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime
      }))
    }
  }

  // 重置断路器
  resetCircuitBreaker(modelName: string) {
    const breaker = this.circuitBreakers.get(modelName)
    if (breaker) {
      breaker.state = CircuitState.CLOSED
      breaker.failureCount = 0
      breaker.lastFailureTime = 0
      console.log(`🔄 重置断路器: ${modelName}`)
    }
  }

  // 批量处理任务（带并发控制）
  async batchExecute(
    tasks: Array<{
      type: TaskType
      prompt: string
      options?: any
    }>,
    concurrency: number = 3
  ): Promise<Array<{ success: boolean; result?: string; error?: string }>> {
    const results: Array<{ success: boolean; result?: string; error?: string }> = []
    
    // 分批处理，控制并发数
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (task) => {
        try {
          const result = await this.executeTask(task.type, task.prompt, task.options)
          return { success: true, result }
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }
}

// 导出修复版本的单例实例
export const geminiPrimarySchedulerFixed = new GeminiPrimarySchedulerFixed()