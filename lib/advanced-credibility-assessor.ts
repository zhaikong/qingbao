// Advanced Credibility Assessment and Source Verification System
// 高级可信度评估和信源验证系统

import { IntelligenceData } from './enhanced-intelligence-collector';

// 可信度评级
export interface CredibilityRating {
  level: 'T1' | 'T2' | 'T3' | 'T4'; // T1: 最高可信, T4: 最低可信
  score: number; // 0-1 评分
  confidence: number; // 评分置信度
  factors: CredibilityFactor[];
  recommendation: 'trust' | 'verify' | 'suspect' | 'reject';
}

// 可信度因子
export interface CredibilityFactor {
  name: string;
  category: 'source' | 'content' | 'technical' | 'temporal' | 'reputation';
  score: number; // 0-1 评分
  weight: number; // 权重 0-1
  description: string;
  evidence?: string[];
}

// 信源验证结果
export interface SourceVerification {
  sourceId: string;
  sourceName: string;
  domain: string;
  verificationStatus: 'verified' | 'unverified' | 'suspicious' | 'blacklisted';
  verificationDate: Date;
  verificationMethod: 'automated' | 'manual' | 'hybrid';
  trustScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: VerificationIndicator[];
}

// 验证指标
export interface VerificationIndicator {
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  description: string;
  score: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// 内容质量评估
export interface ContentQualityAssessment {
  overallScore: number;
  readability: number;
  accuracy: number;
  completeness: number;
  objectivity: number;
  timeliness: number;
  issues: QualityIssue[];
}

// 质量问题
export interface QualityIssue {
  type: 'grammar' | 'factual' | 'bias' | 'outdated' | 'incomplete' | 'sensationalism';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
  suggestion?: string;
}

// 高级可信度评估系统
export class AdvancedCredibilityAssessor {
  private sourceReputationDB: Map<string, SourceReputation> = new Map();
  private domainBlacklist: Set<string> = new Set();
  private domainWhitelist: Set<string> = new Set();
  private verificationCache: Map<string, SourceVerification> = new Map();

  constructor() {
    this.initializeReputationDatabase();
    this.initializeDomainLists();
  }

  // 初始化声誉数据库
  private initializeReputationDatabase(): void {
    // 预定义的高可信度信源
    const reputableSources: SourceReputation[] = [
      {
        domain: 'reuters.com',
        name: 'Reuters',
        category: 'news',
        baseScore: 0.95,
        verificationLevel: 'verified',
        lastUpdated: new Date(),
        factors: {
          journalisticStandards: 0.95,
          factChecking: 0.90,
          transparency: 0.85,
          correctionPolicy: 0.90
        }
      },
      {
        domain: 'ap.org',
        name: 'Associated Press',
        category: 'news',
        baseScore: 0.94,
        verificationLevel: 'verified',
        lastUpdated: new Date(),
        factors: {
          journalisticStandards: 0.94,
          factChecking: 0.92,
          transparency: 0.88,
          correctionPolicy: 0.91
        }
      },
      {
        domain: 'bbc.com',
        name: 'BBC',
        category: 'news',
        baseScore: 0.92,
        verificationLevel: 'verified',
        lastUpdated: new Date(),
        factors: {
          journalisticStandards: 0.92,
          factChecking: 0.89,
          transparency: 0.86,
          correctionPolicy: 0.87
        }
      },
      {
        domain: 'nytimes.com',
        name: 'New York Times',
        category: 'news',
        baseScore: 0.90,
        verificationLevel: 'verified',
        lastUpdated: new Date(),
        factors: {
          journalisticStandards: 0.90,
          factChecking: 0.88,
          transparency: 0.84,
          correctionPolicy: 0.86
        }
      },
      {
        domain: 'gov.uk',
        name: 'UK Government',
        category: 'government',
        baseScore: 0.98,
        verificationLevel: 'verified',
        lastUpdated: new Date(),
        factors: {
          officialSource: 0.98,
          authority: 0.96,
          transparency: 0.94,
          accountability: 0.95
        }
      },
      {
        domain: 'who.int',
        name: 'World Health Organization',
        category: 'international',
        baseScore: 0.96,
        verificationLevel: 'verified',
        lastUpdated: new Date(),
        factors: {
          authority: 0.96,
          expertise: 0.94,
          transparency: 0.92,
          peerReview: 0.95
        }
      }
    ];

    reputableSources.forEach(source => {
      this.sourceReputationDB.set(source.domain, source);
    });
  }

  // 初始化域名列表
  private initializeDomainLists(): void {
    // 白名单域名
    const whitelistDomains = [
      'reuters.com', 'ap.org', 'bbc.com', 'nytimes.com', 'washingtonpost.com',
      'gov.uk', 'who.int', 'un.org', 'worldbank.org', 'imf.org',
      'nature.com', 'science.org', 'ieee.org', 'acm.org'
    ];

    // 黑名单域名
    const blacklistDomains = [
      'fakenews.com', 'unreliablesource.com', 'clickbait.site',
      'misinformation.net', 'propaganda.org'
    ];

    whitelistDomains.forEach(domain => this.domainWhitelist.add(domain));
    blacklistDomains.forEach(domain => this.domainBlacklist.add(domain));
  }

  // 执行全面可信度评估
  public async assessCredibility(data: IntelligenceData): Promise<CredibilityRating> {
    const factors: CredibilityFactor[] = [];
    
    // 1. 信源可信度评估
    const sourceFactors = await this.assessSourceCredibility(data);
    factors.push(...sourceFactors);

    // 2. 内容质量评估
    const contentFactors = await this.assessContentQuality(data);
    factors.push(...contentFactors);

    // 3. 技术指标评估
    const technicalFactors = await this.assessTechnicalIndicators(data);
    factors.push(...technicalFactors);

    // 4. 时间新鲜度评估
    const temporalFactors = await this.assessTemporalFreshness(data);
    factors.push(...temporalFactors);

    // 5. 声誉和历史评估
    const reputationFactors = await this.assessReputation(data);
    factors.push(...reputationFactors);

    // 计算综合评分
    const weightedScore = this.calculateWeightedScore(factors);
    const confidence = this.calculateConfidence(factors);
    
    // 确定可信度等级
    const level = this.determineCredibilityLevel(weightedScore);
    const recommendation = this.getRecommendation(level, weightedScore);

    return {
      level,
      score: weightedScore,
      confidence,
      factors,
      recommendation
    };
  }

  // 评估信源可信度
  private async assessSourceCredibility(data: IntelligenceData): Promise<CredibilityFactor[]> {
    const factors: CredibilityFactor[] = [];
    const domain = this.extractDomain(data.url || '');

    // 检查域名黑名单
    if (this.domainBlacklist.has(domain)) {
      factors.push({
        name: 'Domain Blacklist',
        category: 'source',
        score: 0.0,
        weight: 0.4,
        description: 'Domain is in blacklist',
        evidence: [`Domain ${domain} is blacklisted`]
      });
      return factors;
    }

    // 检查域名白名单
    if (this.domainWhitelist.has(domain)) {
      factors.push({
        name: 'Domain Whitelist',
        category: 'source',
        score: 1.0,
        weight: 0.3,
        description: 'Domain is in trusted whitelist',
        evidence: [`Domain ${domain} is whitelisted`]
      });
    }

    // 检查信源声誉
    const reputation = this.sourceReputationDB.get(domain);
    if (reputation) {
      factors.push({
        name: 'Source Reputation',
        category: 'source',
        score: reputation.baseScore,
        weight: 0.3,
        description: `Known source with reputation score: ${reputation.baseScore}`,
        evidence: [`Source: ${reputation.name}, Category: ${reputation.category}`]
      });
    } else {
      factors.push({
        name: 'Source Reputation',
        category: 'source',
        score: 0.5,
        weight: 0.2,
        description: 'Unknown source - default moderate trust',
        evidence: ['No reputation data available']
      });
    }

    // 检查信源类型
    const sourceTypeScore = this.assessSourceType(data.source, data.type);
    factors.push({
      name: 'Source Type',
      category: 'source',
      score: sourceTypeScore,
      weight: 0.2,
      description: `Source type assessment: ${data.source} (${data.type})`
    });

    return factors;
  }

  // 评估内容质量
  private async assessContentQuality(data: IntelligenceData): Promise<CredibilityFactor[]> {
    const factors: CredibilityFactor[] = [];
    const content = data.content;

    // 内容长度评估
    const contentLength = content.length;
    const lengthScore = this.assessContentLength(contentLength);
    factors.push({
      name: 'Content Length',
      category: 'content',
      score: lengthScore,
      weight: 0.1,
      description: `Content length: ${contentLength} characters`,
      evidence: [`Length score: ${lengthScore.toFixed(2)}`]
    });

    // 语言质量评估
    const languageScore = this.assessLanguageQuality(content);
    factors.push({
      name: 'Language Quality',
      category: 'content',
      score: languageScore,
      weight: 0.15,
      description: 'Grammar, spelling, and structure assessment'
    });

    // 客观性评估
    const objectivityScore = this.assessObjectivity(content);
    factors.push({
      name: 'Objectivity',
      category: 'content',
      score: objectivityScore,
      weight: 0.2,
      description: 'Bias and emotional language assessment'
    });

    // 事实引用评估
    const citationScore = this.assessCitations(content);
    factors.push({
      name: 'Fact Citations',
      category: 'content',
      score: citationScore,
      weight: 0.15,
      description: 'Presence of sources and references'
    });

    return factors;
  }

  // 评估技术指标
  private async assessTechnicalIndicators(data: IntelligenceData): Promise<CredibilityFactor[]> {
    const factors: CredibilityFactor[] = [];

    // URL结构评估
    if (data.url) {
      const urlScore = this.assessURLStructure(data.url);
      factors.push({
        name: 'URL Structure',
        category: 'technical',
        score: urlScore,
        weight: 0.1,
        description: 'URL format and structure assessment'
      });
    }

    // HTTPS使用情况
    const httpsScore = this.assessHTTPSUsage(data.url || '');
    factors.push({
      name: 'HTTPS Usage',
      category: 'technical',
      score: httpsScore,
      weight: 0.05,
      description: 'Secure connection assessment'
    });

    // 元数据完整性
    const metadataScore = this.assessMetadataCompleteness(data);
    factors.push({
      name: 'Metadata Completeness',
      category: 'technical',
      score: metadataScore,
      weight: 0.1,
      description: 'Completeness of metadata information'
    });

    return factors;
  }

  // 评估时间新鲜度
  private async assessTemporalFreshness(data: IntelligenceData): Promise<CredibilityFactor[]> {
    const factors: CredibilityFactor[] = [];
    const now = new Date();
    const contentAge = (now.getTime() - data.timestamp.getTime()) / (1000 * 60 * 60); // 小时

    let freshnessScore = 1.0;
    if (contentAge > 168) { // 超过一周
      freshnessScore = Math.max(0.3, 1.0 - (contentAge - 168) / 672); // 线性衰减
    } else if (contentAge > 24) { // 超过一天
      freshnessScore = 1.0 - (contentAge - 24) / 144 * 0.3;
    }

    factors.push({
      name: 'Content Freshness',
      category: 'temporal',
      score: freshnessScore,
      weight: 0.1,
      description: `Content age: ${contentAge.toFixed(1)} hours`,
      evidence: [`Freshness score: ${freshnessScore.toFixed(2)}`]
    });

    return factors;
  }

  // 评估声誉和历史
  private async assessReputation(data: IntelligenceData): Promise<CredibilityFactor[]> {
    const factors: CredibilityFactor[] = [];
    const domain = this.extractDomain(data.url || '');

    // 历史验证记录
    const verification = this.verificationCache.get(domain);
    if (verification) {
      factors.push({
        name: 'Verification History',
        category: 'reputation',
        score: verification.trustScore,
        weight: 0.2,
        description: `Previous verification result: ${verification.verificationStatus}`,
        evidence: [`Verified on: ${verification.verificationDate.toISOString()}`]
      });
    }

    // 社交媒体提及
    const socialScore = await this.assessSocialMentions(data);
    factors.push({
      name: 'Social Mentions',
      category: 'reputation',
      score: socialScore,
      weight: 0.1,
      description: 'Social media presence and mentions'
    });

    return factors;
  }

  // 执行信源验证
  public async verifySource(sourceData: IntelligenceData): Promise<SourceVerification> {
    const domain = this.extractDomain(sourceData.url || '');
    const cacheKey = `verification_${domain}`;

    // 检查缓存
    const cached = this.verificationCache.get(cacheKey);
    if (cached && (Date.now() - cached.verificationDate.getTime()) < 24 * 60 * 60 * 1000) {
      return cached;
    }

    const indicators: VerificationIndicator[] = [];
    let trustScore = 0.5;
    let verificationStatus: SourceVerification['verificationStatus'] = 'unverified';
    let riskLevel: SourceVerification['riskLevel'] = 'medium';

    // 域名检查
    if (this.domainBlacklist.has(domain)) {
      indicators.push({
        type: 'negative',
        category: 'Domain',
        description: 'Domain is in blacklist',
        score: 0.0,
        severity: 'critical'
      });
      verificationStatus = 'blacklisted';
      riskLevel = 'critical';
    } else if (this.domainWhitelist.has(domain)) {
      indicators.push({
        type: 'positive',
        category: 'Domain',
        description: 'Domain is in trusted whitelist',
        score: 1.0
      });
      verificationStatus = 'verified';
      riskLevel = 'low';
    }

    // 声誉检查
    const reputation = this.sourceReputationDB.get(domain);
    if (reputation) {
      indicators.push({
        type: 'positive',
        category: 'Reputation',
        description: `Known reputable source: ${reputation.name}`,
        score: reputation.baseScore
      });
      trustScore = reputation.baseScore;
    }

    // HTTPS检查
    if (sourceData.url && sourceData.url.startsWith('https://')) {
      indicators.push({
        type: 'positive',
        category: 'Security',
        description: 'Uses HTTPS secure connection',
        score: 0.8
      });
    } else {
      indicators.push({
        type: 'negative',
        category: 'Security',
        description: 'Does not use HTTPS',
        score: 0.3,
        severity: 'medium'
      });
    }

    // 内容质量检查
    const contentScore = this.assessContentQualityQuick(sourceData.content);
    indicators.push({
      type: contentScore > 0.7 ? 'positive' : 'negative',
      category: 'Content',
      description: `Content quality assessment: ${(contentScore * 100).toFixed(0)}%`,
      score: contentScore
    });

    // 计算最终信任评分
    if (indicators.length > 0) {
      trustScore = indicators.reduce((sum, indicator) => sum + indicator.score, 0) / indicators.length;
    }

    // 确定风险等级
    if (trustScore >= 0.8) riskLevel = 'low';
    else if (trustScore >= 0.6) riskLevel = 'medium';
    else if (trustScore >= 0.4) riskLevel = 'high';
    else riskLevel = 'critical';

    // 确定验证状态
    if (verificationStatus === 'unverified') {
      if (trustScore >= 0.7) verificationStatus = 'verified';
      else if (trustScore >= 0.5) verificationStatus = 'unverified';
      else verificationStatus = 'suspicious';
    }

    const verification: SourceVerification = {
      sourceId: sourceData.id,
      sourceName: sourceData.source,
      domain,
      verificationStatus,
      verificationDate: new Date(),
      verificationMethod: 'automated',
      trustScore,
      riskLevel,
      indicators
    };

    // 缓存结果
    this.verificationCache.set(cacheKey, verification);

    return verification;
  }

  // 辅助方法
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  private assessSourceType(source: string, type: string): number {
    const sourceTypeScores: Record<string, number> = {
      'government': 0.95,
      'international': 0.90,
      'academic': 0.88,
      'news': 0.75,
      'business': 0.70,
      'threat': 0.65,
      'security': 0.60,
      'geopolitical': 0.55
    };

    return sourceTypeScores[type] || 0.5;
  }

  private assessContentLength(length: number): number {
    if (length < 100) return 0.3;
    if (length < 500) return 0.6;
    if (length < 1000) return 0.8;
    return 0.9;
  }

  private assessLanguageQuality(content: string): number {
    // 简化的语言质量评估
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    let score = 0.7; // 基础分
    
    // 惩罚过短或过长的句子
    if (avgSentenceLength < 20 || avgSentenceLength > 200) score -= 0.2;
    
    // 检查基本标点符号
    const hasProperPunctuation = /[.!?]/.test(content);
    if (!hasProperPunctuation) score -= 0.2;
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private assessObjectivity(content: string): number {
    // 检查主观语言和情感词汇
    const subjectiveWords = [
      'amazing', 'terrible', 'worst', 'best', 'incredible', 'disgusting',
      'perfect', 'awful', 'fantastic', 'horrible', 'love', 'hate'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    const subjectiveCount = words.filter(word => 
      subjectiveWords.some(sw => word.includes(sw))
    ).length;
    
    const subjectiveRatio = subjectiveCount / words.length;
    return Math.max(0.1, 1.0 - (subjectiveRatio * 10)); // 线性惩罚
  }

  private assessCitations(content: string): number {
    // 检查引用和来源标记
    const citationPatterns = [
      /according to/i,
      /sources? say/i,
      /reported by/i,
      /\[?\d+\]?/g, // 数字引用
      /https?:\/\/\S+/g // URL链接
    ];
    
    let citationCount = 0;
    citationPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        citationCount += matches.length;
      }
    });
    
    return Math.min(1.0, citationCount / 5); // 每5个引用得满分
  }

  private assessURLStructure(url: string): number {
    try {
      const urlObj = new URL(url);
      let score = 0.7;
      
      // 检查路径复杂度
      const pathDepth = urlObj.pathname.split('/').length;
      if (pathDepth > 5) score -= 0.2;
      
      // 检查查询参数
      const paramCount = urlObj.searchParams.size;
      if (paramCount > 10) score -= 0.1;
      
      return Math.max(0.1, score);
    } catch {
      return 0.1;
    }
  }

  private assessHTTPSUsage(url: string): number {
    return url.startsWith('https://') ? 1.0 : 0.3;
  }

  private assessMetadataCompleteness(data: IntelligenceData): number {
    const requiredFields = ['title', 'content', 'timestamp'];
    const presentFields = requiredFields.filter(field => data[field as keyof IntelligenceData]);
    return presentFields.length / requiredFields.length;
  }

  private async assessSocialMentions(data: IntelligenceData): Promise<number> {
    // 简化的社交媒体提及评估
    // 在实际项目中，这里应该调用社交媒体API
    return 0.5; // 默认中等分
  }

  private assessContentQualityQuick(content: string): number {
    const factors = [
      this.assessContentLength(content.length),
      this.assessLanguageQuality(content),
      this.assessObjectivity(content)
    ];
    
    return factors.reduce((sum, score) => sum + score, 0) / factors.length;
  }

  private calculateWeightedScore(factors: CredibilityFactor[]): number {
    let weightedSum = 0;
    let totalWeight = 0;
    
    factors.forEach(factor => {
      weightedSum += factor.score * factor.weight;
      totalWeight += factor.weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  private calculateConfidence(factors: CredibilityFactor[]): number {
    // 基于因子数量和一致性计算置信度
    if (factors.length === 0) return 0.1;
    
    const scores = factors.map(f => f.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 一致性越高，置信度越高
    const consistency = Math.max(0, 1 - standardDeviation);
    const baseConfidence = Math.min(0.9, factors.length * 0.1);
    
    return (consistency + baseConfidence) / 2;
  }

  private determineCredibilityLevel(score: number): CredibilityRating['level'] {
    if (score >= 0.9) return 'T1';
    if (score >= 0.7) return 'T2';
    if (score >= 0.5) return 'T3';
    return 'T4';
  }

  private getRecommendation(level: CredibilityRating['level'], score: number): CredibilityRating['recommendation'] {
    switch (level) {
      case 'T1':
        return 'trust';
      case 'T2':
        return score >= 0.8 ? 'trust' : 'verify';
      case 'T3':
        return 'verify';
      case 'T4':
        return score >= 0.3 ? 'suspect' : 'reject';
      default:
        return 'verify';
    }
  }

  // 获取信源统计信息
  public getStatistics(): {
    totalSources: number;
    verifiedSources: number;
    blacklistedSources: number;
    averageTrustScore: number;
    credibilityDistribution: Record<string, number>;
  } {
    const allVerifications = Array.from(this.verificationCache.values());
    const verifiedSources = allVerifications.filter(v => v.verificationStatus === 'verified').length;
    const blacklistedSources = allVerifications.filter(v => v.verificationStatus === 'blacklisted').length;
    const averageTrustScore = allVerifications.reduce((sum, v) => sum + v.trustScore, 0) / allVerifications.length || 0;

    const credibilityDistribution: Record<string, number> = { T1: 0, T2: 0, T3: 0, T4: 0 };
    allVerifications.forEach(v => {
      if (v.trustScore >= 0.9) credibilityDistribution.T1++;
      else if (v.trustScore >= 0.7) credibilityDistribution.T2++;
      else if (v.trustScore >= 0.5) credibilityDistribution.T3++;
      else credibilityDistribution.T4++;
    });

    return {
      totalSources: allVerifications.length,
      verifiedSources,
      blacklistedSources,
      averageTrustScore,
      credibilityDistribution
    };
  }
}

// 类型定义
interface SourceReputation {
  domain: string;
  name: string;
  category: string;
  baseScore: number;
  verificationLevel: 'verified' | 'unverified';
  lastUpdated: Date;
  factors: Record<string, number>;
}

// 创建单例实例
export const credibilityAssessor = new AdvancedCredibilityAssessor();