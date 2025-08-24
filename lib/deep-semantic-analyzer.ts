// Deep Semantic Understanding and Analysis System
// 深度语义理解和分析系统

import { IntelligenceData } from './enhanced-intelligence-collector';

// SemanticAnalysisResult 接口 - 为intelligent-report-generator提供兼容性
export interface SemanticAnalysisResult {
  topics: string[]
  entities: {
    people: string[]
    organizations: string[]
    locations: string[]
    keywords: string[]
  }
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  themes: string[]
  relationships: Array<{
    source: string
    target: string
    type: string
    confidence: number
  }>
  confidence: number
}

// 实体类型定义
export interface Entity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'KEYWORD' | 'EVENT' | 'PRODUCT' | 'TECHNOLOGY';
  confidence: number;
  start: number;
  end: number;
  metadata?: Record<string, any>;
}

// 情感分析结果
export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

// 主题分析结果
export interface TopicAnalysis {
  topics: Array<{
    id: string;
    label: string;
    score: number;
    keywords: string[];
    confidence: number;
  }>;
  dominantTopic: string;
  topicDistribution: Record<string, number>;
}

// 关系分析结果
export interface RelationshipAnalysis {
  entities: Entity[];
  relationships: Array<{
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
    source: string;
  }>;
  clusters: Array<{
    id: string;
    entities: string[];
    type: string;
    confidence: number;
  }>;
}

// 深度分析结果
export interface DeepAnalysis {
  id: string;
  originalData: IntelligenceData;
  entities: Entity[];
  sentiment: SentimentAnalysis;
  topics: TopicAnalysis;
  relationships: RelationshipAnalysis;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
    confidence: number;
  };
  relevanceScore: number;
  priority: number;
  summary: string;
  insights: string[];
  timestamp: Date;
}

// 深度语义分析引擎
export class DeepSemanticAnalyzer {
  private entityRecognitionModel: any; // 可以集成spaCy、NLTK或其他NLP库
  private sentimentModel: any;
  private topicModel: any;
  private relationshipModel: any;

  constructor() {
    this.initializeModels();
  }

  // 初始化模型
  private initializeModels(): void {
    // 在实际项目中，这里应该加载预训练的NLP模型
    // 可以使用 spaCy、NLTK、Transformers.js 或其他NLP库
    console.log('Initializing semantic analysis models...');
  }

  // 执行深度分析
  public async analyzeIntelligence(data: IntelligenceData): Promise<DeepAnalysis> {
    const analysisId = `analysis_${data.id}_${Date.now()}`;
    
    // 并行执行各种分析
    const [entities, sentiment, topics, relationships] = await Promise.all([
      this.extractEntities(data),
      this.analyzeSentiment(data),
      this.analyzeTopics(data),
      this.analyzeRelationships(data)
    ]);

    // 计算风险评分
    const riskAssessment = this.assessRisk(data, entities, sentiment, topics);

    // 计算相关性评分
    const relevanceScore = this.calculateRelevanceScore(data, entities, topics);

    // 计算优先级
    const priority = this.calculatePriority(data, riskAssessment, relevanceScore);

    // 生成摘要
    const summary = await this.generateSummary(data, entities, topics);

    // 生成洞察
    const insights = await this.generateInsights(data, entities, relationships, topics);

    return {
      id: analysisId,
      originalData: data,
      entities,
      sentiment,
      topics,
      relationships,
      riskAssessment,
      relevanceScore,
      priority,
      summary,
      insights,
      timestamp: new Date()
    };
  }

  // 实体识别
  private async extractEntities(data: IntelligenceData): Promise<Entity[]> {
    const entities: Entity[] = [];
    const text = `${data.title} ${data.content}`;

    // 使用正则表达式进行基础实体识别（实际项目中应使用专业的NLP库）
    const patterns = {
      PERSON: /([A-Z][a-z]+ [A-Z][a-z]+)/g,
      ORGANIZATION: /([A-Z][a-z]+ (?:Inc|Corp|Company|Organization|Foundation|Agency|Bureau))/g,
      LOCATION: /([A-Z][a-z]+ (?:City|State|Country|Province|Region))/g,
      DATE: /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\w+ \d{1,2}, \d{4})/g,
      TECHNOLOGY: /(AI|Machine Learning|Blockchain|5G|IoT|Cybersecurity|Cloud Computing|Big Data)/gi,
      PRODUCT: /(iPhone|Android|Windows|MacOS|Linux|Tesla|SpaceX)/gi
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[1],
          type: type as any,
          confidence: 0.7, // 基础置信度
          start: match.index,
          end: match.index + match[1].length
        });
      }
    }

    // 去重并提高重要实体的置信度
    return this.deduplicateEntities(entities);
  }

  // 情感分析
  private async analyzeSentiment(data: IntelligenceData): Promise<SentimentAnalysis> {
    const text = `${data.title} ${data.content}`;
    
    // 简化的情感分析（实际项目中应使用专业的情感分析模型）
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'growth', 'increase', 'improve'];
    const negativeWords = ['bad', 'terrible', 'negative', 'fail', 'decline', 'decrease', 'problem', 'threat'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    let score = 0;
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';

    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
      label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
    }

    return {
      score,
      magnitude: Math.abs(score),
      label,
      confidence: Math.min(total / 10, 0.9) // 基于证据数量的置信度
    };
  }

  // 主题分析
  private async analyzeTopics(data: IntelligenceData): Promise<TopicAnalysis> {
    const text = `${data.title} ${data.content}`;
    
    // 简化的主题分析（实际项目中应使用LDA或其他主题模型）
    const topicKeywords = {
      'Security': ['security', 'threat', 'attack', 'vulnerability', 'breach', 'malware', 'cyber'],
      'Business': ['business', 'market', 'finance', 'economy', 'revenue', 'profit', 'investment'],
      'Technology': ['technology', 'ai', 'software', 'hardware', 'innovation', 'digital', 'tech'],
      'Geopolitics': ['politics', 'government', 'international', 'conflict', 'diplomacy', 'policy'],
      'Health': ['health', 'medical', 'pandemic', 'disease', 'vaccine', 'treatment']
    };

    const topicScores: Record<string, number> = {};
    const words = text.toLowerCase().split(/\s+/);

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matches = words.filter(word => keywords.some(keyword => word.includes(keyword))).length;
      topicScores[topic] = matches / words.length;
    }

    const sortedTopics = Object.entries(topicScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);

    const topics = sortedTopics.map(([topic, score], index) => ({
      id: `topic_${index}`,
      label: topic,
      score,
      keywords: topicKeywords[topic as keyof typeof topicKeywords],
      confidence: Math.min(score * 10, 0.9)
    }));

    return {
      topics,
      dominantTopic: topics[0]?.label || 'General',
      topicDistribution: topicScores
    };
  }

  // 关系分析
  private async analyzeRelationships(data: IntelligenceData): Promise<RelationshipAnalysis> {
    const text = `${data.title} ${data.content}`;
    const entities = await this.extractEntities(data);

    // 简化的关系提取（实际项目中应使用依存句法分析）
    const relationships: Array<{
      subject: string;
      predicate: string;
      object: string;
      confidence: number;
      source: string;
    }> = [];
    const clusters: Array<{
      id: string;
      entities: string[];
      type: string;
      confidence: number;
    }> = [];

    // 基于共现关系
    const coOccurrences: Record<string, Set<string>> = {};
    
    entities.forEach(entity => {
      if (!coOccurrences[entity.text]) {
        coOccurrences[entity.text] = new Set();
      }
      
      // 查找在同一句子中出现的其他实体
      const sentences = text.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.includes(entity.text)) {
          entities.forEach(otherEntity => {
            if (otherEntity.text !== entity.text && sentence.includes(otherEntity.text)) {
              coOccurrences[entity.text].add(otherEntity.text);
            }
          });
        }
      });
    });

    // 生成关系
    for (const [entity1, relatedEntities] of Object.entries(coOccurrences)) {
      relatedEntities.forEach(entity2 => {
        relationships.push({
          subject: entity1,
          predicate: 'related_to',
          object: entity2,
          confidence: 0.6,
          source: data.source
        });
      });
    }

    // 简单的聚类（基于共现）
    const visited = new Set<string>();
    let clusterId = 0;

    for (const entity of Object.keys(coOccurrences)) {
      if (!visited.has(entity)) {
        const cluster = [entity];
        const queue = [entity];
        visited.add(entity);

        while (queue.length > 0) {
          const current = queue.shift()!;
          const related = Array.from(coOccurrences[current] || []);
          
          related.forEach(relatedEntity => {
            if (!visited.has(relatedEntity)) {
              visited.add(relatedEntity);
              cluster.push(relatedEntity);
              queue.push(relatedEntity);
            }
          });
        }

        if (cluster.length > 1) {
          clusters.push({
            id: `cluster_${clusterId++}`,
            entities: cluster,
            type: 'co_occurrence',
            confidence: cluster.length / entities.length
          });
        }
      }
    }

    return {
      entities,
      relationships,
      clusters
    };
  }

  // 风险评估
  private assessRisk(
    data: IntelligenceData, 
    entities: Entity[], 
    sentiment: SentimentAnalysis, 
    topics: TopicAnalysis
  ): DeepAnalysis['riskAssessment'] {
    let riskScore = 0;
    const riskFactors: string[] = [];

    // 基于数据类型的风险评分
    const typeRiskScores = {
      'threat': 0.8,
      'security': 0.7,
      'geopolitical': 0.6,
      'business': 0.3,
      'news': 0.2
    };
    riskScore += typeRiskScores[data.type] || 0.1;

    // 基于情感的风险评分
    if (sentiment.label === 'negative') {
      riskScore += sentiment.magnitude * 0.5;
      riskFactors.push('Negative sentiment detected');
    }

    // 基于主题的风险评分
    const highRiskTopics = ['Security', 'Geopolitics'];
    if (highRiskTopics.includes(topics.dominantTopic)) {
      riskScore += 0.3;
      riskFactors.push(`High-risk topic: ${topics.dominantTopic}`);
    }

    // 基于实体的风险评分
    const riskEntities = entities.filter(e => 
      e.type === 'ORGANIZATION' && 
      ['government', 'military', 'intelligence'].some(keyword => 
        e.text.toLowerCase().includes(keyword)
      )
    );
    if (riskEntities.length > 0) {
      riskScore += riskEntities.length * 0.1;
      riskFactors.push('High-risk entities detected');
    }

    // 基于可信度的风险评分
    if (data.credibility < 0.5) {
      riskScore += (0.5 - data.credibility) * 0.5;
      riskFactors.push('Low source credibility');
    }

    // 标准化风险评分
    riskScore = Math.min(riskScore, 1);

    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore >= 0.8) level = 'critical';
    else if (riskScore >= 0.6) level = 'high';
    else if (riskScore >= 0.3) level = 'medium';

    return {
      level,
      score: riskScore,
      factors: riskFactors,
      confidence: 0.7
    };
  }

  // 计算相关性评分
  private calculateRelevanceScore(
    data: IntelligenceData, 
    entities: Entity[], 
    topics: TopicAnalysis
  ): number {
    let score = 0;

    // 基于实体密度
    const textLength = (data.title + data.content).length;
    const entityDensity = entities.length / textLength;
    score += Math.min(entityDensity * 1000, 0.3);

    // 基于主题清晰度
    const dominantTopicScore = topics.topics[0]?.score || 0;
    score += dominantTopicScore * 0.3;

    // 基于内容质量
    const contentLength = data.content.length;
    if (contentLength > 100) score += 0.2;
    if (contentLength > 500) score += 0.1;

    // 基于时间新鲜度
    const ageInHours = (Date.now() - data.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageInHours < 24) score += 0.1;
    if (ageInHours < 1) score += 0.1;

    return Math.min(score, 1);
  }

  // 计算优先级
  private calculatePriority(
    data: IntelligenceData, 
    riskAssessment: DeepAnalysis['riskAssessment'], 
    relevanceScore: number
  ): number {
    let priority = 0;

    // 风险权重 40%
    priority += riskAssessment.score * 0.4;

    // 相关性权重 30%
    priority += relevanceScore * 0.3;

    // 可信度权重 20%
    priority += data.credibility * 0.2;

    // 时间新鲜度权重 10%
    const ageInHours = (Date.now() - data.timestamp.getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 1 - ageInHours / 168); // 一周内
    priority += freshnessScore * 0.1;

    return Math.min(priority, 1);
  }

  // 生成摘要
  private async generateSummary(
    data: IntelligenceData, 
    entities: Entity[], 
    topics: TopicAnalysis
  ): Promise<string> {
    // 简化的摘要生成（实际项目中应使用文本摘要模型）
    const keyEntities = entities
      .filter(e => e.confidence > 0.7)
      .slice(0, 3)
      .map(e => e.text)
      .join(', ');

    const mainTopic = topics.dominantTopic;
    const sentiment = data.content.length > 0 ? 'This information' : 'This report';

    return `${sentiment} discusses ${mainTopic.toLowerCase()} and involves ${keyEntities || 'various entities'}. The content has been assessed for relevance and risk factors.`;
  }

  // 生成洞察
  private async generateInsights(
    data: IntelligenceData, 
    entities: Entity[], 
    relationships: RelationshipAnalysis, 
    topics: TopicAnalysis
  ): Promise<string[]> {
    const insights: string[] = [];

    // 基于实体的洞察
    const organizations = entities.filter(e => e.type === 'ORGANIZATION');
    if (organizations.length > 1) {
      insights.push(`Multiple organizations involved: ${organizations.map(o => o.text).join(', ')}`);
    }

    // 基于关系的洞察
    if (relationships.relationships.length > 5) {
      insights.push('High connectivity detected between entities');
    }

    // 基于主题的洞察
    if (topics.topics.length > 1) {
      const secondaryTopics = topics.topics.slice(1, 3).map(t => t.label);
      insights.push(`Related topics: ${secondaryTopics.join(', ')}`);
    }

    // 基于时间的洞察
    const ageInHours = (Date.now() - data.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageInHours < 1) {
      insights.push('Breaking intelligence - very recent information');
    }

    return insights;
  }

  // 实体去重
  private deduplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Map<string, Entity>();
    
    return entities.filter(entity => {
      const key = `${entity.text}_${entity.type}`;
      if (seen.has(key)) {
        // 保留置信度更高的实体
        const existing = seen.get(key)!;
        if (entity.confidence > existing.confidence) {
          seen.set(key, entity);
          return true;
        }
        return false;
      }
      seen.set(key, entity);
      return true;
    });
  }

  // 批量分析
  public async batchAnalyze(dataArray: IntelligenceData[]): Promise<DeepAnalysis[]> {
    const analyses: DeepAnalysis[] = [];

    // 并行处理，但限制并发数
    const batchSize = 5;
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);
      const batchAnalyses = await Promise.all(
        batch.map(data => this.analyzeIntelligence(data))
      );
      analyses.push(...batchAnalyses);
    }

    return analyses;
  }

  // 新增 analyzeContent 方法 - 为intelligent-report-generator提供兼容性
  async analyzeContent(content: string, context?: string): Promise<SemanticAnalysisResult> {
    console.log('🧠 开始深度语义分析...')
    
    try {
      // 创建临时IntelligenceData对象
      const mockData: IntelligenceData = {
        id: 'temp_' + Date.now(),
        source: 'semantic_analysis',
        type: 'news',
        title: context || 'Content Analysis',
        content,
        timestamp: new Date(),
        credibility: 0.8,
        tags: [],
        metadata: {}
      }

      // 使用现有方法进行分析
      const entities = await this.extractEntities(mockData)
      const sentiment = await this.analyzeSentiment(mockData)
      const topics = await this.analyzeTopics(mockData)
      
      // 转换为SemanticAnalysisResult格式
      return {
        topics: topics.topics.map(t => t.label),
        entities: {
          people: entities.filter(e => e.type === 'PERSON').map(e => e.text),
          organizations: entities.filter(e => e.type === 'ORGANIZATION').map(e => e.text),
          locations: entities.filter(e => e.type === 'LOCATION').map(e => e.text),
          keywords: entities.filter(e => e.type === 'KEYWORD').map(e => e.text)
        },
        sentiment: sentiment.label,
        themes: topics.topics.slice(0, 3).map(t => t.label),
        relationships: [], // 简化版不提供关系分析
        confidence: Math.min(sentiment.confidence + topics.topics[0]?.confidence || 0.5, 1)
      }
    } catch (error) {
      console.error('❌ 语义分析失败:', error)
      return this.getDefaultSemanticAnalysis()
    }
  }

  private getDefaultSemanticAnalysis(): SemanticAnalysisResult {
    return {
      topics: [],
      entities: {
        people: [],
        organizations: [],
        locations: [],
        keywords: []
      },
      sentiment: 'neutral',
      themes: [],
      relationships: [],
      confidence: 0.1
    }
  }
}

// 创建单例实例
export const semanticAnalyzer = new DeepSemanticAnalyzer();