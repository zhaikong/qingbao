import { LLMConfig, LLMResponse } from '../types';
import jwt from 'jsonwebtoken';

export class ZhipuProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log(`🔧 智谱AI初始化，API密钥长度: ${apiKey?.length || 0}`);
  }

  private generateToken(): string {
    if (!this.apiKey) {
      throw new Error('智谱AI API密钥未配置')
    }
    
    console.log(`🔑 开始生成JWT token，原始密钥: ${this.apiKey.substring(0, 20)}...`);
    
    // 检查API密钥格式
    const parts = this.apiKey.split('.')
    if (parts.length !== 2) {
      throw new Error(`智谱AI API密钥格式不正确，应为 id.secret 格式，当前部分数: ${parts.length}`)
    }
    
    const [id, secret] = parts
    if (!id || !secret) {
      throw new Error(`智谱AI API密钥ID或Secret为空，ID长度: ${id?.length || 0}, Secret长度: ${secret?.length || 0}`)
    }
    
    console.log(`🔑 API密钥解析成功，ID: ${id.substring(0, 8)}..., Secret: ${secret.substring(0, 8)}...`);
    
    const payload = {
      iss: id,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1小时过期
      timestamp: Math.floor(Date.now() / 1000),
    }
    
    try {
      const token = jwt.sign(payload, secret, { algorithm: 'HS256' })
      console.log(`✅ JWT生成成功，token长度: ${token.length}`);
      return token
    } catch (error) {
      console.error(`❌ JWT生成失败:`, error);
      throw new Error(`智谱AI JWT生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async generateResponse(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    try {
      const token = this.generateToken();
      
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`智谱AI API 错误: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: config.model,
        provider: 'zhipu',
      };
    } catch (error) {
      throw new Error(`智谱AI 调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  getAvailableModels(): string[] {
    return ['glm-4', 'glm-4-air', 'glm-4-flash', 'glm-3-turbo'];
  }
}