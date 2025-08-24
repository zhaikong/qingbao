import { LLMConfig, LLMResponse } from '../types';

export class OllamaProvider {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async generateResponse(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: config.temperature || 0.7,
            num_predict: config.maxTokens || 2000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API 错误: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.response,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: config.model,
        provider: 'ollama',
      };
    } catch (error) {
      throw new Error(`Ollama 调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`无法获取 Ollama 模型列表: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('获取 Ollama 模型列表失败:', error);
      return [];
    }
  }
}