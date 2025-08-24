// 核心服务层 (NEW)
// 统一接口定义 - 报告生成接口

export type LLMProvider = 'Zhipu' | 'Gemini' | 'Ollama';

export interface GeneratorCapabilities {
  // Define generator capabilities
}

export interface GenerationOptions {
  // Define generation options
}

export interface GenerationResult {
  // Define generation result
}

export interface TokenUsage {
  // Define token usage
}

export type Format = 'markdown' | 'pdf' | 'html';

export interface IReportGenerator {
  readonly provider: LLMProvider
  readonly capabilities: GeneratorCapabilities

  isAvailable(): Promise<boolean>
  generate(prompt: string, options?: GenerationOptions): Promise<GenerationResult>
  getTokenUsage(): TokenUsage
  getSupportedFormats(): Format[]
}