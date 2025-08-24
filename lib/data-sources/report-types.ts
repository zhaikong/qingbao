// 从较大文本中提取的摘要片段
export interface Summary {
  id: string;
  content: string;
  source: string;
  timestamp: string;
}

// 关键发现或结论
export interface KeyFinding {
  id: string;
  text: string;
  relevance: number;
}

// 与报告关联的元数据
export interface ReportMetadata {
  created_at: string;
  updated_at: string;
  word_count: number;
  source_count: number;
}

export interface QualityAssessment {
  rating: number;
  feedback: string;
}

export const initialQualityAssessment: QualityAssessment = {
  rating: 0,
  feedback: '',
};

// 主要的报告结构
export interface Report {
  id: string;
  title: string;
  content: string;
  summary: string;
  articles: any[]; // 暂时假定文章可以是任何类型
  summaries: Summary[];
  key_findings: KeyFinding[];
  analysis: string;
  metadata: ReportMetadata;
  quality?: QualityAssessment; // 质量评估是可选的，因为它是后加的
}