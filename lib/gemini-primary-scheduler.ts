// Gemini优先智能模型调度器
// 充分利用Gemini的网络搜索、分析、推理能力，智谱AI作为备选

import { GoogleGenerativeAI } from '@google/generative-ai'

export enum TaskType {
  WEB_SEARCH = 'web_search',           // 网络搜索任务
  DEEP_ANALYSIS = 'deep_analysis',     // 深度分析任务  
  REASONING = 'reasoning',             // 推理判断任务
  CONTENT_GENERATION = 'content_generation', // 内容生成任务
  REAL_TIME_PROCESSING = 'real_time_processing', // 实时处理任务
  MULTIMODAL_ANALYSIS = 'multimodal_analysis'    // 多模态分析任务
}

export enum ModelPriority {
  PRIMARY = 'primary',     // 主力模型
  SECONDARY = 'secondary', // 备选模型
  FALLBACK = 'fallback'    // 兜底模型
}

export interface ModelConfig {
  name: string
  provider: 'gemini' | 'zhipu'
  priority: ModelPriority
  capabilities: TaskType[]
  maxTokens: number
  temperature: number
  enabled: boolean
}

export class GeminiPrimaryScheduler {
  private models: ModelConfig[] = [
    // 主力模型 - Gemini系列
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
      enabled: !!process.env.GEMINI_API_KEY
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
      enabled: !!process.env.GEMINI_API_KEY
    },

    // 备选模型 - 智谱AI系列
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
      enabled: !!process.env.ZHIPU_API_KEY
    },
    {
      name: 'glm-4.5-v',
      provider: 'zhipu',
      priority: ModelPriority.FALLBACK,
      capabilities: [
        TaskType.MULTIMODAL_ANALYSIS,
        TaskType.DEEP_ANALYSIS
      ],
      maxTokens: 128000,
      temperature: 0.6,
      enabled: !!process.env.ZHIPU_API_KEY
    },
    {
      name: 'glm-4.1v-thinking-flashx',
      provider: 'zhipu',
      priority: ModelPriority.FALLBACK,
      capabilities: [
        TaskType.REASONING,
        TaskType.REAL_TIME_PROCESSING
      ],
      maxTokens: 128000,
      temperature: 0.5,
      enabled: !!process.env.ZHIPU_API_KEY
    }
  ]

  private geminiClient: GoogleGenerativeAI | null = null
  private zhipuClient: any = null

  constructor() {
    this.initializeClients()
  }

  private async initializeClients() {
    // 初始化Gemini客户端
    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      console.log('✅ Gemini客户端初始化成功')
    }

    // 初始化智谱AI客户端
    if (process.env.ZHIPU_API_KEY) {
      try {
        const { ZhipuClient } = await import('./zhipu-client')
        this.zhipuClient = new ZhipuClient()
        console.log('✅ 智谱AI客户端初始化成功')
      } catch (error) {
        console.warn('⚠️ 智谱AI客户端初始化失败:', error)
      }
    }
  }

  // 智能选择最佳模型
  selectBestModel(taskType: TaskType, contentLength?: number): ModelConfig | null {
    console.log(`🎯 为任务类型 ${taskType} 选择最佳模型...`)

    // 过滤支持该任务类型且已启用的模型
    const availableModels = this.models.filter(model => 
      model.enabled && 
      model.capabilities.includes(taskType)
    )

    if (availableModels.length === 0) {
      console.error(`❌ 没有可用的模型支持任务类型: ${taskType}`)
      return null
    }

    // 按优先级排序：PRIMARY > SECONDARY > FALLBACK
    const priorityOrder = [ModelPriority.PRIMARY, ModelPriority.SECONDARY, ModelPriority.FALLBACK]
    
    for (const priority of priorityOrder) {
      const modelsWithPriority = availableModels.filter(model => model.priority === priority)
      
      if (modelsWithPriority.length > 0) {
        // 如果有内容长度要求，选择token容量足够的模型
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

    // 如果没有找到合适的模型，返回第一个可用的
    const fallbackModel = availableModels[0]
    console.log(`⚠️ 使用备选模型: ${fallbackModel.name}`)
    return fallbackModel
  }

  // 执行任务
  async executeTask(
    taskType: TaskType,
    prompt: string,
    options: {
      maxTokens?: number
      temperature?: number
      includeWebSearch?: boolean
      systemPrompt?: string
    } = {}
  ): Promise<string> {
    const model = this.selectBestModel(taskType, prompt.length)
    
    if (!model) {
      throw new Error(`无法找到支持任务类型 ${taskType} 的模型`)
    }

    console.log(`🚀 使用 ${model.name} 执行 ${taskType} 任务`)

    try {
      if (model.provider === 'gemini') {
        return await this.executeGeminiTask(model, prompt, options)
      } else if (model.provider === 'zhipu') {
        return await this.executeZhipuTask(model, prompt, options)
      } else {
        throw new Error(`不支持的模型提供商: ${model.provider}`)
      }
    } catch (error) {
      console.error(`❌ ${model.name} 执行失败:`, error)
      
      // 尝试使用备选模型
      const fallbackModel = this.selectFallbackModel(taskType, model)
      if (fallbackModel) {
        console.log(`🔄 尝试备选模型: ${fallbackModel.name}`)
        return await this.executeTask(taskType, prompt, options)
      }
      
      throw error
    }
  }

  // 执行Gemini任务
  private async executeGeminiTask(
    model: ModelConfig,
    prompt: string,
    options: any
  ): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini客户端未初始化')
    }

    const geminiModel = this.geminiClient.getGenerativeModel({ 
      model: model.name,
      generationConfig: {
        maxOutputTokens: options.maxTokens || model.maxTokens,
        temperature: options.temperature || model.temperature
      }
    })

    // 构建完整的提示词
    let fullPrompt = prompt
    
    if (options.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\\n\\n${prompt}`
    }

    // 如果需要网络搜索，添加搜索指令
    if (options.includeWebSearch && model.capabilities.includes(TaskType.WEB_SEARCH)) {
      fullPrompt = `请使用网络搜索功能获取最新信息，然后回答以下问题：\\n\\n${fullPrompt}`
    }

    const result = await geminiModel.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  }

  // 执行智谱AI任务
  private async executeZhipuTask(
    model: ModelConfig,
    prompt: string,
    options: any
  ): Promise<string> {
    if (!this.zhipuClient) {
      throw new Error('智谱AI客户端未初始化')
    }

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
      max_tokens: options.maxTokens || model.maxTokens,
      temperature: options.temperature || model.temperature
    })

    return response.choices[0].message.content
  }

  // 选择备选模型
  private selectFallbackModel(taskType: TaskType, failedModel: ModelConfig): ModelConfig | null {
    const availableModels = this.models.filter(model => 
      model.enabled && 
      model.capabilities.includes(taskType) &&
      model.name !== failedModel.name
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

  // 获取模型状态
  getModelStatus() {
    return {
      geminiAvailable: !!this.geminiClient,
      zhipuAvailable: !!this.zhipuClient,
      enabledModels: this.models.filter(model => model.enabled),
      totalModels: this.models.length,
      primaryModels: this.models.filter(model => 
        model.enabled && model.priority === ModelPriority.PRIMARY
      ).length
    }
  }

  // 批量处理任务
  async batchExecute(
    tasks: Array<{
      type: TaskType
      prompt: string
      options?: any
    }>
  ): Promise<Array<{ success: boolean; result?: string; error?: string }>> {
    const results = []

    for (const task of tasks) {
      try {
        const result = await this.executeTask(task.type, task.prompt, task.options)
        results.push({ success: true, result })
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }
}

// 导出单例实例
export const geminiPrimaryScheduler = new GeminiPrimaryScheduler()