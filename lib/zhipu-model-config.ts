/**
 * 智谱AI GLM-4.5系列模型配置和管理
 * 根据模型能力进行智能任务分配
 */

interface ZhipuModelConfig {
  name: string
  modelId: string
  description: string
  capabilities: string[]
  optimalUseCases: string[]
  costLevel: 'low' | 'medium' | 'high'
  maxTokens: number
  supportVision: boolean
  supportThinking: boolean
}

/**
 * GLM-4.5系列模型配置
 */
const GLM_MODELS: Record<string, ZhipuModelConfig> = {
  'glm-4.5-air': {
    name: 'GLM-4.5-Air',
    modelId: 'glm-4.5-air',
    description: 'GLM-4.5的轻量版，兼顾性能与性价比，可灵活切换混合思考模式',
    capabilities: [
      '文本生成', 
      '语言理解', 
      '逻辑推理', 
      '多语言支持',
      '关键词提取',
      '情感分析'
    ],
    optimalUseCases: [
      '关键词生成',
      '快速文本分析', 
      '多语言搜索策略',
      '内容摘要',
      '实时数据处理'
    ],
    costLevel: 'low',
    maxTokens: 4000,
    supportVision: false,
    supportThinking: true
  },
  
  'glm-4.5v': {
    name: 'GLM-4.5V',
    modelId: 'glm-4.5v',
    description: '目前100B级别开源VLM模型性能最强，覆盖图像、视频、文档理解及GUI等核心任务',
    capabilities: [
      '视觉理解',
      '图像分析', 
      '文档解析',
      'GUI识别',
      '多模态推理',
      '视频分析'
    ],
    optimalUseCases: [
      '网页截图分析',
      '文档内容提取',
      '图表数据解读',
      '界面元素识别',
      '多媒体情报分析'
    ],
    costLevel: 'medium',
    maxTokens: 4000,
    supportVision: true,
    supportThinking: true
  },
  
  'glm-4.1v-thinking-flashx': {
    name: 'GLM-4.1V-Thinking-FlashX',
    modelId: 'glm-4.1v-thinking-flashx',
    description: '快速推理模型，支持思考模式，适合复杂逻辑分析',
    capabilities: [
      '深度思考',
      '逻辑推理',
      '复杂分析',
      '策略规划',
      '问题解决'
    ],
    optimalUseCases: [
      '复杂情报分析',
      '战略规划',
      '风险评估',
      '决策支持',
      '深度报告生成'
    ],
    costLevel: 'medium',
    maxTokens: 8000,
    supportVision: false,
    supportThinking: true
  }
}

/**
 * 智能模型选择器
 * 根据任务类型自动选择最适合的模型
 */
class ZhipuModelSelector {
  
  /**
   * 根据任务类型选择最佳模型
   */
  static selectOptimalModel(taskType: string, requirements: {
    needVision?: boolean
    needThinking?: boolean
    priority?: 'speed' | 'quality' | 'cost'
    complexity?: 'simple' | 'medium' | 'complex'
  } = {}): ZhipuModelConfig {
    
    // 如果需要视觉能力，优先选择GLM-4.5V
    if (requirements.needVision) {
      return GLM_MODELS['glm-4.5v']
    }
    
    // 如果是复杂分析任务，选择thinking模型
    if (requirements.complexity === 'complex' || requirements.needThinking) {
      return GLM_MODELS['glm-4.1v-thinking-flashx']
    }
    
    // 根据优先级选择
    switch (requirements.priority) {
      case 'cost':
      case 'speed':
        return GLM_MODELS['glm-4.5-air'] // 高性价比，速度快
        
      case 'quality':
        return GLM_MODELS['glm-4.1v-thinking-flashx'] // 深度思考
        
      default:
        // 默认选择平衡性能的GLM-4.5-Air
        return GLM_MODELS['glm-4.5-air']
    }
  }
  
  /**
   * 根据具体任务选择模型
   */
  static selectByTask(task: 'keyword_generation' | 'content_analysis' | 'report_generation' | 'image_analysis' | 'strategic_analysis'): ZhipuModelConfig {
    
    const taskModelMap = {
      keyword_generation: 'glm-4.5-air',        // 关键词生成：快速、高效
      content_analysis: 'glm-4.5-air',          // 内容分析：平衡性能
      report_generation: 'glm-4.1v-thinking-flashx', // 报告生成：深度思考
      image_analysis: 'glm-4.5v',               // 图像分析：视觉能力
      strategic_analysis: 'glm-4.1v-thinking-flashx' // 战略分析：复杂推理
    }
    
    return GLM_MODELS[taskModelMap[task]]
  }
  
  /**
   * 获取所有可用模型
   */
  static getAllModels(): ZhipuModelConfig[] {
    return Object.values(GLM_MODELS)
  }
  
  /**
   * 获取模型能力矩阵
   */
  static getCapabilityMatrix(): Record<string, string[]> {
    const matrix: Record<string, string[]> = {}
    
    Object.entries(GLM_MODELS).forEach(([key, model]) => {
      matrix[key] = model.capabilities
    })
    
    return matrix
  }
}

/**
 * 智谱AI请求配置生成器
 */
class ZhipuRequestBuilder {
  
  /**
   * 生成标准聊天请求
   */
  static buildChatRequest(
    model: ZhipuModelConfig,
    messages: Array<{role: string, content: string}>,
    options: {
      temperature?: number
      maxTokens?: number
      enableThinking?: boolean
    } = {}
  ) {
    const request: any = {
      model: model.modelId,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: Math.min(options.maxTokens ?? 2000, model.maxTokens)
    }
    
    // 如果模型支持思考模式且启用
    if (model.supportThinking && options.enableThinking) {
      request.thinking = true
    }
    
    return request
  }
  
  /**
   * 生成多模态请求（图像+文本）
   */
  static buildVisionRequest(
    model: ZhipuModelConfig,
    textPrompt: string,
    imageData: string, // base64 或 URL
    options: {
      temperature?: number
      maxTokens?: number
    } = {}
  ) {
    if (!model.supportVision) {
      throw new Error(`模型 ${model.name} 不支持视觉功能`)
    }
    
    return {
      model: model.modelId,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: textPrompt },
            { type: "image_url", image_url: { url: imageData } }
          ]
        }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: Math.min(options.maxTokens ?? 1000, model.maxTokens)
    }
  }
}

/**
 * 任务-模型映射策略
 */
const TASK_MODEL_STRATEGY = {
  // 情报收集阶段
  intelligence_collection: {
    keyword_generation: 'glm-4.5-air',      // 快速关键词生成
    search_strategy: 'glm-4.5-air',         // 搜索策略制定
    content_extraction: 'glm-4.5-air',      // 内容提取
  },
  
  // 分析处理阶段  
  analysis_processing: {
    content_analysis: 'glm-4.5-air',        // 基础内容分析
    sentiment_analysis: 'glm-4.5-air',      // 情感分析
    entity_extraction: 'glm-4.5-air',       // 实体提取
    trend_analysis: 'glm-4.1v-thinking-flashx', // 趋势分析（复杂）
  },
  
  // 深度分析阶段
  deep_analysis: {
    strategic_analysis: 'glm-4.1v-thinking-flashx', // 战略分析
    risk_assessment: 'glm-4.1v-thinking-flashx',    // 风险评估
    scenario_planning: 'glm-4.1v-thinking-flashx',  // 情景规划
  },
  
  // 多媒体分析
  multimedia_analysis: {
    image_analysis: 'glm-4.5v',            // 图像分析
    document_parsing: 'glm-4.5v',          // 文档解析
    chart_reading: 'glm-4.5v',             // 图表解读
  },
  
  // 报告生成阶段
  report_generation: {
    summary_generation: 'glm-4.5-air',     // 摘要生成
    detailed_report: 'glm-4.1v-thinking-flashx', // 详细报告
    executive_summary: 'glm-4.1v-thinking-flashx', // 执行摘要
  }
}

export { ZhipuModelConfig, ZhipuModelSelector, ZhipuRequestBuilder, GLM_MODELS, TASK_MODEL_STRATEGY }