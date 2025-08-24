/**
 * 多源数据融合和关联算法
 * 支持实体解析、关系映射、时空分析、置信度评估
 */

export interface DataSource {
  id: string
  name: string
  type: 'osint' | 'api' | 'web' | 'social' | 'threat' | 'internal'
  credibility: number // 0-1
  freshness: number // 0-1
  coverage: number // 0-1
  lastUpdate: Date
  metadata: any
}

export interface DataEntity {
  id: string
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'user' | 'organization' | 'threat_actor' | 'malware' | 'vulnerability'
  value: string
  confidence: number
  sources: string[]
  attributes: Record<string, any>
  temporalData: TemporalData
  spatialData: SpatialData
  relationships: Relationship[]
  tags: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  firstSeen: Date
  lastSeen: Date
}

export interface Relationship {
  id: string
  sourceEntity: string
  targetEntity: string
  type: 'connects_to' | 'communicates_with' | 'hosts' | 'resolves_to' | 'owned_by' | 'associated_with' | 'variant_of' | 'targets'
  strength: number // 0-1
  confidence: number
  evidence: Evidence[]
  temporal: TemporalData
  direction: 'bidirectional' | 'unidirectional'
}

export interface Evidence {
  sourceId: string
  sourceType: string
  timestamp: Date
  description: string
  confidence: number
  relevance: number
}

export interface TemporalData {
  firstSeen: Date
  lastSeen: Date
  frequency: number
  patterns: TemporalPattern[]
  anomalies: TemporalAnomaly[]
}

export interface TemporalPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'event_driven'
  confidence: number
  description: string
  timeWindows: DateRange[]
}

export interface DateRange {
  start: Date
  end: Date
}

export interface TemporalAnomaly {
  timestamp: Date
  type: 'spike' | 'drop' | 'gap' | 'irregular'
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface SpatialData {
  locations: Location[]
  networks: Network[]
  infrastructure: Infrastructure[]
}

export interface Location {
  type: 'country' | 'region' | 'city' | 'coordinates' | 'network'
  value: string
  confidence: number
  source: string
}

export interface Network {
  asn: number
  isp: string
  organization: string
  country: string
  region: string
  latitude?: number
  longitude?: number
  confidence: number
}

export interface Infrastructure {
  type: 'hosting' | 'cloud' | 'cdn' | 'vpn' | 'proxy' | 'tor'
  provider: string
  description: string
  confidence: number
}

export interface FusionConfig {
  entityResolution: {
    similarityThreshold: number
    fuzzyMatching: boolean
    temporalWindow: number // hours
    spatialWeight: number
  }
  correlation: {
    maxDepth: number
    minConfidence: number
    timeWindow: number // hours
    includeIndirect: boolean
  }
  scoring: {
    credibilityWeight: number
    recencyWeight: number
    sourceWeight: number
    anomalyBonus: number
  }
  filtering: {
    minConfidence: number
    maxAge: number // hours
    excludeTypes: string[]
    requireMultipleSources: boolean
  }
}

export interface FusionResult {
  entities: DataEntity[]
  relationships: Relationship[]
  clusters: EntityCluster[]
  insights: FusionInsight[]
  statistics: FusionStatistics
  processingTime: number
  config: FusionConfig
}

export interface EntityCluster {
  id: string
  type: 'campaign' | 'threat_actor' | 'infrastructure' | 'malware_family' | 'campaign_cluster'
  entities: string[]
  confidence: number
  attributes: Record<string, any>
  timeline: TimelineEvent[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface TimelineEvent {
  timestamp: Date
  type: 'entity_created' | 'relationship_established' | 'cluster_formed' | 'anomaly_detected'
  description: string
  entities: string[]
  significance: 'low' | 'medium' | 'high'
}

export interface FusionInsight {
  id: string
  type: 'entity_correlation' | 'temporal_pattern' | 'spatial_cluster' | 'anomaly_detection' | 'threat_campaign'
  title: string
  description: string
  confidence: number
  entities: string[]
  evidence: Evidence[]
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
}

export interface FusionStatistics {
  totalEntities: number
  totalRelationships: number
  totalClusters: number
  totalInsights: number
  entityTypes: Record<string, number>
  relationshipTypes: Record<string, number>
  confidenceDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  temporalRange: {
    start: Date
    end: Date
  }
  topSources: Array<{
    sourceId: string
    contribution: number
  }>
}

export class MultiSourceDataFusion {
  private dataSources: Map<string, DataSource> = new Map()
  private entities: Map<string, DataEntity> = new Map()
  private relationships: Map<string, Relationship> = new Map()
  private config: FusionConfig
  private processingStats: any = {}

  constructor(config: FusionConfig) {
    this.config = config
    this.initializeDefaultSources()
  }

  private initializeDefaultSources() {
    // 初始化默认数据源
    const defaultSources: DataSource[] = [
      {
        id: 'virustotal',
        name: 'VirusTotal',
        type: 'osint',
        credibility: 0.95,
        freshness: 0.9,
        coverage: 0.85,
        lastUpdate: new Date(),
        metadata: { rateLimit: 4, premium: true }
      },
      {
        id: 'otx',
        name: 'AlienVault OTX',
        type: 'osint',
        credibility: 0.88,
        freshness: 0.85,
        coverage: 0.8,
        lastUpdate: new Date(),
        metadata: { rateLimit: 10, community: true }
      },
      {
        id: 'shodan',
        name: 'Shodan',
        type: 'osint',
        credibility: 0.92,
        freshness: 0.95,
        coverage: 0.75,
        lastUpdate: new Date(),
        metadata: { rateLimit: 10, iot: true }
      },
      {
        id: 'threatfox',
        name: 'ThreatFox',
        type: 'threat',
        credibility: 0.9,
        freshness: 0.88,
        coverage: 0.82,
        lastUpdate: new Date(),
        metadata: { rateLimit: 5, iocs: true }
      },
      {
        id: 'cybercure',
        name: 'CyberCure',
        type: 'threat',
        credibility: 0.87,
        freshness: 0.83,
        coverage: 0.78,
        lastUpdate: new Date(),
        metadata: { rateLimit: 15, feeds: true }
      }
    ]

    defaultSources.forEach(source => {
      this.dataSources.set(source.id, source)
    })
  }

  async processData(inputData: any[]): Promise<FusionResult> {
    const startTime = Date.now()
    
    try {
      console.log('🔄 开始多源数据融合处理...')
      
      // 1. 数据预处理和实体提取
      const rawEntities = await this.extractEntities(inputData)
      
      // 2. 实体解析和去重
      const resolvedEntities = await this.resolveEntities(rawEntities)
      
      // 3. 关系构建和关联分析
      const relationships = await this.buildRelationships(resolvedEntities)
      
      // 4. 时空分析
      await this.performSpatioTemporalAnalysis(resolvedEntities, relationships)
      
      // 5. 聚类分析
      const clusters = await this.performClustering(resolvedEntities, relationships)
      
      // 6. 置信度评估和质量过滤
      const filteredEntities = await this.filterAndScoreEntities(resolvedEntities)
      const filteredRelationships = await this.filterRelationships(relationships)
      
      // 7. 洞察生成
      const insights = await this.generateInsights(filteredEntities, filteredRelationships, clusters)
      
      // 8. 统计信息
      const statistics = this.generateStatistics(filteredEntities, filteredRelationships, clusters, insights)
      
      const processingTime = Date.now() - startTime
      
      console.log(`✅ 数据融合完成，处理时间: ${processingTime}ms`)
      
      return {
        entities: filteredEntities,
        relationships: filteredRelationships,
        clusters,
        insights,
        statistics,
        processingTime,
        config: this.config
      }
      
    } catch (error) {
      console.error('❌ 数据融合处理失败:', error)
      throw error
    }
  }

  private async extractEntities(inputData: any[]): Promise<Partial<DataEntity>[]> {
    console.log('📊 提取实体...')
    
    const entities: Partial<DataEntity>[] = []
    
    for (const data of inputData) {
      if (data.entities) {
        for (const entity of data.entities) {
          const processedEntity = await this.processEntity(entity, data.source)
          if (processedEntity) {
            entities.push(processedEntity)
          }
        }
      }
      
      // 直接从数据中提取实体
      const directEntities = this.extractEntitiesFromData(data)
      entities.push(...directEntities)
    }
    
    console.log(`📋 提取了 ${entities.length} 个原始实体`)
    return entities
  }

  private async processEntity(rawEntity: any, source: string): Promise<Partial<DataEntity> | null> {
    try {
      const entity: Partial<DataEntity> = {
        id: this.generateEntityId(rawEntity),
        type: rawEntity.type || this.inferEntityType(rawEntity),
        value: rawEntity.value || rawEntity.name || rawEntity.indicator,
        confidence: rawEntity.confidence || 0.5,
        sources: [source],
        attributes: rawEntity.attributes || {},
        temporalData: this.extractTemporalData(rawEntity),
        spatialData: this.extractSpatialData(rawEntity),
        relationships: [],
        tags: rawEntity.tags || [],
        riskLevel: this.assessRiskLevel(rawEntity),
        firstSeen: rawEntity.firstSeen ? new Date(rawEntity.firstSeen) : new Date(),
        lastSeen: rawEntity.lastSeen ? new Date(rawEntity.lastSeen) : new Date()
      }
      
      return entity
    } catch (error) {
      console.error('实体处理失败:', error)
      return null
    }
  }

  private extractEntitiesFromData(data: any): Partial<DataEntity>[] {
    const entities: Partial<DataEntity>[] = []
    
    // IP地址
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
    const ips = data.content?.match(ipRegex) || []
    ips.forEach(ip => {
      entities.push({
        id: `ip_${ip}`,
        type: 'ip',
        value: ip,
        confidence: 0.7,
        sources: [data.source],
        attributes: {},
        temporalData: { firstSeen: new Date(), lastSeen: new Date(), frequency: 1, patterns: [], anomalies: [] },
        spatialData: { locations: [], networks: [], infrastructure: [] },
        relationships: [],
        tags: [],
        riskLevel: 'medium',
        firstSeen: new Date(),
        lastSeen: new Date()
      })
    })
    
    // 域名
    const domainRegex = /\b[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}\b/g
    const domains = data.content?.match(domainRegex) || []
    domains.forEach(domain => {
      entities.push({
        id: `domain_${domain}`,
        type: 'domain',
        value: domain,
        confidence: 0.8,
        sources: [data.source],
        attributes: {},
        temporalData: { firstSeen: new Date(), lastSeen: new Date(), frequency: 1, patterns: [], anomalies: [] },
        spatialData: { locations: [], networks: [], infrastructure: [] },
        relationships: [],
        tags: [],
        riskLevel: 'medium',
        firstSeen: new Date(),
        lastSeen: new Date()
      })
    })
    
    return entities
  }

  private inferEntityType(rawEntity: any): DataEntity['type'] {
    const value = rawEntity.value || rawEntity.name || rawEntity.indicator || ''
    
    if (/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/.test(value)) return 'ip'
    if (/\b[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}\b/.test(value)) return 'domain'
    if (value.startsWith('http')) return 'url'
    if (/[a-f0-9]{32,}/.test(value)) return 'hash'
    if (/@/.test(value)) return 'email'
    
    return rawEntity.type || 'unknown'
  }

  private generateEntityId(entity: any): string {
    const type = entity.type || 'unknown'
    const value = entity.value || entity.name || entity.indicator || 'unknown'
    const hash = require('crypto').createHash('md5').update(value).digest('hex').substring(0, 8)
    return `${type}_${hash}`
  }

  private extractTemporalData(rawEntity: any): TemporalData {
    const now = new Date()
    const firstSeen = rawEntity.firstSeen ? new Date(rawEntity.firstSeen) : now
    const lastSeen = rawEntity.lastSeen ? new Date(rawEntity.lastSeen) : now
    
    return {
      firstSeen,
      lastSeen,
      frequency: rawEntity.frequency || 1,
      patterns: [],
      anomalies: []
    }
  }

  private extractSpatialData(rawEntity: any): SpatialData {
    return {
      locations: rawEntity.locations || [],
      networks: rawEntity.networks || [],
      infrastructure: rawEntity.infrastructure || []
    }
  }

  private assessRiskLevel(rawEntity: any): DataEntity['riskLevel'] {
    if (rawEntity.riskLevel) return rawEntity.riskLevel
    
    const confidence = rawEntity.confidence || 0.5
    if (confidence >= 0.8) return 'high'
    if (confidence >= 0.6) return 'medium'
    return 'low'
  }

  private async resolveEntities(rawEntities: Partial<DataEntity>[]): Promise<DataEntity[]> {
    console.log('🔍 实体解析和去重...')
    
    const entityMap = new Map<string, DataEntity>()
    
    for (const rawEntity of rawEntities) {
      const existing = entityMap.get(rawEntity.id!)
      
      if (existing) {
        // 合并实体
        const merged = this.mergeEntities(existing, rawEntity)
        entityMap.set(rawEntity.id!, merged)
      } else {
        // 新实体
        entityMap.set(rawEntity.id!, rawEntity as DataEntity)
      }
    }
    
    // 模糊匹配和关联
    const resolvedEntities = await this.performFuzzyMatching(Array.from(entityMap.values()))
    
    console.log(`🎯 解析后实体数量: ${resolvedEntities.length}`)
    return resolvedEntities
  }

  private mergeEntities(existing: DataEntity, newData: Partial<DataEntity>): DataEntity {
    const merged = { ...existing }
    
    // 合并源
    merged.sources = [...new Set([...existing.sources, ...(newData.sources || [])])]
    
    // 合并属性
    merged.attributes = { ...existing.attributes, ...(newData.attributes || {}) }
    
    // 合并标签
    merged.tags = [...new Set([...existing.tags, ...(newData.tags || [])])]
    
    // 更新时间范围
    if (newData.firstSeen && newData.firstSeen < existing.firstSeen) {
      merged.firstSeen = newData.firstSeen
    }
    if (newData.lastSeen && newData.lastSeen > existing.lastSeen) {
      merged.lastSeen = newData.lastSeen
    }
    
    // 更新置信度（取最高值）
    merged.confidence = Math.max(existing.confidence, newData.confidence || 0)
    
    // 更新风险等级（取最高值）
    const riskLevels = ['low', 'medium', 'high', 'critical']
    const existingRiskIndex = riskLevels.indexOf(existing.riskLevel)
    const newRiskIndex = newData.riskLevel ? riskLevels.indexOf(newData.riskLevel) : -1
    if (newRiskIndex > existingRiskIndex) {
      merged.riskLevel = newData.riskLevel!
    }
    
    return merged
  }

  private async performFuzzyMatching(entities: DataEntity[]): Promise<DataEntity[]> {
    console.log('🔗 执行模糊匹配...')
    
    const matched = new Set<string>()
    const result: DataEntity[] = []
    
    for (let i = 0; i < entities.length; i++) {
      if (matched.has(entities[i].id)) continue
      
      const group = [entities[i]]
      matched.add(entities[i].id)
      
      for (let j = i + 1; j < entities.length; j++) {
        if (matched.has(entities[j].id)) continue
        
        const similarity = this.calculateSimilarity(entities[i], entities[j])
        
        if (similarity >= this.config.entityResolution.similarityThreshold) {
          group.push(entities[j])
          matched.add(entities[j].id)
        }
      }
      
      // 合并匹配的实体
      if (group.length > 1) {
        const merged = this.mergeEntityGroup(group)
        result.push(merged)
      } else {
        result.push(group[0])
      }
    }
    
    console.log(`🔗 模糊匹配后实体数量: ${result.length}`)
    return result
  }

  private calculateSimilarity(entity1: DataEntity, entity2: DataEntity): number {
    if (entity1.type !== entity2.type) return 0
    
    let similarity = 0
    
    // 值相似度
    if (entity1.value === entity2.value) {
      similarity += 0.5
    } else if (this.config.entityResolution.fuzzyMatching) {
      similarity += this.calculateStringSimilarity(entity1.value, entity2.value) * 0.3
    }
    
    // 时间重叠
    const timeOverlap = this.calculateTimeOverlap(entity1.temporalData, entity2.temporalData)
    similarity += timeOverlap * this.config.entityResolution.temporalWeight
    
    // 空间相似度
    const spatialSimilarity = this.calculateSpatialSimilarity(entity1.spatialData, entity2.spatialData)
    similarity += spatialSimilarity * this.config.entityResolution.spatialWeight
    
    return Math.min(similarity, 1)
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // 简单的字符串相似度计算（可以替换为更复杂的算法）
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1
    
    const editDistance = this.calculateEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private calculateTimeOverlap(temporal1: TemporalData, temporal2: TemporalData): number {
    const start = Math.max(temporal1.firstSeen.getTime(), temporal2.firstSeen.getTime())
    const end = Math.min(temporal1.lastSeen.getTime(), temporal2.lastSeen.getTime())
    
    if (start > end) return 0
    
    const overlap = end - start
    const total = Math.max(
      temporal1.lastSeen.getTime() - temporal1.firstSeen.getTime(),
      temporal2.lastSeen.getTime() - temporal2.firstSeen.getTime()
    )
    
    return total > 0 ? overlap / total : 0
  }

  private calculateSpatialSimilarity(spatial1: SpatialData, spatial2: SpatialData): number {
    let similarity = 0
    
    // 网络相似度
    const networks1 = spatial1.networks.map(n => n.asn)
    const networks2 = spatial2.networks.map(n => n.asn)
    const networkIntersection = networks1.filter(n => networks2.includes(n))
    similarity += networkIntersection.length / Math.max(networks1.length, networks2.length, 1) * 0.5
    
    // 位置相似度
    const locations1 = spatial1.locations.map(l => l.value)
    const locations2 = spatial2.locations.map(l => l.value)
    const locationIntersection = locations1.filter(l => locations2.includes(l))
    similarity += locationIntersection.length / Math.max(locations1.length, locations2.length, 1) * 0.5
    
    return similarity
  }

  private mergeEntityGroup(group: DataEntity[]): DataEntity {
    const base = group[0]
    
    // 合并所有实体的属性
    const merged = { ...base }
    
    // 合并源
    merged.sources = [...new Set(group.flatMap(e => e.sources))]
    
    // 合并属性
    merged.attributes = group.reduce((acc, e) => ({ ...acc, ...e.attributes }), {})
    
    // 合并标签
    merged.tags = [...new Set(group.flatMap(e => e.tags))]
    
    // 更新时间范围
    merged.firstSeen = new Date(Math.min(...group.map(e => e.firstSeen.getTime())))
    merged.lastSeen = new Date(Math.max(...group.map(e => e.lastSeen.getTime())))
    
    // 更新置信度（取平均值）
    merged.confidence = group.reduce((sum, e) => sum + e.confidence, 0) / group.length
    
    // 更新风险等级（取最高值）
    const riskLevels = ['low', 'medium', 'high', 'critical']
    const maxRiskLevel = group.reduce((max, e) => {
      const currentIndex = riskLevels.indexOf(e.riskLevel)
      const maxIndex = riskLevels.indexOf(max)
      return currentIndex > maxIndex ? e.riskLevel : max
    }, 'low')
    merged.riskLevel = maxRiskLevel
    
    return merged
  }

  private async buildRelationships(entities: DataEntity[]): Promise<Relationship[]> {
    console.log('🔗 构建关系网络...')
    
    const relationships: Relationship[] = []
    
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i]
        const entity2 = entities[j]
        
        const relationship = await this.discoverRelationship(entity1, entity2)
        
        if (relationship && relationship.confidence >= this.config.correlation.minConfidence) {
          relationships.push(relationship)
        }
      }
    }
    
    console.log(`🔗 构建了 ${relationships.length} 个关系`)
    return relationships
  }

  private async discoverRelationship(entity1: DataEntity, entity2: DataEntity): Promise<Relationship | null> {
    const relationshipTypes = this.inferRelationshipTypes(entity1, entity2)
    
    if (relationshipTypes.length === 0) return null
    
    // 计算关系强度
    const strength = this.calculateRelationshipStrength(entity1, entity2)
    
    if (strength < 0.3) return null
    
    // 生成证据
    const evidence = this.generateRelationshipEvidence(entity1, entity2)
    
    // 计算置信度
    const confidence = this.calculateRelationshipConfidence(strength, evidence)
    
    return {
      id: `rel_${entity1.id}_${entity2.id}`,
      sourceEntity: entity1.id,
      targetEntity: entity2.id,
      type: relationshipTypes[0], // 取第一个关系类型
      strength,
      confidence,
      evidence,
      temporal: {
        firstSeen: new Date(Math.min(entity1.firstSeen.getTime(), entity2.firstSeen.getTime())),
        lastSeen: new Date(Math.max(entity1.lastSeen.getTime(), entity2.lastSeen.getTime())),
        frequency: Math.min(entity1.temporalData.frequency, entity2.temporalData.frequency),
        patterns: [],
        anomalies: []
      },
      direction: 'bidirectional'
    }
  }

  private inferRelationshipTypes(entity1: DataEntity, entity2: DataEntity): Relationship['type'][] {
    const types: Relationship['type'][] = []
    
    // IP -> Domain
    if (entity1.type === 'ip' && entity2.type === 'domain') {
      types.push('hosts')
    }
    
    // Domain -> IP
    if (entity1.type === 'domain' && entity2.type === 'ip') {
      types.push('resolves_to')
    }
    
    // 相同类型的关联
    if (entity1.type === entity2.type) {
      types.push('associated_with')
    }
    
    // 时间关联
    const timeOverlap = this.calculateTimeOverlap(entity1.temporalData, entity2.temporalData)
    if (timeOverlap > 0.5) {
      types.push('associated_with')
    }
    
    // 空间关联
    const spatialSimilarity = this.calculateSpatialSimilarity(entity1.spatialData, entity2.spatialData)
    if (spatialSimilarity > 0.5) {
      types.push('associated_with')
    }
    
    return types
  }

  private calculateRelationshipStrength(entity1: DataEntity, entity2: DataEntity): number {
    let strength = 0
    
    // 时间重叠
    const timeOverlap = this.calculateTimeOverlap(entity1.temporalData, entity2.temporalData)
    strength += timeOverlap * 0.4
    
    // 空间相似度
    const spatialSimilarity = this.calculateSpatialSimilarity(entity1.spatialData, entity2.spatialData)
    strength += spatialSimilarity * 0.3
    
    // 置信度
    const confidence = (entity1.confidence + entity2.confidence) / 2
    strength += confidence * 0.3
    
    return Math.min(strength, 1)
  }

  private generateRelationshipEvidence(entity1: DataEntity, entity2: DataEntity): Evidence[] {
    const evidence: Evidence[] = []
    
    // 共享源作为证据
    const sharedSources = entity1.sources.filter(s => entity2.sources.includes(s))
    sharedSources.forEach(source => {
      evidence.push({
        sourceId: source,
        sourceType: 'shared_source',
        timestamp: new Date(),
        description: `实体在源 ${source} 中共同出现`,
        confidence: 0.7,
        relevance: 0.8
      })
    })
    
    // 时间重叠作为证据
    const timeOverlap = this.calculateTimeOverlap(entity1.temporalData, entity2.temporalData)
    if (timeOverlap > 0.3) {
      evidence.push({
        sourceId: 'temporal_analysis',
        sourceType: 'temporal',
        timestamp: new Date(),
        description: `实体在时间上有重叠 (${(timeOverlap * 100).toFixed(1)}%)`,
        confidence: timeOverlap,
        relevance: 0.6
      })
    }
    
    return evidence
  }

  private calculateRelationshipConfidence(strength: number, evidence: Evidence[]): number {
    let confidence = strength
    
    // 基于证据调整置信度
    if (evidence.length > 0) {
      const avgEvidenceConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
      confidence = (confidence + avgEvidenceConfidence) / 2
    }
    
    return Math.min(confidence, 1)
  }

  private async performSpatioTemporalAnalysis(entities: DataEntity[], relationships: Relationship[]): Promise<void> {
    console.log('🕐 执行时空分析...')
    
    for (const entity of entities) {
      // 时间模式分析
      entity.temporalData.patterns = this.analyzeTemporalPatterns(entity.temporalData)
      
      // 时间异常检测
      entity.temporalData.anomalies = this.detectTemporalAnomalies(entity.temporalData)
    }
    
    // 关系时间分析
    for (const relationship of relationships) {
      relationship.temporal.patterns = this.analyzeTemporalPatterns(relationship.temporal)
      relationship.temporal.anomalies = this.detectTemporalAnomalies(relationship.temporal)
    }
    
    console.log('🕐 时空分析完成')
  }

  private analyzeTemporalPatterns(temporal: TemporalData): TemporalPattern[] {
    const patterns: TemporalPattern[] = []
    
    // 简单的模式检测（实际应用中可以使用更复杂的算法）
    const duration = temporal.lastSeen.getTime() - temporal.firstSeen.getTime()
    const days = duration / (1000 * 60 * 60 * 24)
    
    if (days > 30) {
      patterns.push({
        type: 'monthly',
        confidence: 0.6,
        description: '长期活动模式',
        timeWindows: [{
          start: temporal.firstSeen,
          end: temporal.lastSeen
        }]
      })
    }
    
    if (temporal.frequency > 10) {
      patterns.push({
        type: 'event_driven',
        confidence: 0.7,
        description: '高频活动模式',
        timeWindows: [{
          start: temporal.firstSeen,
          end: temporal.lastSeen
        }]
      })
    }
    
    return patterns
  }

  private detectTemporalAnomalies(temporal: TemporalData): TemporalAnomaly[] {
    const anomalies: TemporalAnomaly[] = []
    
    // 简单的异常检测
    const duration = temporal.lastSeen.getTime() - temporal.firstSeen.getTime()
    const days = duration / (1000 * 60 * 60 * 24)
    
    if (days > 365 && temporal.frequency < 5) {
      anomalies.push({
        timestamp: temporal.lastSeen,
        type: 'gap',
        severity: 'medium',
        description: '长期低频活动，可能存在监控盲区'
      })
    }
    
    if (temporal.frequency > 100) {
      anomalies.push({
        timestamp: temporal.lastSeen,
        type: 'spike',
        severity: 'high',
        description: '异常高频活动'
      })
    }
    
    return anomalies
  }

  private async performClustering(entities: DataEntity[], relationships: Relationship[]): Promise<EntityCluster[]> {
    console.log('🔗 执行聚类分析...')
    
    const clusters: EntityCluster[] = []
    const visited = new Set<string>()
    
    for (const entity of entities) {
      if (visited.has(entity.id)) continue
      
      const cluster = await this.buildCluster(entity, entities, relationships, visited)
      
      if (cluster.entities.length > 1) {
        clusters.push(cluster)
      }
    }
    
    console.log(`🔗 发现 ${clusters.length} 个实体集群`)
    return clusters
  }

  private async buildCluster(
    seedEntity: DataEntity,
    entities: DataEntity[],
    relationships: Relationship[],
    visited: Set<string>
  ): Promise<EntityCluster> {
    const clusterEntities = new Set<string>([seedEntity.id])
    const queue = [seedEntity.id]
    visited.add(seedEntity.id)
    
    while (queue.length > 0) {
      const currentId = queue.shift()!
      
      // 找到与当前实体相关的所有关系
      const relatedRelationships = relationships.filter(r => 
        r.sourceEntity === currentId || r.targetEntity === currentId
      )
      
      for (const relationship of relatedRelationships) {
        const relatedId = relationship.sourceEntity === currentId ? 
          relationship.targetEntity : relationship.sourceEntity
        
        if (!visited.has(relatedId) && relationship.confidence >= 0.5) {
          clusterEntities.add(relatedId)
          queue.push(relatedId)
          visited.add(relatedId)
        }
      }
    }
    
    const cluster: EntityCluster = {
      id: `cluster_${seedEntity.id}`,
      type: this.inferClusterType(Array.from(clusterEntities), entities),
      entities: Array.from(clusterEntities),
      confidence: this.calculateClusterConfidence(Array.from(clusterEntities), entities, relationships),
      attributes: {},
      timeline: this.generateClusterTimeline(Array.from(clusterEntities), entities),
      riskLevel: this.assessClusterRisk(Array.from(clusterEntities), entities)
    }
    
    return cluster
  }

  private inferClusterTypes(entityIds: string[], entities: DataEntity[]): EntityCluster['type'] {
    const clusterEntities = entities.filter(e => entityIds.includes(e.id))
    const types = clusterEntities.map(e => e.type)
    
    // 根据实体类型推断集群类型
    if (types.includes('threat_actor') || types.includes('malware')) {
      return 'threat_actor'
    }
    
    if (types.includes('ip') && types.includes('domain')) {
      return 'infrastructure'
    }
    
    if (types.includes('hash') && types.length > 1) {
      return 'malware_family'
    }
    
    return 'campaign_cluster'
  }

  private calculateClusterConfidence(
    entityIds: string[],
    entities: DataEntity[],
    relationships: Relationship[]
  ): number {
    const clusterEntities = entities.filter(e => entityIds.includes(e.id))
    const internalRelationships = relationships.filter(r =>
      entityIds.includes(r.sourceEntity) && entityIds.includes(r.targetEntity)
    )
    
    if (clusterEntities.length === 0) return 0
    
    // 基于内部关系密度计算置信度
    const maxPossibleRelationships = (clusterEntities.length * (clusterEntities.length - 1)) / 2
    const relationshipDensity = internalRelationships.length / maxPossibleRelationships
    
    // 基于实体平均置信度
    const avgEntityConfidence = clusterEntities.reduce((sum, e) => sum + e.confidence, 0) / clusterEntities.length
    
    // 基于关系平均置信度
    const avgRelationshipConfidence = internalRelationships.length > 0 ?
      internalRelationships.reduce((sum, r) => sum + r.confidence, 0) / internalRelationships.length : 0
    
    return (relationshipDensity * 0.4 + avgEntityConfidence * 0.4 + avgRelationshipConfidence * 0.2)
  }

  private generateClusterTimeline(entityIds: string[], entities: DataEntity[]): TimelineEvent[] {
    const clusterEntities = entities.filter(e => entityIds.includes(e.id))
    const timeline: TimelineEvent[] = []
    
    // 实体首次出现事件
    const firstEntity = clusterEntities.reduce((earliest, e) => 
      e.firstSeen < earliest.firstSeen ? e : earliest
    )
    
    timeline.push({
      timestamp: firstEntity.firstSeen,
      type: 'entity_created',
      description: `集群中第一个实体 ${firstEntity.value} 出现`,
      entities: [firstEntity.id],
      significance: 'medium'
    })
    
    // 集群形成事件
    const lastEntity = clusterEntities.reduce((latest, e) => 
      e.lastSeen > latest.lastSeen ? e : latest
    )
    
    timeline.push({
      timestamp: lastEntity.lastSeen,
      type: 'cluster_formed',
      description: `集群形成，包含 ${clusterEntities.length} 个实体`,
      entities: entityIds,
      significance: 'high'
    })
    
    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private assessClusterRisk(entityIds: string[], entities: DataEntity[]): EntityCluster['riskLevel'] {
    const clusterEntities = entities.filter(e => entityIds.includes(e.id))
    
    // 计算高风险实体比例
    const highRiskEntities = clusterEntities.filter(e => 
      e.riskLevel === 'high' || e.riskLevel === 'critical'
    ).length
    
    const riskRatio = highRiskEntities / clusterEntities.length
    
    if (riskRatio >= 0.5) return 'critical'
    if (riskRatio >= 0.3) return 'high'
    if (riskRatio >= 0.1) return 'medium'
    return 'low'
  }

  private async filterAndScoreEntities(entities: DataEntity[]): Promise<DataEntity[]> {
    console.log('🔍 过滤和评分实体...')
    
    const filtered = entities.filter(entity => {
      // 置信度过滤
      if (entity.confidence < this.config.filtering.minConfidence) {
        return false
      }
      
      // 年龄过滤
      const age = Date.now() - entity.lastSeen.getTime()
      const maxAge = this.config.filtering.maxAge * 60 * 60 * 1000
      if (age > maxAge) {
        return false
      }
      
      // 类型过滤
      if (this.config.filtering.excludeTypes.includes(entity.type)) {
        return false
      }
      
      // 多源要求
      if (this.config.filtering.requireMultipleSources && entity.sources.length < 2) {
        return false
      }
      
      return true
    })
    
    // 重新计算置信度分数
    const scored = filtered.map(entity => ({
      ...entity,
      confidence: this.calculateEntityConfidenceScore(entity)
    }))
    
    console.log(`🔍 过滤后实体数量: ${scored.length}`)
    return scored
  }

  private calculateEntityConfidenceScore(entity: DataEntity): number {
    const sourceCredibility = this.calculateSourceCredibility(entity.sources)
    const recency = this.calculateRecencyScore(entity.lastSeen)
    const sourceCount = Math.min(entity.sources.length / 3, 1) // 最多3个源
    
    const baseScore = entity.confidence
    const finalScore = (
      baseScore * this.config.scoring.credibilityWeight +
      sourceCredibility * this.config.scoring.sourceWeight +
      recency * this.config.scoring.recencyWeight
    )
    
    // 异常奖励
    const anomalyBonus = entity.temporalData.anomalies.length > 0 ? 
      this.config.scoring.anomalyBonus * 0.1 : 0
    
    return Math.min(finalScore + anomalyBonus, 1)
  }

  private calculateSourceCredibility(sources: string[]): number {
    if (sources.length === 0) return 0
    
    const totalCredibility = sources.reduce((sum, sourceId) => {
      const source = this.dataSources.get(sourceId)
      return sum + (source ? source.credibility : 0.5)
    }, 0)
    
    return totalCredibility / sources.length
  }

  private calculateRecencyScore(lastSeen: Date): number {
    const age = Date.now() - lastSeen.getTime()
    const days = age / (1000 * 60 * 60 * 24)
    
    if (days <= 1) return 1
    if (days <= 7) return 0.8
    if (days <= 30) return 0.6
    if (days <= 90) return 0.4
    return 0.2
  }

  private async filterRelationships(relationships: Relationship[]): Promise<Relationship[]> {
    console.log('🔗 过滤关系...')
    
    const filtered = relationships.filter(relationship => {
      // 置信度过滤
      if (relationship.confidence < this.config.correlation.minConfidence) {
        return false
      }
      
      // 强度过滤
      if (relationship.strength < 0.3) {
        return false
      }
      
      return true
    })
    
    console.log(`🔗 过滤后关系数量: ${filtered.length}`)
    return filtered
  }

  private async generateInsights(
    entities: DataEntity[],
    relationships: Relationship[],
    clusters: EntityCluster[]
  ): Promise<FusionInsight[]> {
    console.log('💡 生成洞察...')
    
    const insights: FusionInsight[] = []
    
    // 实体关联洞察
    const highValueEntities = entities.filter(e => e.confidence >= 0.8 && e.riskLevel !== 'low')
    if (highValueEntities.length > 0) {
      insights.push({
        id: `insight_entities_${Date.now()}`,
        type: 'entity_correlation',
        title: '高价值实体发现',
        description: `发现 ${highValueEntities.length} 个高置信度、高风险实体`,
        confidence: 0.85,
        entities: highValueEntities.map(e => e.id),
        evidence: highValueEntities.map(e => ({
          sourceId: e.sources[0],
          sourceType: 'entity_analysis',
          timestamp: new Date(),
          description: `实体 ${e.value} 置信度: ${(e.confidence * 100).toFixed(1)}%`,
          confidence: e.confidence,
          relevance: 0.9
        })),
        impact: 'high',
        recommendations: [
          '建议优先监控这些高价值实体',
          '考虑进行深入的安全分析',
          '建立持续监控机制'
        ]
      })
    }
    
    // 威胁活动洞察
    const highRiskClusters = clusters.filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high')
    if (highRiskClusters.length > 0) {
      insights.push({
        id: `insight_threats_${Date.now()}`,
        type: 'threat_campaign',
        title: '潜在威胁活动检测',
        description: `发现 ${highRiskClusters.length} 个高风险实体集群，可能表示有组织的威胁活动`,
        confidence: 0.9,
        entities: highRiskClusters.flatMap(c => c.entities),
        evidence: highRiskClusters.map(c => ({
          sourceId: 'cluster_analysis',
          sourceType: 'clustering',
          timestamp: new Date(),
          description: `集群 ${c.id} 风险等级: ${c.riskLevel}`,
          confidence: c.confidence,
          relevance: 0.95
        })),
        impact: 'critical',
        recommendations: [
          '立即调查这些高风险集群',
          '加强相关实体的监控',
          '考虑采取防护措施',
          '准备应急响应计划'
        ]
      })
    }
    
    // 时间模式洞察
    const entitiesWithPatterns = entities.filter(e => e.temporalData.patterns.length > 0)
    if (entitiesWithPatterns.length > 0) {
      insights.push({
        id: `insight_temporal_${Date.now()}`,
        type: 'temporal_pattern',
        title: '活动模式识别',
        description: `发现 ${entitiesWithPatterns.length} 个实体表现出规律性活动模式`,
        confidence: 0.75,
        entities: entitiesWithPatterns.map(e => e.id),
        evidence: entitiesWithPatterns.map(e => ({
          sourceId: 'temporal_analysis',
          sourceType: 'pattern_recognition',
          timestamp: new Date(),
          description: `实体 ${e.value} 表现出 ${e.temporalData.patterns[0].type} 模式`,
          confidence: e.temporalData.patterns[0].confidence,
          relevance: 0.7
        })),
        impact: 'medium',
        recommendations: [
          '利用模式特征优化监控策略',
          '在模式高发时段加强监控',
          '建立模式基线用于异常检测'
        ]
      })
    }
    
    console.log(`💡 生成了 ${insights.length} 个洞察`)
    return insights
  }

  private generateStatistics(
    entities: DataEntity[],
    relationships: Relationship[],
    clusters: EntityCluster[],
    insights: FusionInsight[]
  ): FusionStatistics {
    // 实体类型统计
    const entityTypes: Record<string, number> = {}
    entities.forEach(entity => {
      entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1
    })
    
    // 关系类型统计
    const relationshipTypes: Record<string, number> = {}
    relationships.forEach(relationship => {
      relationshipTypes[relationship.type] = (relationshipTypes[relationship.type] || 0) + 1
    })
    
    // 置信度分布
    const confidenceDistribution = {
      low: entities.filter(e => e.confidence < 0.5).length,
      medium: entities.filter(e => e.confidence >= 0.5 && e.confidence < 0.8).length,
      high: entities.filter(e => e.confidence >= 0.8 && e.confidence < 0.95).length,
      critical: entities.filter(e => e.confidence >= 0.95).length
    }
    
    // 时间范围
    const allTimestamps = [
      ...entities.map(e => e.firstSeen.getTime()),
      ...entities.map(e => e.lastSeen.getTime())
    ]
    const temporalRange = {
      start: new Date(Math.min(...allTimestamps)),
      end: new Date(Math.max(...allTimestamps))
    }
    
    // 顶级源贡献
    const sourceContributions: Record<string, number> = {}
    entities.forEach(entity => {
      entity.sources.forEach(source => {
        sourceContributions[source] = (sourceContributions[source] || 0) + 1
      })
    })
    
    const topSources = Object.entries(sourceContributions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([sourceId, contribution]) => ({
        sourceId,
        contribution
      }))
    
    return {
      totalEntities: entities.length,
      totalRelationships: relationships.length,
      totalClusters: clusters.length,
      totalInsights: insights.length,
      entityTypes,
      relationshipTypes,
      confidenceDistribution,
      temporalRange,
      topSources
    }
  }

  // 公共方法
  addDataSource(source: DataSource): void {
    this.dataSources.set(source.id, source)
    console.log(`📡 添加数据源: ${source.name}`)
  }

  removeDataSource(sourceId: string): boolean {
    const deleted = this.dataSources.delete(sourceId)
    if (deleted) {
      console.log(`🗑️ 删除数据源: ${sourceId}`)
    }
    return deleted
  }

  getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values())
  }

  getEntities(): DataEntity[] {
    return Array.from(this.entities.values())
  }

  getRelationships(): Relationship[] {
    return Array.from(this.relationships.values())
  }

  getConfig(): FusionConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<FusionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ 更新融合配置')
  }

  clear(): void {
    this.entities.clear()
    this.relationships.clear()
    console.log('🧹 清空融合数据')
  }
}

// 导出单例实例
export const multiSourceDataFusion = new MultiSourceDataFusion({
  entityResolution: {
    similarityThreshold: 0.7,
    fuzzyMatching: true,
    temporalWindow: 24,
    spatialWeight: 0.3
  },
  correlation: {
    maxDepth: 3,
    minConfidence: 0.5,
    timeWindow: 72,
    includeIndirect: true
  },
  scoring: {
    credibilityWeight: 0.4,
    recencyWeight: 0.3,
    sourceWeight: 0.2,
    anomalyBonus: 0.1
  },
  filtering: {
    minConfidence: 0.5,
    maxAge: 720, // 30天
    excludeTypes: ['unknown'],
    requireMultipleSources: false
  }
})