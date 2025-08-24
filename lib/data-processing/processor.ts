import { SearchResult } from '../types';
import { ProcessedDocument, ProcessingResult, QualityMetrics } from './types';
import { credibilityScorer } from './credibility-scorer';
import crypto from 'crypto';

export class DataProcessor {
  private duplicateThreshold = 0.8; // 相似度阈值

  /**
   * 处理搜索结果
   */
  async processSearchResults(results: SearchResult[]): Promise<ProcessingResult> {
    // 1. 去重处理
    const deduplicatedResults = this.removeDuplicates(results);
    
    // 2. 可信度评级
    const processedDocuments = await this.processDocuments(deduplicatedResults);
    
    // 3. 生成统计信息
    const statistics = this.generateStatistics(results, processedDocuments);
    
    // 4. 计算质量评分
    const qualityScore = this.calculateQualityScore(processedDocuments);

    return {
      documents: processedDocuments,
      statistics,
      qualityScore
    };
  }

  /**
   * 去重处理
   */
  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const uniqueResults: SearchResult[] = [];
    const seenUrls = new Set<string>();
    const contentHashes = new Map<string, SearchResult>();

    for (const result of results) {
      // URL去重
      if (seenUrls.has(result.url)) {
        continue;
      }
      seenUrls.add(result.url);

      // 内容相似度去重
      const contentHash = this.generateContentHash(result.content || result.title);
      const existingResult = contentHashes.get(contentHash);
      
      if (existingResult) {
        // 如果内容相似，选择可信度更高的源
        const currentCredibility = credibilityScorer.score(result.url);
        const existingCredibility = credibilityScorer.score(existingResult.url);
        
        if (currentCredibility.score > existingCredibility.score) {
          // 替换为更可信的源
          const index = uniqueResults.findIndex(r => r.url === existingResult.url);
          if (index !== -1) {
            uniqueResults[index] = result;
            contentHashes.set(contentHash, result);
          }
        }
      } else {
        uniqueResults.push(result);
        contentHashes.set(contentHash, result);
      }
    }

    return uniqueResults;
  }

  /**
   * 生成内容哈希用于去重
   */
  private generateContentHash(content: string): string {
    // 标准化文本：去除标点、转小写、去空格
    const normalized = content
      .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 保留中英文字符
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    
    return crypto.createHash('md5').update(normalized).digest('hex').substring(0, 8);
  }

  /**
   * 处理文档，添加可信度评级和实体提取
   */
  private async processDocuments(results: SearchResult[]): Promise<ProcessedDocument[]> {
    const processedDocs: ProcessedDocument[] = [];

    for (const result of results) {
      const credibility = credibilityScorer.score(result.url, result.content);
      const entities = this.extractEntities(result.content || result.title);

      const processedDoc: ProcessedDocument = {
        id: crypto.randomUUID(),
        url: result.url,
        title: result.title,
        content: result.content || '',
        snippet: result.content ? result.content.substring(0, 200) : result.title.substring(0, 200),
        source: result.source,
        credibilityLevel: credibility.level,
        credibilityScore: credibility.score,
        publishDate: result.publishDate,
        extractedEntities: entities
      };

      processedDocs.push(processedDoc);
    }

    return processedDocs;
  }

  /**
   * 简单的实体提取（可以后续集成更高级的NLP库）
   */
  private extractEntities(text: string): {
    persons: string[];
    organizations: string[];
    locations: string[];
    keywords: string[];
  } {
    // 这里是简化版实现，实际项目中可以集成jieba、spaCy等NLP库
    const persons: string[] = [];
    const organizations: string[] = [];
    const locations: string[] = [];
    const keywords: string[] = [];

    // 简单的关键词提取
    const words = text.match(/[\u4e00-\u9fff]+|[a-zA-Z]+/g) || [];
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length >= 2) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // 提取高频词作为关键词
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    keywords.push(...sortedWords);

    // 简单的地名识别（基于常见地名后缀）
    const locationSuffixes = ['市', '省', '县', '区', '国', '州'];
    words.forEach(word => {
      if (locationSuffixes.some(suffix => word.endsWith(suffix))) {
        locations.push(word);
      }
    });

    return { persons, organizations, locations, keywords };
  }

  /**
   * 生成统计信息
   */
  private generateStatistics(originalResults: SearchResult[], processedDocs: ProcessedDocument[]) {
    const credibilityDistribution = {
      T1: 0,
      T2: 0,
      T3: 0,
      T4: 0
    };

    const sourceDistribution: Record<string, number> = {};

    processedDocs.forEach(doc => {
      credibilityDistribution[doc.credibilityLevel]++;
      sourceDistribution[doc.source] = (sourceDistribution[doc.source] || 0) + 1;
    });

    return {
      totalDocuments: processedDocs.length,
      duplicatesRemoved: originalResults.length - processedDocs.length,
      credibilityDistribution,
      sourceDistribution
    };
  }

  /**
   * 计算整体质量评分
   */
  private calculateQualityScore(documents: ProcessedDocument[]): number {
    if (documents.length === 0) return 0;

    const metrics = this.calculateQualityMetrics(documents);
    
    // 加权计算质量评分
    const weights = {
      sourceCount: 0.2,      // 信源数量权重
      duplicateRatio: 0.2,   // 去重效果权重
      highCredibilityRatio: 0.3, // 高可信度比例权重
      contentQuality: 0.2,   // 内容质量权重
      diversityScore: 0.1    // 多样性权重
    };

    let score = 0;
    score += Math.min(metrics.sourceCount / 10, 1) * weights.sourceCount;
    score += (1 - metrics.duplicateRatio) * weights.duplicateRatio;
    score += metrics.highCredibilityRatio * weights.highCredibilityRatio;
    score += metrics.contentQuality * weights.contentQuality;
    score += metrics.diversityScore * weights.diversityScore;

    return Math.round(score * 100) / 100;
  }

  /**
   * 计算质量指标
   */
  private calculateQualityMetrics(documents: ProcessedDocument[]): QualityMetrics {
    const sourceCount = documents.length;
    const duplicateRatio = 0; // 已经去重，所以为0
    
    const highCredibilityCount = documents.filter(
      doc => doc.credibilityLevel === 'T1' || doc.credibilityLevel === 'T2'
    ).length;
    const highCredibilityRatio = sourceCount > 0 ? highCredibilityCount / sourceCount : 0;

    const avgCredibilityScore = documents.reduce((sum, doc) => sum + doc.credibilityScore, 0) / sourceCount;
    
    const uniqueSources = new Set(documents.map(doc => doc.source)).size;
    const diversityScore = sourceCount > 0 ? uniqueSources / sourceCount : 0;

    return {
      sourceCount,
      duplicateRatio,
      highCredibilityRatio,
      contentQuality: avgCredibilityScore,
      diversityScore
    };
  }
}

// 导出单例实例
export const dataProcessor = new DataProcessor();