// 报告生成相关的类型定义

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  promptTemplate: string;
  outputFormat: 'markdown' | 'html' | 'json';
}

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  order: number;
  promptFragment: string;
}

export interface GeneratedReport {
  id: string;
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'json';
  metadata: {
    query: string;
    generatedAt: string;
    model: string;
    provider: string;
    sourceCount: number;
    qualityScore: number;
    processingTime: number; // 毫秒
  };
  sections: {
    [sectionId: string]: string;
  };
  sources: Array<{
    title: string;
    url: string;
    credibilityLevel: string;
    snippet: string;
  }>;
}

export interface ReportGenerationConfig {
  templateId: string;
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  includeSourceLinks?: boolean;
  language?: 'zh-CN' | 'en-US';
}

export interface ReportQualityMetrics {
  structureCompleteness: number; // 结构完整性 0-1
  contentCoherence: number;      // 内容连贯性 0-1
  factualAccuracy: number;       // 事实准确性 0-1
  languageQuality: number;       // 语言质量 0-1
  sourceIntegration: number;     // 信源整合度 0-1
  overallScore: number;          // 综合评分 0-1
}