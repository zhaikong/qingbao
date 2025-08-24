/**
 * 数据源质量控制器 - 参考舆情产品的信源优先级策略
 */

interface SourceQuality {
  domain: string
  reliability: 'high' | 'medium' | 'low'
  category: 'government' | 'news' | 'academic' | 'social' | 'commercial'
  trustScore: number
  lastUpdated: Date
}

export class SourceQualityController {
  private qualitySources: SourceQuality[] = [
    // 政府官方网站 - 最高优先级
    { domain: 'gov.cn', reliability: 'high', category: 'government', trustScore: 95, lastUpdated: new Date() },
    { domain: 'xinhuanet.com', reliability: 'high', category: 'news', trustScore: 90, lastUpdated: new Date() },
    { domain: 'people.com.cn', reliability: 'high', category: 'news', trustScore: 90, lastUpdated: new Date() },
    
    // 权威媒体
    { domain: 'chinanews.com.cn', reliability: 'high', category: 'news', trustScore: 85, lastUpdated: new Date() },
    { domain: 'cctv.com', reliability: 'high', category: 'news', trustScore: 85, lastUpdated: new Date() },
    { domain: 'cnr.cn', reliability: 'high', category: 'news', trustScore: 85, lastUpdated: new Date() },
    
    // 学术机构
    { domain: 'edu.cn', reliability: 'high', category: 'academic', trustScore: 88, lastUpdated: new Date() },
    { domain: 'cas.cn', reliability: 'high', category: 'academic', trustScore: 88, lastUpdated: new Date() },
    
    // 国际权威媒体
    { domain: 'reuters.com', reliability: 'high', category: 'news', trustScore: 85, lastUpdated: new Date() },
    { domain: 'bbc.com', reliability: 'high', category: 'news', trustScore: 85, lastUpdated: new Date() },
    { domain: 'cnn.com', reliability: 'medium', category: 'news', trustScore: 75, lastUpdated: new Date() },
    
    // 商业媒体
    { domain: 'bloomberg.com', reliability: 'high', category: 'news', trustScore: 80, lastUpdated: new Date() },
    { domain: 'wsj.com', reliability: 'high', category: 'news', trustScore: 80, lastUpdated: new Date() },
    
    // 社交媒体 - 较低优先级
    { domain: 'weibo.com', reliability: 'low', category: 'social', trustScore: 40, lastUpdated: new Date() },
    { domain: 'twitter.com', reliability: 'low', category: 'social', trustScore: 35, lastUpdated: new Date() }
  ]

  /**
   * 评估数据源质量
   */
  assessSourceQuality(url: string): {
    trustScore: number
    reliability: 'high' | 'medium' | 'low'
    category: string
    recommendation: string
  } {
    const domain = this.extractDomain(url)
    const source = this.findSourceByDomain(domain)
    
    if (source) {
      return {
        trustScore: source.trustScore,
        reliability: source.reliability,
        category: source.category,
        recommendation: this.getRecommendation(source)
      }
    }
    
    // 未知来源的启发式评估
    return this.heuristicAssessment(domain)
  }

  /**
   * 过滤和排序搜索结果
   */
  filterAndRankResults(results: any[]): any[] {
    return results
      .map(result => ({
        ...result,
        qualityAssessment: this.assessSourceQuality(result.url || result.link)
      }))
      .filter(result => result.qualityAssessment.trustScore >= 30) // 过滤低质量源
      .sort((a, b) => {
        // 按信任度排序
        const scoreDiff = b.qualityAssessment.trustScore - a.qualityAssessment.trustScore
        if (scoreDiff !== 0) return scoreDiff
        
        // 按类别优先级排序
        const categoryPriority = { government: 4, academic: 3, news: 2, commercial: 1, social: 0 }
        const aPriority = categoryPriority[a.qualityAssessment.category as keyof typeof categoryPriority] || 0
        const bPriority = categoryPriority[b.qualityAssessment.category as keyof typeof categoryPriority] || 0
        
        return bPriority - aPriority
      })
  }

  /**
   * 生成搜索引擎特定查询
   */
  generateQualityQueries(keywords: string[]): {
    government: string[]
    academic: string[]
    news: string[]
    international: string[]
  } {
    const baseKeywords = keywords.slice(0, 3)
    
    return {
      government: baseKeywords.map(k => `site:gov.cn ${k}`),
      academic: baseKeywords.map(k => `site:edu.cn ${k}`),
      news: [
        ...baseKeywords.map(k => `site:xinhuanet.com ${k}`),
        ...baseKeywords.map(k => `site:people.com.cn ${k}`)
      ],
      international: [
        ...baseKeywords.map(k => `site:reuters.com ${k}`),
        ...baseKeywords.map(k => `site:bbc.com ${k}`)
      ]
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  }

  private findSourceByDomain(domain: string): SourceQuality | undefined {
    return this.qualitySources.find(source => 
      domain.includes(source.domain) || source.domain.includes(domain)
    )
  }

  private heuristicAssessment(domain: string): {
    trustScore: number
    reliability: 'high' | 'medium' | 'low'
    category: string
    recommendation: string
  } {
    let trustScore = 50 // 默认分数
    let category = 'commercial'
    
    // 政府域名
    if (domain.includes('.gov') || domain.includes('政府')) {
      trustScore = 90
      category = 'government'
    }
    // 教育机构
    else if (domain.includes('.edu') || domain.includes('大学') || domain.includes('学院')) {
      trustScore = 85
      category = 'academic'
    }
    // 新闻媒体
    else if (domain.includes('news') || domain.includes('新闻') || domain.includes('日报')) {
      trustScore = 70
      category = 'news'
    }
    // 社交媒体
    else if (domain.includes('weibo') || domain.includes('twitter') || domain.includes('facebook')) {
      trustScore = 35
      category = 'social'
    }
    
    const reliability: 'high' | 'medium' | 'low' = 
      trustScore >= 80 ? 'high' : trustScore >= 60 ? 'medium' : 'low'
    
    return {
      trustScore,
      reliability,
      category,
      recommendation: this.getRecommendationByScore(trustScore)
    }
  }

  private getRecommendation(source: SourceQuality): string {
    switch (source.reliability) {
      case 'high':
        return '权威信源，优先采用'
      case 'medium':
        return '可信信源，需要交叉验证'
      case 'low':
        return '参考信源，需要谨慎使用'
      default:
        return '未知信源，建议验证'
    }
  }

  private getRecommendationByScore(score: number): string {
    if (score >= 80) return '权威信源，优先采用'
    if (score >= 60) return '可信信源，需要交叉验证'
    if (score >= 40) return '参考信源，需要谨慎使用'
    return '低质量信源，建议过滤'
  }
}

export const sourceQualityController = new SourceQualityController()