/**
 * 统一情报API类型定义
 */

export interface IntelligenceDataPoint {
  id: string
  timestamp: string
  category: 'security' | 'geopolitical' | 'business' | 'news'
  subcategory: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number // 0-1
  source: {
    name: string
    reliability: 'A' | 'B' | 'C' | 'D' | 'E' // A=最可靠, E=不可靠
    url?: string
    apiVersion?: string
  }
  content: {
    title: string
    description: string
    indicators?: string[]
    entities?: string[]
    location?: string
    impact?: string
    rawData?: any
  }
  metadata: {
    tags: string[]
    classification?: 'TLP:WHITE' | 'TLP:GREEN' | 'TLP:AMBER' | 'TLP:RED'
    relatedEvents?: string[]
    expiresAt?: string
  }
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  rateLimitRemaining?: number
  rateLimitReset?: number
  source: string
  timestamp: string
}

export interface APIProvider {
  name: string
  category: 'security' | 'geopolitical' | 'business' | 'news'
  enabled: boolean
  rateLimit: {
    requests: number
    period: 'minute' | 'hour' | 'day'
    remaining?: number
    resetTime?: number
  }
  
  // 核心方法
  query(query: string, options?: any): Promise<APIResponse<IntelligenceDataPoint[]>>
  getStatus(): Promise<{ available: boolean; lastCheck: string; error?: string }>
  
  // 可选方法
  validateConfig?(): boolean
  clearCache?(): void
}

export interface SecurityThreatData {
  indicator: string
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email'
  threatScore: number
  malwareDetections: number
  reputation: 'clean' | 'suspicious' | 'malicious'
  firstSeen?: string
  lastSeen?: string
  sources: string[]
}

export interface GeopoliticalEventData {
  eventId: string
  eventType: 'conflict' | 'protest' | 'political' | 'economic'
  location: {
    country: string
    region?: string
    coordinates?: [number, number]
  }
  actors: string[]
  description: string
  intensity: number
  casualties?: number
  sources: string[]
}

export interface BusinessIntelligenceData {
  symbol?: string
  companyName?: string
  dataType: 'stock' | 'crypto' | 'company' | 'market'
  value: number
  change24h?: number
  marketCap?: number
  volume?: number
  currency: string
  exchange?: string
  lastUpdated: string
}

export interface NewsData {
  headline: string
  summary: string
  url: string
  publishedAt: string
  source: string
  category: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  relevanceScore: number
}

// 统一查询选项
export interface QueryOptions {
  maxResults?: number
  timeRange?: {
    from: Date
    to: Date
  }
  geoFilter?: string[]
  severityFilter?: ('low' | 'medium' | 'high' | 'critical')[]
  confidenceThreshold?: number
  useCache?: boolean
  priority?: 'low' | 'medium' | 'high'
}

// 关联分析结果
export interface CorrelationResult {
  type: 'security-geo' | 'geo-business' | 'security-business' | 'cross-domain'
  confidence: number
  description: string
  relatedDataPoints: string[]
  significance: 'low' | 'medium' | 'high'
  recommendedActions?: string[]
}

// 聚合分析报告
export interface IntelligenceReport {
  id: string
  query: string
  analysisType: 'threat_assessment' | 'geopolitical_analysis' | 'business_intelligence' | 'comprehensive'
  timestamp: string
  executionTime: number
  
  summary: {
    totalDataPoints: number
    averageConfidence: number
    overallThreatLevel: 'low' | 'medium' | 'high' | 'critical'
    keyFindings: string[]
    recommendations: string[]
  }
  
  dataBreakdown: {
    security: {
      count: number
      highRiskIndicators: IntelligenceDataPoint[]
      threatSources: string[]
    }
    geopolitical: {
      count: number
      activeEvents: IntelligenceDataPoint[]
      affectedRegions: string[]
    }
    business: {
      count: number
      marketIndicators: IntelligenceDataPoint[]
      financialRisks: string[]
    }
    news: {
      count: number
      breakingNews: IntelligenceDataPoint[]
      sentimentAnalysis: {
        positive: number
        negative: number
        neutral: number
      }
    }
  }
  
  correlations: CorrelationResult[]
  rawData: IntelligenceDataPoint[]
  
  sources: {
    successful: string[]
    failed: string[]
    rateLimited: string[]
  }
}