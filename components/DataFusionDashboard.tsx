'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Network, 
  GitBranch, 
  Users, 
  Clock, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Play,
  Settings,
  BarChart3,
  Target,
  Activity,
  Zap,
  Eye,
  Share2
} from 'lucide-react'

interface FusionResult {
  entities: DataEntity[]
  relationships: Relationship[]
  clusters: EntityCluster[]
  insights: FusionInsight[]
  statistics: FusionStatistics
  processingTime: number
  config: FusionConfig
}

interface DataEntity {
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

interface Relationship {
  id: string
  sourceEntity: string
  targetEntity: string
  type: 'connects_to' | 'communicates_with' | 'hosts' | 'resolves_to' | 'owned_by' | 'associated_with' | 'variant_of' | 'targets'
  strength: number
  confidence: number
  evidence: Evidence[]
  temporal: TemporalData
  direction: 'bidirectional' | 'unidirectional'
}

interface Evidence {
  sourceId: string
  sourceType: string
  timestamp: Date
  description: string
  confidence: number
  relevance: number
}

interface TemporalData {
  firstSeen: Date
  lastSeen: Date
  frequency: number
  patterns: TemporalPattern[]
  anomalies: TemporalAnomaly[]
}

interface TemporalPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'event_driven'
  confidence: number
  description: string
  timeWindows: DateRange[]
}

interface DateRange {
  start: Date
  end: Date
}

interface TemporalAnomaly {
  timestamp: Date
  type: 'spike' | 'drop' | 'gap' | 'irregular'
  severity: 'low' | 'medium' | 'high'
  description: string
}

interface SpatialData {
  locations: Location[]
  networks: Network[]
  infrastructure: Infrastructure[]
}

interface Location {
  type: 'country' | 'region' | 'city' | 'coordinates' | 'network'
  value: string
  confidence: number
  source: string
}

interface Network {
  asn: number
  isp: string
  organization: string
  country: string
  region: string
  latitude?: number
  longitude?: number
  confidence: number
}

interface Infrastructure {
  type: 'hosting' | 'cloud' | 'cdn' | 'vpn' | 'proxy' | 'tor'
  provider: string
  description: string
  confidence: number
}

interface EntityCluster {
  id: string
  type: 'campaign' | 'threat_actor' | 'infrastructure' | 'malware_family' | 'campaign_cluster'
  entities: string[]
  confidence: number
  attributes: Record<string, any>
  timeline: TimelineEvent[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface TimelineEvent {
  timestamp: Date
  type: 'entity_created' | 'relationship_established' | 'cluster_formed' | 'anomaly_detected'
  description: string
  entities: string[]
  significance: 'low' | 'medium' | 'high'
}

interface FusionInsight {
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

interface FusionStatistics {
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

interface FusionConfig {
  entityResolution: {
    similarityThreshold: number
    fuzzyMatching: boolean
    temporalWindow: number
    spatialWeight: number
  }
  correlation: {
    maxDepth: number
    minConfidence: number
    timeWindow: number
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
    maxAge: number
    excludeTypes: string[]
    requireMultipleSources: boolean
  }
}

export default function DataFusionDashboard() {
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [testData, setTestData] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // 示例测试数据
  const sampleTestData = JSON.stringify([
    {
      source: 'virustotal',
      entities: [
        {
          type: 'ip',
          value: '192.168.1.100',
          confidence: 0.9,
          attributes: { malicious: true, detections: 5 },
          tags: ['malicious', 'c2']
        },
        {
          type: 'domain',
          value: 'example.com',
          confidence: 0.8,
          attributes: { category: 'phishing' },
          tags: ['suspicious']
        }
      ],
      content: '检测到恶意IP 192.168.1.100 和域名 example.com'
    },
    {
      source: 'otx',
      entities: [
        {
          type: 'ip',
          value: '192.168.1.100',
          confidence: 0.85,
          attributes: { threat_type: 'botnet' },
          tags: ['botnet', 'compromised']
        }
      ],
      content: 'OTX报告显示IP 192.168.1.100 涉嫌僵尸网络活动'
    }
  ], null, 2)

  useEffect(() => {
    setTestData(sampleTestData)
  }, [])

  const processData = async () => {
    if (!testData.trim()) return

    setIsProcessing(true)
    try {
      const data = JSON.parse(testData)
      
      const response = await fetch('/api/data-fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      })

      const result = await response.json()
      
      if (result.success) {
        setFusionResult(result.result)
      } else {
        console.error('数据处理失败:', result.error)
      }
    } catch (error) {
      console.error('数据处理失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getEntityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ip: 'bg-blue-100 text-blue-800 border-blue-200',
      domain: 'bg-green-100 text-green-800 border-green-200',
      url: 'bg-purple-100 text-purple-800 border-purple-200',
      hash: 'bg-orange-100 text-orange-800 border-orange-200',
      email: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      user: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      organization: 'bg-pink-100 text-pink-800 border-pink-200',
      threat_actor: 'bg-red-100 text-red-800 border-red-200',
      malware: 'bg-red-100 text-red-800 border-red-200',
      vulnerability: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'entity_correlation': return <Network className="h-5 w-5" />
      case 'temporal_pattern': return <Clock className="h-5 w-5" />
      case 'spatial_cluster': return <MapPin className="h-5 w-5" />
      case 'anomaly_detection': return <AlertTriangle className="h-5 w-5" />
      case 'threat_campaign': return <Target className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">多源数据融合系统</h1>
          <p className="text-gray-600 mt-2">
            实体解析、关系映射、时空分析、智能洞察生成
          </p>
        </div>

        {/* 功能特性 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center space-x-3">
              <Network className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-900">实体解析</h3>
                <p className="text-sm text-gray-600">智能实体识别和去重</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center space-x-3">
              <GitBranch className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-gray-900">关系映射</h3>
                <p className="text-sm text-gray-600">关联分析和网络构建</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold text-gray-900">时空分析</h3>
                <p className="text-sm text-gray-600">时间模式和空间分布</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-900">智能洞察</h3>
                <p className="text-sm text-gray-600">自动化分析和建议</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 数据处理区域 */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">数据融合处理</h2>
            <Button onClick={processData} disabled={isProcessing || !testData.trim()}>
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  开始融合
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="testData">测试数据 (JSON格式)</Label>
              <Textarea
                id="testData"
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder="输入JSON格式的测试数据..."
              />
            </div>
            
            <div>
              <Label>处理结果</Label>
              {fusionResult ? (
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{fusionResult.entities.length}</div>
                      <div className="text-sm text-blue-800">实体数量</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{fusionResult.relationships.length}</div>
                      <div className="text-sm text-green-800">关系数量</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{fusionResult.clusters.length}</div>
                      <div className="text-sm text-purple-800">集群数量</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{fusionResult.insights.length}</div>
                      <div className="text-sm text-orange-800">洞察数量</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">处理时间</div>
                    <div className="text-lg font-semibold text-gray-900">{fusionResult.processingTime}ms</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">等待数据处理...</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 融合结果展示 */}
        {fusionResult && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="entities">实体</TabsTrigger>
              <TabsTrigger value="relationships">关系</TabsTrigger>
              <TabsTrigger value="clusters">集群</TabsTrigger>
              <TabsTrigger value="insights">洞察</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* 统计信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">总实体数</p>
                      <p className="text-2xl font-bold">{fusionResult.statistics.totalEntities}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">总关系数</p>
                      <p className="text-2xl font-bold">{fusionResult.statistics.totalRelationships}</p>
                    </div>
                    <Share2 className="h-8 w-8 text-green-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">集群数</p>
                      <p className="text-2xl font-bold">{fusionResult.statistics.totalClusters}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">洞察数</p>
                      <p className="text-2xl font-bold">{fusionResult.statistics.totalInsights}</p>
                    </div>
                    <Eye className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* 实体类型分布 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">实体类型分布</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(fusionResult.statistics.entityTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Badge className={getEntityTypeColor(type)}>
                        {type}
                      </Badge>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 置信度分布 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">置信度分布</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">低置信度 (0-0.5)</span>
                    <span className="font-medium">{fusionResult.statistics.confidenceDistribution.low}</span>
                  </div>
                  <Progress value={(fusionResult.statistics.confidenceDistribution.low / fusionResult.statistics.totalEntities) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">中等置信度 (0.5-0.8)</span>
                    <span className="font-medium">{fusionResult.statistics.confidenceDistribution.medium}</span>
                  </div>
                  <Progress value={(fusionResult.statistics.confidenceDistribution.medium / fusionResult.statistics.totalEntities) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">高置信度 (0.8-0.95)</span>
                    <span className="font-medium">{fusionResult.statistics.confidenceDistribution.high}</span>
                  </div>
                  <Progress value={(fusionResult.statistics.confidenceDistribution.high / fusionResult.statistics.totalEntities) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">关键置信度 (0.95+)</span>
                    <span className="font-medium">{fusionResult.statistics.confidenceDistribution.critical}</span>
                  </div>
                  <Progress value={(fusionResult.statistics.confidenceDistribution.critical / fusionResult.statistics.totalEntities) * 100} className="h-2" />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="entities" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">实体列表 ({fusionResult.entities.length})</h3>
                <div className="space-y-4">
                  {fusionResult.entities.map((entity) => (
                    <div key={entity.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getEntityTypeColor(entity.type)}>
                            {entity.type}
                          </Badge>
                          <Badge className={getRiskLevelColor(entity.riskLevel)}>
                            {entity.riskLevel}
                          </Badge>
                          <span className="font-medium">{entity.value}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          置信度: {(entity.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">数据源:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entity.sources.map((source) => (
                              <Badge key={source} variant="outline" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">标签:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entity.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        首次出现: {entity.firstSeen.toLocaleString()} | 
                        最后出现: {entity.lastSeen.toLocaleString()} | 
                        频率: {entity.temporalData.frequency}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="relationships" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">关系网络 ({fusionResult.relationships.length})</h3>
                <div className="space-y-4">
                  {fusionResult.relationships.map((relationship) => (
                    <div key={relationship.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{relationship.sourceEntity}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium">{relationship.targetEntity}</span>
                          <Badge variant="outline">{relationship.type}</Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          强度: {(relationship.strength * 100).toFixed(1)}% | 
                          置信度: {(relationship.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        证据数量: {relationship.evidence.length}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="clusters" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">实体集群 ({fusionResult.clusters.length})</h3>
                <div className="space-y-4">
                  {fusionResult.clusters.map((cluster) => (
                    <div key={cluster.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{cluster.type}</Badge>
                          <Badge className={getRiskLevelColor(cluster.riskLevel)}>
                            {cluster.riskLevel}
                          </Badge>
                          <span className="font-medium">{cluster.entities.length} 个实体</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          置信度: {(cluster.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        实体列表: {cluster.entities.slice(0, 5).join(', ')}
                        {cluster.entities.length > 5 && `... 等 ${cluster.entities.length} 个实体`}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        时间线事件: {cluster.timeline.length}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">智能洞察 ({fusionResult.insights.length})</h3>
                <div className="space-y-4">
                  {fusionResult.insights.map((insight) => (
                    <div key={insight.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getInsightIcon(insight.type)}
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge className={getRiskLevelColor(insight.impact)}>
                            {insight.impact}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          置信度: {(insight.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>建议:</strong>
                      </div>
                      <ul className="text-sm text-gray-600 list-disc list-inside mb-2">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                      
                      <div className="text-xs text-gray-500">
                        影响实体: {insight.entities.length} 个 | 
                        证据数量: {insight.evidence.length}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}