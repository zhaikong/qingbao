import { CredibilityRule } from './types';

export class CredibilityScorer {
  private domainRules: Map<string, CredibilityRule> = new Map();
  private blacklist: Set<string> = new Set();
  private whitelist: Map<string, 'T1' | 'T2' | 'T3'> = new Map();

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    // T1级域名（权威官方）
    const t1Domains = [
      'xinhuanet.com', 'people.com.cn', 'gov.cn', 'edu.cn',
      'reuters.com', 'ap.org', 'bbc.com', 'cnn.com',
      'state.gov', 'whitehouse.gov', 'un.org'
    ];

    // T2级域名（知名媒体）
    const t2Domains = [
      'nytimes.com', 'wsj.com', 'ft.com', 'economist.com',
      'guardian.com', 'washingtonpost.com', 'bloomberg.com',
      'sina.com.cn', 'sohu.com', '163.com', 'qq.com'
    ];

    // T3级域名（一般媒体）
    const t3Domains = [
      'medium.com', 'forbes.com', 'techcrunch.com',
      'zhihu.com', 'jianshu.com', 'csdn.net'
    ];

    // 黑名单域名
    const blacklistDomains = [
      'fake-news.com', 'spam-site.com' // 示例，实际需要维护完整黑名单
    ];

    // 初始化规则
    t1Domains.forEach(domain => {
      this.whitelist.set(domain, 'T1');
      this.domainRules.set(domain, {
        domain,
        level: 'T1',
        reason: '权威官方媒体',
        weight: 0.95
      });
    });

    t2Domains.forEach(domain => {
      this.whitelist.set(domain, 'T2');
      this.domainRules.set(domain, {
        domain,
        level: 'T2',
        reason: '知名媒体机构',
        weight: 0.85
      });
    });

    t3Domains.forEach(domain => {
      this.whitelist.set(domain, 'T3');
      this.domainRules.set(domain, {
        domain,
        level: 'T3',
        reason: '一般媒体平台',
        weight: 0.65
      });
    });

    blacklistDomains.forEach(domain => {
      this.blacklist.add(domain);
    });
  }

  /**
   * 从URL提取域名
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  /**
   * 计算域名基础评分
   */
  private calculateDomainScore(domain: string): number {
    // 检查预定义规则
    const rule = this.domainRules.get(domain);
    if (rule) {
      return rule.weight;
    }

    // 基于域名特征的启发式评分
    let score = 0.5; // 基础分

    // 政府域名加分
    if (domain.endsWith('.gov') || domain.endsWith('.gov.cn')) {
      score += 0.4;
    }
    // 教育域名加分
    else if (domain.endsWith('.edu') || domain.endsWith('.edu.cn')) {
      score += 0.3;
    }
    // 组织域名加分
    else if (domain.endsWith('.org')) {
      score += 0.2;
    }
    // 知名TLD
    else if (domain.endsWith('.com') || domain.endsWith('.cn')) {
      score += 0.1;
    }

    // 域名长度惩罚（过长的域名通常可信度较低）
    if (domain.length > 20) {
      score -= 0.1;
    }

    // 包含数字或特殊字符的惩罚
    if (/\d/.test(domain) || /-{2,}/.test(domain)) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 分析内容质量
   */
  private analyzeContentQuality(content: string): number {
    let score = 0.5;

    // 内容长度评分
    if (content.length > 500) score += 0.1;
    if (content.length > 1000) score += 0.1;

    // 结构化内容加分
    if (content.includes('。') || content.includes('.')) score += 0.1;
    if (content.includes('：') || content.includes(':')) score += 0.05;

    // 包含时间信息加分
    if (/\d{4}年|\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2}/.test(content)) {
      score += 0.1;
    }

    // 包含引用或来源加分
    if (content.includes('据') || content.includes('根据') || content.includes('来源')) {
      score += 0.1;
    }

    // 垃圾内容惩罚
    if (content.includes('点击') || content.includes('广告')) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 计算综合可信度评分
   */
  score(url: string, content: string = ''): { level: 'T1' | 'T2' | 'T3' | 'T4', score: number, reason: string } {
    const domain = this.extractDomain(url);

    // 黑名单检查
    if (this.blacklist.has(domain)) {
      return {
        level: 'T4',
        score: 0.1,
        reason: '域名在黑名单中'
      };
    }

    // 白名单检查
    if (this.whitelist.has(domain)) {
      const level = this.whitelist.get(domain)!;
      const rule = this.domainRules.get(domain);
      return {
        level,
        score: rule?.weight || 0.8,
        reason: rule?.reason || '预定义可信域名'
      };
    }

    // 综合评分
    const domainScore = this.calculateDomainScore(domain);
    const contentScore = content ? this.analyzeContentQuality(content) : 0.5;
    const finalScore = (domainScore * 0.7) + (contentScore * 0.3);

    let level: 'T1' | 'T2' | 'T3' | 'T4';
    let reason: string;

    if (finalScore >= 0.9) {
      level = 'T1';
      reason = '高可信度域名和内容';
    } else if (finalScore >= 0.75) {
      level = 'T2';
      reason = '较高可信度';
    } else if (finalScore >= 0.6) {
      level = 'T3';
      reason = '中等可信度';
    } else {
      level = 'T4';
      reason = '较低可信度';
    }

    return { level, score: finalScore, reason };
  }

  /**
   * 批量评分
   */
  batchScore(documents: Array<{ url: string, content?: string }>): Array<{ level: 'T1' | 'T2' | 'T3' | 'T4', score: number, reason: string }> {
    return documents.map(doc => this.score(doc.url, doc.content));
  }
}

// 导出单例实例
export const credibilityScorer = new CredibilityScorer();