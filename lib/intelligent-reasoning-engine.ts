// Intelligent Reasoning and Correlation Engine
// 智能推理和关联引擎

import { DeepAnalysis } from './deep-semantic-analyzer';
import { IntelligenceData } from './enhanced-intelligence-collector';

// 关联模式类型
export interface CorrelationPattern {
  id: string;
  name: string;
  description: string;
  type: 'temporal' | 'spatial' | 'entity' | 'semantic' | 'network' | 'behavioral';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  conditions: CorrelationCondition[];
  actions: CorrelationAction[];
}

// 关联条件
export interface CorrelationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  weight: number;
}

// 关联动作
export interface CorrelationAction {
  type: 'alert' | 'escalate' | 'tag' | 'correlate' | 'investigate';
  parameters: Record<string, any>;
}

// 关联结果
export interface CorrelationResult {
  id: string;
  patternId: string;
  patternName: string;
  matchedAnalyses: DeepAnalysis[];
  correlationScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  evidence: string[];
  timestamp: Date;
  recommendations: string[];
}

// 威胁情报关联
export interface ThreatCorrelation {
  id: string;
  threatType: string;
  indicators: string[];
  relatedAnalyses: DeepAnalysis[];
  timeline: Array<{
    timestamp: Date;
    event: string;
    analysisId: string;
    confidence: number;
  }>;
  attackPatterns: string[];
  tactics: string[];
  techniques: string[];
  attribution?: {
    actors: string[];
    confidence: number;
    evidence: string[];
  };
  impactAssessment: {
    potentialImpact: string;
    likelihood: number;
    affectedAssets: string[];
  };
}

// 智能推理引擎
export class IntelligentReasoningEngine {
  private correlationPatterns: Map<string, CorrelationPattern> = new Map();
  private activeCorrelations: Map<string, CorrelationResult> = new Map();
  private threatIntelligenceDB: Map<string, ThreatCorrelation> = new Map();
  private knowledgeGraph: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeCorrelationPatterns();
    this.initializeKnowledgeGraph();
  }

  // 初始化关联模式
  private initializeCorrelationPatterns(): void {
    const patterns: CorrelationPattern[] = [
      {
        id: 'temporal_cluster',
        name: 'Temporal Event Clustering',
        description: 'Detects events occurring in close temporal proximity',
        type: 'temporal',
        severity: 'medium',
        confidence: 0.8,
        conditions: [
          { field: 'timestamp', operator: 'greater_than', value: '1_hour_ago', weight: 0.4 },
          { field: 'riskAssessment.level', operator: 'in', value: ['high', 'critical'], weight: 0.3 },
          { field: 'type', operator: 'equals', value: 'threat', weight: 0.3 }
        ],
        actions: [
          { type: 'alert', parameters: { priority: 'high' } },
          { type: 'correlate', parameters: { timeWindow: '1h' } }
        ]
      },
      {
        id: 'entity_co_occurrence',
        name: 'Entity Co-occurrence Analysis',
        description: 'Identifies when multiple high-risk entities appear together',
        type: 'entity',
        severity: 'high',
        confidence: 0.9,
        conditions: [
          { field: 'entities.type', operator: 'in', value: ['ORGANIZATION', 'PERSON'], weight: 0.4 },
          { field: 'relationships.clusters.length', operator: 'greater_than', value: 2, weight: 0.3 },
          { field: 'riskAssessment.score', operator: 'greater_than', value: 0.7, weight: 0.3 }
        ],
        actions: [
          { type: 'escalate', parameters: { level: 'analyst' } },
          { type: 'investigate', parameters: { priority: 'urgent' } }
        ]
      },
      {
        id: 'semantic_similarity',
        name: 'Semantic Similarity Detection',
        description: 'Finds semantically similar events across different sources',
        type: 'semantic',
        severity: 'medium',
        confidence: 0.7,
        conditions: [
          { field: 'topics.dominantTopic', operator: 'equals', value: 'Security', weight: 0.4 },
          { field: 'sentiment.label', operator: 'equals', value: 'negative', weight: 0.3 },
          { field: 'relevanceScore', operator: 'greater_than', value: 0.6, weight: 0.3 }
        ],
        actions: [
          { type: 'tag', parameters: { tags: ['related_events'] } },
          { type: 'correlate', parameters: { similarity: 'semantic' } }
        ]
      },
      {
        id: 'behavioral_pattern',
        name: 'Behavioral Pattern Recognition',
        description: 'Detects suspicious behavioral patterns',
        type: 'behavioral',
        severity: 'high',
        confidence: 0.85,
        conditions: [
          { field: 'riskAssessment.level', operator: 'equals', value: 'critical', weight: 0.5 },
          { field: 'priority', operator: 'greater_than', value: 0.8, weight: 0.3 },
          { field: 'type', operator: 'in', value: ['threat', 'security'], weight: 0.2 }
        ],
        actions: [
          { type: 'alert', parameters: { priority: 'critical' } },
          { type: 'escalate', parameters: { level: 'security_team' } }
        ]
      },
      {
        id: 'network_anomaly',
        name: 'Network Anomaly Detection',
        description: 'Identifies network-related anomalies and threats',
        type: 'network',
        severity: 'critical',
        confidence: 0.95,
        conditions: [
          { field: 'type', operator: 'equals', value: 'threat', weight: 0.4 },
          { field: 'topics.dominantTopic', operator: 'equals', value: 'Security', weight: 0.3 },
          { field: 'entities', operator: 'contains', value: 'network', weight: 0.3 }
        ],
        actions: [
          { type: 'alert', parameters: { priority: 'critical' } },
          { type: 'investigate', parameters: { priority: 'immediate' } }
        ]
      }
    ];

    patterns.forEach(pattern => {
      this.correlationPatterns.set(pattern.id, pattern);
    });
  }

  // 初始化知识图谱
  private initializeKnowledgeGraph(): void {
    // 初始化一些预定义的实体关系
    const predefinedRelations = {
      'APT29': ['Russian', 'Cozy Bear', 'The Dukes'],
      'APT28': ['Russian', 'Fancy Bear', 'Sofacy'],
      'Lazarus Group': ['North Korean', 'Hidden Cobra'],
      'SolarWinds': ['Supply Chain', 'SUNBURST', 'APT29'],
      'Microsoft': ['Software', 'Technology', 'Cloud'],
      'Google': ['Technology', 'Cloud', 'Search'],
      'Amazon': ['Technology', 'Cloud', 'E-commerce']
    };

    for (const [entity, relatedEntities] of Object.entries(predefinedRelations)) {
      const connections = new Set(relatedEntities);
      this.knowledgeGraph.set(entity, connections);
      
      // 添加反向关系
      relatedEntities.forEach(related => {
        if (!this.knowledgeGraph.has(related)) {
          this.knowledgeGraph.set(related, new Set());
        }
        this.knowledgeGraph.get(related)!.add(entity);
      });
    }
  }

  // 执行智能推理
  public async performReasoning(analyses: DeepAnalysis[]): Promise<{
    correlations: CorrelationResult[];
    threatCorrelations: ThreatCorrelation[];
    insights: string[];
    recommendations: string[];
  }> {
    const correlations = await this.detectCorrelations(analyses);
    const threatCorrelations = await this.performThreatCorrelation(analyses);
    const insights = this.generateInsights(correlations, threatCorrelations);
    const recommendations = this.generateRecommendations(correlations, threatCorrelations);

    return {
      correlations,
      threatCorrelations,
      insights,
      recommendations
    };
  }

  // 检测关联模式
  private async detectCorrelations(analyses: DeepAnalysis[]): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];

    for (const pattern of this.correlationPatterns.values()) {
      const matchedAnalyses = await this.matchPattern(pattern, analyses);
      
      if (matchedAnalyses.length >= 2) { // 至少需要2个匹配项
        const correlation = this.createCorrelationResult(pattern, matchedAnalyses);
        correlations.push(correlation);
        this.activeCorrelations.set(correlation.id, correlation);
      }
    }

    return correlations;
  }

  // 匹配关联模式
  private async matchPattern(pattern: CorrelationPattern, analyses: DeepAnalysis[]): Promise<DeepAnalysis[]> {
    const matched: DeepAnalysis[] = [];

    for (const analysis of analyses) {
      let matchScore = 0;
      const evidence: string[] = [];

      for (const condition of pattern.conditions) {
        const conditionResult = this.evaluateCondition(condition, analysis);
        if (conditionResult.matches) {
          matchScore += condition.weight;
          if (conditionResult.evidence) {
            evidence.push(conditionResult.evidence);
          }
        }
      }

      if (matchScore >= 0.6) { // 60% 匹配阈值
        analysis.metadata = {
          ...analysis.metadata,
          correlationMatch: {
            patternId: pattern.id,
            score: matchScore,
            evidence
          }
        };
        matched.push(analysis);
      }
    }

    return matched;
  }

  // 评估条件
  private evaluateCondition(condition: CorrelationCondition, analysis: DeepAnalysis): {
    matches: boolean;
    evidence?: string;
  } {
    const fieldValue = this.getFieldValue(condition.field, analysis);
    
    switch (condition.operator) {
      case 'equals':
        return {
          matches: fieldValue === condition.value,
          evidence: `${condition.field} equals ${condition.value}`
        };
      
      case 'contains':
        return {
          matches: Array.isArray(fieldValue) 
            ? fieldValue.some(item => item.toString().includes(condition.value))
            : fieldValue.toString().includes(condition.value),
          evidence: `${condition.field} contains ${condition.value}`
        };
      
      case 'greater_than':
        return {
          matches: Number(fieldValue) > Number(condition.value),
          evidence: `${condition.field} > ${condition.value}`
        };
      
      case 'less_than':
        return {
          matches: Number(fieldValue) < Number(condition.value),
          evidence: `${condition.field} < ${condition.value}`
        };
      
      case 'in':
        return {
          matches: Array.isArray(condition.value) 
            ? condition.value.includes(fieldValue)
            : false,
          evidence: `${condition.field} in ${condition.value}`
        };
      
      default:
        return { matches: false };
    }
  }

  // 获取字段值
  private getFieldValue(fieldPath: string, analysis: DeepAnalysis): any {
    const parts = fieldPath.split('.');
    let value: any = analysis;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // 创建关联结果
  private createCorrelationResult(pattern: CorrelationPattern, matchedAnalyses: DeepAnalysis[]): CorrelationResult {
    const id = `correlation_${pattern.id}_${Date.now()}`;
    const correlationScore = this.calculateCorrelationScore(matchedAnalyses);
    
    const evidence = matchedAnalyses.map(analysis => 
      `${analysis.originalData.title} (${analysis.originalData.source})`
    );

    const recommendations = this.generateCorrelationRecommendations(pattern, matchedAnalyses);

    return {
      id,
      patternId: pattern.id,
      patternName: pattern.name,
      matchedAnalyses,
      correlationScore,
      severity: pattern.severity,
      confidence: pattern.confidence,
      description: pattern.description,
      evidence,
      timestamp: new Date(),
      recommendations
    };
  }

  // 计算关联评分
  private calculateCorrelationScore(analyses: DeepAnalysis[]): number {
    let score = 0;
    
    // 基于风险评分
    const avgRisk = analyses.reduce((sum, a) => sum + a.riskAssessment.score, 0) / analyses.length;
    score += avgRisk * 0.3;
    
    // 基于时间接近度
    const timestamps = analyses.map(a => a.timestamp.getTime()).sort((a, b) => a - b);
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    const timeScore = Math.max(0, 1 - timeSpan / (24 * 60 * 60 * 1000)); // 24小时内
    score += timeScore * 0.3;
    
    // 基于实体重叠
    const allEntities = analyses.flatMap(a => a.entities.map(e => e.text));
    const uniqueEntities = new Set(allEntities);
    const entityOverlap = 1 - (uniqueEntities.size / allEntities.length);
    score += entityOverlap * 0.2;
    
    // 基于主题相似性
    const topics = analyses.map(a => a.topics.dominantTopic);
    const topicConsistency = 1 - (new Set(topics).size / topics.length);
    score += topicConsistency * 0.2;
    
    return Math.min(score, 1);
  }

  // 生成关联建议
  private generateCorrelationRecommendations(pattern: CorrelationPattern, analyses: DeepAnalysis[]): string[] {
    const recommendations: string[] = [];

    switch (pattern.type) {
      case 'temporal':
        recommendations.push('Investigate the timing of these events for coordinated activity');
        recommendations.push('Review logs for related activities in the same timeframe');
        break;
      
      case 'entity':
        recommendations.push('Investigate the relationships between the involved entities');
        recommendations.push('Check for additional communications or transactions');
        break;
      
      case 'semantic':
        recommendations.push('Cross-reference with other similar events');
        recommendations.push('Look for patterns in the modus operandi');
        break;
      
      case 'behavioral':
        recommendations.push('Immediate investigation recommended');
        recommendations.push('Consider implementing additional security controls');
        break;
      
      case 'network':
        recommendations.push('Network security team should be alerted');
        recommendations.push('Consider network segmentation and monitoring');
        break;
    }

    return recommendations;
  }

  // 执行威胁关联
  private async performThreatCorrelation(analyses: DeepAnalysis[]): Promise<ThreatCorrelation[]> {
    const threatCorrelations: ThreatCorrelation[] = [];

    // 基于MITRE ATT&CK框架的威胁关联
    const threatGroups = this.groupByThreatActor(analyses);
    
    for (const [actor, actorAnalyses] of threatGroups.entries()) {
      const correlation = this.createThreatCorrelation(actor, actorAnalyses);
      threatCorrelations.push(correlation);
      this.threatIntelligenceDB.set(correlation.id, correlation);
    }

    return threatCorrelations;
  }

  // 按威胁行为者分组
  private groupByThreatActor(analyses: DeepAnalysis[]): Map<string, DeepAnalysis[]> {
    const groups = new Map<string, DeepAnalysis[]>();

    for (const analysis of analyses) {
      const actors = this.extractThreatActors(analysis);
      
      for (const actor of actors) {
        if (!groups.has(actor)) {
          groups.set(actor, []);
        }
        groups.get(actor)!.push(analysis);
      }
    }

    return groups;
  }

  // 提取威胁行为者
  private extractThreatActors(analysis: DeepAnalysis): string[] {
    const actors: string[] = [];
    
    // 基于已知威胁行为者列表
    const knownActors = [
      'APT29', 'APT28', 'Lazarus Group', 'Cozy Bear', 'Fancy Bear',
      'Sofacy', 'The Dukes', 'Hidden Cobra', 'Equation Group'
    ];

    for (const entity of analysis.entities) {
      if (knownActors.includes(entity.text)) {
        actors.push(entity.text);
      }
    }

    // 基于知识图谱扩展
    for (const entity of analysis.entities) {
      const related = this.knowledgeGraph.get(entity.text);
      if (related) {
        for (const relatedEntity of related) {
          if (knownActors.includes(relatedEntity)) {
            actors.push(relatedEntity);
          }
        }
      }
    }

    return [...new Set(actors)];
  }

  // 创建威胁关联
  private createThreatCorrelation(actor: string, analyses: DeepAnalysis[]): ThreatCorrelation {
    const id = `threat_${actor}_${Date.now()}`;
    
    const timeline = analyses.map(analysis => ({
      timestamp: analysis.timestamp,
      event: analysis.originalData.title,
      analysisId: analysis.id,
      confidence: analysis.riskAssessment.confidence
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const indicators = this.extractIndicators(analyses);
    const attackPatterns = this.extractAttackPatterns(analyses);
    const tactics = this.extractTactics(analyses);
    const techniques = this.extractTechniques(analyses);

    const attribution = this.performAttribution(analyses);
    const impactAssessment = this.assessImpact(analyses);

    return {
      id,
      threatType: actor,
      indicators,
      relatedAnalyses: analyses,
      timeline,
      attackPatterns,
      tactics,
      techniques,
      attribution,
      impactAssessment
    };
  }

  // 提取指标
  private extractIndicators(analyses: DeepAnalysis[]): string[] {
    const indicators: string[] = [];

    for (const analysis of analyses) {
      // 提取URL、IP、哈希值等指标
      const content = analysis.originalData.content;
      const urlPattern = /https?:\/\/[^\s]+/g;
      const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
      const hashPattern = /\b[a-f0-9]{32,64}\b/g;

      const urls = content.match(urlPattern) || [];
      const ips = content.match(ipPattern) || [];
      const hashes = content.match(hashPattern) || [];

      indicators.push(...urls, ...ips, ...hashes);
    }

    return [...new Set(indicators)];
  }

  // 提取攻击模式
  private extractAttackPatterns(analyses: DeepAnalysis[]): string[] {
    const patterns: string[] = [];
    
    // 基于MITRE ATT&CK模式
    const attackPatterns = [
      'Spearphishing Attachment', 'Supply Chain Compromise', 'Exploit Public-Facing Application',
      'Valid Accounts', 'Credential Dumping', 'Lateral Movement', 'Data Encrypted for Impact'
    ];

    for (const analysis of analyses) {
      const content = analysis.originalData.content.toLowerCase();
      
      for (const pattern of attackPatterns) {
        if (content.includes(pattern.toLowerCase())) {
          patterns.push(pattern);
        }
      }
    }

    return [...new Set(patterns)];
  }

  // 提取策略
  private extractTactics(analyses: DeepAnalysis[]): string[] {
    const tactics: string[] = [];
    
    const mitreTactics = [
      'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
      'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
      'Collection', 'Command and Control', 'Exfiltration', 'Impact'
    ];

    for (const analysis of analyses) {
      const content = analysis.originalData.content.toLowerCase();
      
      for (const tactic of mitreTactics) {
        if (content.includes(tactic.toLowerCase())) {
          tactics.push(tactic);
        }
      }
    }

    return [...new Set(tactics)];
  }

  // 提取技术
  private extractTechniques(analyses: DeepAnalysis[]): string[] {
    const techniques: string[] = [];
    
    const mitreTechniques = [
      'T1566.001', 'T1195.002', 'T1190', 'T1078', 'T1003', 'T1021',
      'T1486', 'T1059.001', 'T1210', 'T1041', 'T1071'
    ];

    for (const analysis of analyses) {
      const content = analysis.originalData.content;
      
      for (const technique of mitreTechniques) {
        if (content.includes(technique)) {
          techniques.push(technique);
        }
      }
    }

    return [...new Set(techniques)];
  }

  // 执行归因
  private performAttribution(analyses: DeepAnalysis[]): ThreatCorrelation['attribution'] {
    const actors = new Set<string>();
    const evidence: string[] = [];
    let totalConfidence = 0;

    for (const analysis of analyses) {
      const extractedActors = this.extractThreatActors(analysis);
      extractedActors.forEach(actor => actors.add(actor));
      
      if (extractedActors.length > 0) {
        evidence.push(`Threat actor mentioned in: ${analysis.originalData.title}`);
        totalConfidence += analysis.riskAssessment.confidence;
      }
    }

    const confidence = actors.size > 0 ? totalConfidence / analyses.length : 0;

    return {
      actors: Array.from(actors),
      confidence,
      evidence
    };
  }

  // 评估影响
  private assessImpact(analyses: DeepAnalysis[]): ThreatCorrelation['impactAssessment'] {
    const highRiskAnalyses = analyses.filter(a => a.riskAssessment.level === 'critical' || a.riskAssessment.level === 'high');
    const likelihood = highRiskAnalyses.length / analyses.length;

    const affectedAssets = this.extractAffectedAssets(analyses);
    const potentialImpact = this.determinePotentialImpact(analyses);

    return {
      potentialImpact,
      likelihood,
      affectedAssets
    };
  }

  // 提取受影响资产
  private extractAffectedAssets(analyses: DeepAnalysis[]): string[] {
    const assets: string[] = [];

    for (const analysis of analyses) {
      const content = analysis.originalData.content.toLowerCase();
      
      // 查找资产类型
      const assetTypes = ['server', 'database', 'network', 'application', 'website', 'system'];
      
      for (const assetType of assetTypes) {
        if (content.includes(assetType)) {
          assets.push(assetType);
        }
      }
    }

    return [...new Set(assets)];
  }

  // 确定潜在影响
  private determinePotentialImpact(analyses: DeepAnalysis[]): string {
    const hasCritical = analyses.some(a => a.riskAssessment.level === 'critical');
    const hasHigh = analyses.some(a => a.riskAssessment.level === 'high');
    
    if (hasCritical) return 'Critical - Immediate action required';
    if (hasHigh) return 'High - Significant impact expected';
    return 'Moderate - Monitor closely';
  }

  // 生成洞察
  private generateInsights(correlations: CorrelationResult[], threatCorrelations: ThreatCorrelation[]): string[] {
    const insights: string[] = [];

    // 基于关联模式的洞察
    const patternTypes = new Set(correlations.map(c => c.patternId));
    if (patternTypes.has('temporal_cluster')) {
      insights.push('Temporal clustering detected - possible coordinated activity');
    }
    
    if (patternTypes.has('entity_co_occurrence')) {
      insights.push('Multiple high-risk entities co-occurring - investigate connections');
    }

    // 基于威胁关联的洞察
    if (threatCorrelations.length > 0) {
      insights.push(`Detected ${threatCorrelations.length} potential threat actor activities`);
      
      const highConfidenceThreats = threatCorrelations.filter(t => t.attribution?.confidence && t.attribution.confidence > 0.7);
      if (highConfidenceThreats.length > 0) {
        insights.push(`High-confidence attribution to ${highConfidenceThreats.length} threat actors`);
      }
    }

    return insights;
  }

  // 生成建议
  private generateRecommendations(correlations: CorrelationResult[], threatCorrelations: ThreatCorrelation[]): string[] {
    const recommendations: string[] = [];

    // 基于关联严重性的建议
    const criticalCorrelations = correlations.filter(c => c.severity === 'critical');
    if (criticalCorrelations.length > 0) {
      recommendations.push('Immediate investigation required for critical correlations');
    }

    // 基于威胁关联的建议
    if (threatCorrelations.length > 0) {
      recommendations.push('Review and update security controls based on identified TTPs');
      recommendations.push('Consider implementing additional monitoring for identified indicators');
    }

    // 通用建议
    recommendations.push('Continue monitoring for related activities');
    recommendations.push('Update threat intelligence based on findings');

    return recommendations;
  }

  // 获取活跃关联
  public getActiveCorrelations(): CorrelationResult[] {
    return Array.from(this.activeCorrelations.values());
  }

  // 获取威胁情报数据库
  public getThreatIntelligenceDB(): ThreatCorrelation[] {
    return Array.from(this.threatIntelligenceDB.values());
  }

  // 清理过期关联
  public cleanupOldCorrelations(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [id, correlation] of this.activeCorrelations.entries()) {
      if (now - correlation.timestamp.getTime() > maxAge) {
        this.activeCorrelations.delete(id);
      }
    }
  }
}

// 创建单例实例
export const reasoningEngine = new IntelligentReasoningEngine();