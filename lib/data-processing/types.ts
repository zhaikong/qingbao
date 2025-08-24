// 数据处理相关的类型定义

export interface ProcessedDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  snippet: string;
  source: string;
  credibilityLevel: 'T1' | 'T2' | 'T3' | 'T4';
  credibilityScore: number;
  publishDate?: string;
  extractedEntities: {
    persons: string[];
    organizations: string[];
    locations: string[];
    keywords: string[];
  };
  duplicateOf?: string; // 如果是重复内容，指向原始文档ID
}

export interface ProcessingResult {
  documents: ProcessedDocument[];
  statistics: {
    totalDocuments: number;
    duplicatesRemoved: number;
    credibilityDistribution: {
      T1: number;
      T2: number;
      T3: number;
      T4: number;
    };
    sourceDistribution: Record<string, number>;
  };
  qualityScore: number; // 整体质量评分 0-1
}

export interface CredibilityRule {
  domain: string;
  level: 'T1' | 'T2' | 'T3' | 'T4';
  reason: string;
  weight: number;
}

export interface QualityMetrics {
  sourceCount: number;
  duplicateRatio: number;
  highCredibilityRatio: number; // T1+T2 占比
  contentQuality: number;
  diversityScore: number; // 信源多样性评分
}