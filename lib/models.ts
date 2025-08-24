export interface ModelConfig {
  id: string
  name: string
  description: string
  provider: 'ollama' | 'zhipu' | 'openai'
  modelName: string
  maxTokens: number
  temperature: number
  capabilities: string[]
  endpoint?: string
  apiKey?: string
  pricing?: {
    input: number  // 每千token价格
    output: number
  }
}

// Ollama配置
export const OLLAMA_CONFIG = {
  baseUrl: 'http://localhost:11434',
  timeout: 30000
}

// 本地Ollama模型配置
export const LOCAL_MODELS: ModelConfig[] = [
  {
    id: 'qwen3-8b',
    name: 'Qwen3 8B (本地)',
    description: '阿里巴巴开源的中文大语言模型，擅长中文理解和生成',
    provider: 'ollama',
    modelName: 'qwen3:8b',
    maxTokens: 8192,
    temperature: 0.7,
    capabilities: ['中文理解', '文本生成', '对话交互', '知识问答']
  },
  {
    id: 'gemma3-12b',
    name: 'Gemma3 12B (本地)',
    description: 'Google开源的高性能语言模型，具备强大的推理能力',
    provider: 'ollama',
    modelName: 'gemma3:12b',
    maxTokens: 8192,
    temperature: 0.7,
    capabilities: ['逻辑推理', '代码生成', '数学计算', '多语言支持']
  }
]

// 智谱AI云端模型配置
export const ZHIPU_MODELS: ModelConfig[] = [
  {
    id: 'glm-4-plus',
    name: 'GLM-4-Plus',
    description: '智谱AI最新一代大模型，具备强大的理解和生成能力',
    provider: 'zhipu',
    modelName: 'glm-4-plus',
    maxTokens: 128000,
    temperature: 0.7,
    capabilities: ['中文理解', '多轮对话', '代码生成', '数学推理', '文档分析'],
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    pricing: {
      input: 0.05,   // 5分/千token
      output: 0.05
    }
  },
  {
    id: 'glm-4-0520',
    name: 'GLM-4-0520',
    description: '智谱AI高性能模型，平衡性能与成本',
    provider: 'zhipu',
    modelName: 'glm-4-0520',
    maxTokens: 128000,
    temperature: 0.7,
    capabilities: ['中文理解', '逻辑推理', '创意写作', '知识问答'],
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    pricing: {
      input: 0.01,   // 1分/千token
      output: 0.01
    }
  },
  {
    id: 'glm-4-long',
    name: 'GLM-4-Long',
    description: '智谱AI长文本模型，支持超长上下文处理',
    provider: 'zhipu',
    modelName: 'glm-4-long',
    maxTokens: 1000000,
    temperature: 0.7,
    capabilities: ['长文本理解', '文档分析', '信息提取', '内容总结'],
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    pricing: {
      input: 0.01,   // 1分/千token
      output: 0.01
    }
  },
  {
    id: 'glm-4-flashx',
    name: 'GLM-4-FlashX',
    description: '智谱AI快速响应模型，适合实时交互场景',
    provider: 'zhipu',
    modelName: 'glm-4-flashx',
    maxTokens: 128000,
    temperature: 0.7,
    capabilities: ['快速响应', '实时对话', '轻量推理'],
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    pricing: {
      input: 0.001,  // 0.1分/千token
      output: 0.001
    }
  }
]

// 所有可用模型
export const ALL_MODELS: ModelConfig[] = [
  ...LOCAL_MODELS,
  ...ZHIPU_MODELS
]

// 根据ID获取模型配置
export function getModelById(id: string): ModelConfig | undefined {
  return ALL_MODELS.find(model => model.id === id)
}

// 根据提供商获取模型列表
export function getModelsByProvider(provider: ModelConfig['provider']): ModelConfig[] {
  return ALL_MODELS.filter(model => model.provider === provider)
}

// 检查模型是否需要API密钥
export function requiresApiKey(modelId: string): boolean {
  const model = getModelById(modelId)
  return model?.provider === 'zhipu' || model?.provider === 'openai'
}

// 获取模型显示名称
export function getModelDisplayName(modelId: string): string {
  const model = getModelById(modelId)
  return model?.name || modelId
}

// 计算预估成本
export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getModelById(modelId)
  if (!model?.pricing) return 0
  
  const inputCost = (inputTokens / 1000) * model.pricing.input
  const outputCost = (outputTokens / 1000) * model.pricing.output
  return inputCost + outputCost
}