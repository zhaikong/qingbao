import { LLMConfig, LLMResponse, LLMProvider } from './types';
import { OllamaProvider } from './providers/ollama';
import { ZhipuProvider } from './providers/zhipu';
import { OpenAIProvider } from './providers/openai';

export class LLMManager {
  private providers: Map<string, any> = new Map();
  private configs: Map<string, LLMConfig> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // 从环境变量加载配置
    const zhipuKey = process.env.ZHIPU_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    // 初始化智谱AI
    if (zhipuKey) {
      this.providers.set('zhipu', new ZhipuProvider(zhipuKey));
    }

    // 初始化OpenAI
    if (openaiKey) {
      this.providers.set('openai', new OpenAIProvider(openaiKey));
    }

    // 初始化Ollama（本地模型）
    this.providers.set('ollama', new OllamaProvider(ollamaUrl));
  }

  /**
   * 获取所有可用的模型提供商
   */
  getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = [];

    if (this.providers.has('zhipu')) {
      providers.push({
        name: '智谱AI',
        provider: 'zhipu',
        models: ['glm-4', 'glm-4-air', 'glm-4-flash', 'glm-3-turbo'],
        requiresApiKey: true,
        defaultConfig: {
          temperature: 0.7,
          maxTokens: 2000,
        },
      });
    }

    if (this.providers.has('openai')) {
      providers.push({
        name: 'OpenAI',
        provider: 'openai',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
        requiresApiKey: true,
        defaultConfig: {
          temperature: 0.7,
          maxTokens: 2000,
        },
      });
    }

    if (this.providers.has('ollama')) {
      providers.push({
        name: 'Ollama (本地)',
        provider: 'ollama',
        models: ['llama3', 'llama3:8b', 'llama3:70b', 'qwen2', 'gemma2'], // 常见模型，实际可动态获取
        requiresApiKey: false,
        defaultConfig: {
          temperature: 0.7,
          maxTokens: 2000,
        },
      });
    }

    return providers;
  }

  /**
   * 生成文本响应
   */
  async generateResponse(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`不支持的模型提供商: ${config.provider}`);
    }

    try {
      return await provider.generateResponse(prompt, config);
    } catch (error) {
      throw new Error(`模型调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取指定提供商的可用模型列表
   */
  async getModelsForProvider(providerName: string): Promise<string[]> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return [];
    }

    if (providerName === 'ollama' && provider.listModels) {
      try {
        return await provider.listModels();
      } catch (error) {
        console.error('获取 Ollama 模型列表失败:', error);
        return ['llama3', 'llama3:8b', 'qwen2']; // 返回默认列表
      }
    }

    if (provider.getAvailableModels) {
      return provider.getAvailableModels();
    }

    return [];
  }

  /**
   * 测试模型连接
   */
  async testConnection(config: LLMConfig): Promise<boolean> {
    try {
      const response = await this.generateResponse('测试连接', config);
      return response.content.length > 0;
    } catch (error) {
      console.error('模型连接测试失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const llmManager = new LLMManager();