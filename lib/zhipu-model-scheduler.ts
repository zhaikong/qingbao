// 智谱AI分级部署策略实现

export enum TaskType {
  BASIC_TEXT = 'basic_text',           // 基础文本情报
  IMAGE_VIDEO = 'image_video',         // 图像/视频分析
  REALTIME_RESPONSE = 'realtime_response' // 实时响应任务
}

export interface ZhipuModelConfig {
  modelName: string
  apiKey: string
  maxTokens: number
  temperature: number
  description: string
}

export class ZhipuModelScheduler {
  private models: Record<TaskType, ZhipuModelConfig> = {
    [TaskType.BASIC_TEXT]: {
      modelName: process.env.GLM_4_5_AIR_MODEL || 'glm-4.5-air',
      apiKey: process.env.ZHIPU_API_KEY || '',
      maxTokens: 4000,
      temperature: 0.7,
      description: '第一级：GLM-4.5-Air处理基础文本情报'
    },
    [TaskType.IMAGE_VIDEO]: {
      modelName: process.env.GLM_4_5_V_MODEL || 'glm-4.5-v',
      apiKey: process.env.ZHIPU_API_KEY || '',
      maxTokens: 6000,
      temperature: 0.5,
      description: '第二级：GLM-4.5-V进行深度图像/视频分析'
    },
    [TaskType.REALTIME_RESPONSE]: {
      modelName: process.env.GLM_4_1V_THINKING_MODEL || 'glm-4.1v-thinking-flashx',
      apiKey: process.env.ZHIPU_API_KEY || '',
      maxTokens: 8000,
      temperature: 0.3,
      description: '第三级：GLM-4.1V-Thinking-FlashX处理实时响应任务'
    }
  }

  // 根据任务类型选择合适的模型
  selectModel(taskType: TaskType): ZhipuModelConfig {
    const model = this.models[taskType]
    console.log(`🤖 选择模型: ${model.modelName} - ${model.description}`)
    return model
  }

  // 调用智谱AI模型
  async callModel(taskType: TaskType, prompt: string, systemPrompt?: string): Promise<string> {
    const model = this.selectModel(taskType)
    
    if (!model.apiKey) {
      throw new Error('智谱AI API密钥未配置')
    }

    try {
      console.log(`🚀 调用 ${model.modelName} 处理任务...`)
      
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.modelName,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          max_tokens: model.maxTokens,
          temperature: model.temperature,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`智谱AI API调用失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const result = data.choices[0].message.content
        console.log(`✅ ${model.modelName} 处理完成，返回 ${result.length} 字符`)
        return result
      } else {
        throw new Error('智谱AI返回格式异常')
      }

    } catch (error) {
      console.error(`❌ ${model.modelName} 调用失败:`, error)
      throw error
    }
  }

  // 基础文本情报分析
  async analyzeBasicText(content: string): Promise<string> {
    const systemPrompt = `你是一个专业的情报分析师，专门处理基础文本情报。请对以下内容进行分析，提取关键信息、识别重要趋势，并提供简洁的分析结论。`
    
    return await this.callModel(TaskType.BASIC_TEXT, content, systemPrompt)
  }

  // 图像/视频深度分析
  async analyzeImageVideo(content: string, mediaUrl?: string): Promise<string> {
    const systemPrompt = `你是一个专业的多媒体情报分析师，专门处理图像和视频内容。请对以下内容进行深度分析，识别视觉元素、提取关键信息，并提供详细的分析报告。`
    
    const prompt = mediaUrl ? `${content}\n\n媒体文件: ${mediaUrl}` : content
    
    return await this.callModel(TaskType.IMAGE_VIDEO, prompt, systemPrompt)
  }

  // 实时响应任务处理
  async processRealtimeTask(content: string, urgency: 'high' | 'medium' | 'low' = 'medium'): Promise<string> {
    const systemPrompt = `你是一个专业的实时情报分析师，专门处理紧急和实时响应任务。请快速分析以下内容，提供即时的分析结论和行动建议。紧急程度: ${urgency}`
    
    return await this.callModel(TaskType.REALTIME_RESPONSE, content, systemPrompt)
  }

  // 获取所有模型状态
  getModelStatus() {
    return Object.entries(this.models).map(([taskType, config]) => ({
      taskType,
      modelName: config.modelName,
      hasApiKey: !!config.apiKey,
      description: config.description,
      maxTokens: config.maxTokens,
      temperature: config.temperature
    }))
  }
}

// 导出单例实例
export const zhipuModelScheduler = new ZhipuModelScheduler()