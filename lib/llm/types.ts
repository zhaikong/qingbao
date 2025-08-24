// 大模型相关的类型定义

export interface LLMConfig {
  provider: 'ollama' | 'openai' | 'zhipu' | 'anthropic' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export interface LLMProvider {
  name: string;
  provider: LLMConfig['provider'];
  models: string[];
  requiresApiKey: boolean;
  defaultConfig: Partial<LLMConfig>;
}