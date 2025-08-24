import { OLLAMA_CONFIG, LOCAL_MODELS, ModelConfig } from './models'

export interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateRequest {
  model: string
  prompt: string
  system?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export class OllamaClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = OLLAMA_CONFIG.baseUrl
    this.timeout = OLLAMA_CONFIG.timeout
  }

  // 检查Ollama服务是否可用
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch (error) {
      console.error('Ollama健康检查失败:', error)
      return false
    }
  }

  // 获取可用模型列表
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.models?.map((model: any) => model.name) || []
    } catch (error) {
      console.error('获取模型列表失败:', error)
      return []
    }
  }

  // 生成文本
  async generate(request: GenerateRequest): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          system: request.system,
          options: {
            temperature: request.temperature || 0.7,
            num_predict: request.max_tokens || 2048,
          },
          stream: false
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`Ollama API错误: ${response.status} ${response.statusText}`)
      }

      const data: OllamaResponse = await response.json()
      return data.response
    } catch (error) {
      console.error('文本生成失败:', error)
      throw new Error(`文本生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 流式生成文本
  async generateStream(
    request: GenerateRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          system: request.system,
          options: {
            temperature: request.temperature || 0.7,
            num_predict: request.max_tokens || 2048,
          },
          stream: true
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`Ollama API错误: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OllamaResponse = JSON.parse(line)
              if (data.response) {
                onChunk(data.response)
              }
              if (data.done) {
                return
              }
            } catch (e) {
              console.warn('解析流数据失败:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('流式生成失败:', error)
      throw new Error(`流式生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 聊天对话
  async chat(messages: ChatMessage[], modelId: string): Promise<string> {
    const model = LOCAL_MODELS.find(m => m.id === modelId)
    if (!model) {
      throw new Error(`未找到模型: ${modelId}`)
    }

    // 构建提示词
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const conversationHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
      .join('\n')

    const prompt = conversationHistory + '\n助手: '

    return this.generate({
      model: model.modelName,
      prompt,
      system: systemMessage,
      temperature: model.temperature,
      max_tokens: model.maxTokens
    })
  }
}

// 单例实例
export const ollamaClient = new OllamaClient()