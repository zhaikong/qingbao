/**
 * 实时监控和预警系统
 * 支持多源数据监控、威胁检测、实时预警
 */

export interface MonitoringTarget {
  id: string
  name: string
  type: 'keyword' | 'domain' | 'ip' | 'url' | 'social' | 'threat'
  keywords: string[]
  sources: string[]
  filters: MonitoringFilter[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  createdAt: Date
  lastTriggered?: Date
}

export interface MonitoringFilter {
  field: string
  operator: 'contains' | 'equals' | 'regex' | 'gt' | 'lt' | 'in'
  value: string | number | string[]
  caseSensitive?: boolean
}

export interface MonitoringEvent {
  id: string
  targetId: string
  type: 'match' | 'threat' | 'anomaly' | 'trend'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  source: string
  data: any
  timestamp: Date
  confidence: number
  isRead: boolean
  tags: string[]
}

export interface AlertRule {
  id: string
  name: string
  condition: AlertCondition
  actions: AlertAction[]
  isActive: boolean
  cooldown: number // 冷却时间（秒）
  lastTriggered?: Date
}

export interface AlertCondition {
  field: string
  operator: 'equals' | 'gt' | 'lt' | 'contains' | 'regex' | 'trend'
  value: any
  timeWindow?: number // 时间窗口（秒）
  threshold?: number
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'notification' | 'log'
  config: any
}

export interface MonitoringConfig {
  checkInterval: number // 检查间隔（秒）
  retentionDays: number // 数据保留天数
  maxEventsPerTarget: number
  enableRealTime: boolean
  sources: MonitoringSource[]
}

export interface MonitoringSource {
  id: string
  name: string
  type: 'api' | 'rss' | 'web' | 'social' | 'threat'
  endpoint: string
  auth?: any
  rateLimit: number
  isActive: boolean
}

export interface MonitoringDashboard {
  activeTargets: number
  totalEvents: number
  criticalAlerts: number
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  recentEvents: MonitoringEvent[]
  trendData: TrendData[]
  sourceStats: SourceStats[]
}

export interface TrendData {
  timestamp: Date
  events: number
  threats: number
  criticals: number
}

export interface SourceStats {
  sourceId: string
  name: string
  events: number
  lastEvent?: Date
  health: 'healthy' | 'warning' | 'error'
}

export class RealTimeMonitoringEngine {
  private targets: Map<string, MonitoringTarget> = new Map()
  private events: MonitoringEvent[] = []
  private rules: Map<string, AlertRule> = new Map()
  private sources: Map<string, MonitoringSource> = new Map()
  private config: MonitoringConfig
  private isRunning: boolean = false
  private intervalId?: NodeJS.Timeout

  constructor(config: MonitoringConfig) {
    this.config = config
    this.initializeSources()
  }

  private initializeSources() {
    // 初始化默认监控源
    const defaultSources: MonitoringSource[] = [
      {
        id: 'virustotal',
        name: 'VirusTotal',
        type: 'api',
        endpoint: 'https://www.virustotal.com/vtapi/v2/',
        rateLimit: 4,
        isActive: true
      },
      {
        id: 'otx',
        name: 'AlienVault OTX',
        type: 'api',
        endpoint: 'https://otx.alienvault.com/api/v1/',
        rateLimit: 10,
        isActive: true
      },
      {
        id: 'shodan',
        name: 'Shodan',
        type: 'api',
        endpoint: 'https://api.shodan.io/shodan/',
        rateLimit: 10,
        isActive: true
      },
      {
        id: 'threatfox',
        name: 'ThreatFox',
        type: 'api',
        endpoint: 'https://threatfox-api.abuse.ch/api/v1/',
        rateLimit: 5,
        isActive: true
      },
      {
        id: 'cybercure',
        name: 'CyberCure',
        type: 'api',
        endpoint: 'https://api.cybercure.ai/feed/',
        rateLimit: 15,
        isActive: true
      }
    ]

    defaultSources.forEach(source => {
      this.sources.set(source.id, source)
    })
  }

  async start() {
    if (this.isRunning) return

    this.isRunning = true
    console.log('🚀 启动实时监控引擎...')

    // 启动定时检查
    this.intervalId = setInterval(async () => {
      await this.checkAllTargets()
    }, this.config.checkInterval * 1000)

    // 启动事件处理
    this.startEventProcessing()
  }

  async stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    console.log('🛑 停止实时监控引擎')
  }

  addTarget(target: MonitoringTarget): string {
    const id = `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    target.id = id
    target.createdAt = new Date()
    
    this.targets.set(id, target)
    console.log(`📡 添加监控目标: ${target.name}`)
    
    return id
  }

  removeTarget(targetId: string): boolean {
    const deleted = this.targets.delete(targetId)
    if (deleted) {
      console.log(`🗑️ 删除监控目标: ${targetId}`)
    }
    return deleted
  }

  updateTarget(targetId: string, updates: Partial<MonitoringTarget>): boolean {
    const target = this.targets.get(targetId)
    if (!target) return false

    Object.assign(target, updates)
    console.log(`📝 更新监控目标: ${target.name}`)
    return true
  }

  addRule(rule: AlertRule): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    rule.id = id
    
    this.rules.set(id, rule)
    console.log(`📋 添加预警规则: ${rule.name}`)
    
    return id
  }

  removeRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId)
    if (deleted) {
      console.log(`🗑️ 删除预警规则: ${ruleId}`)
    }
    return deleted
  }

  private async checkAllTargets() {
    console.log(`🔍 检查 ${this.targets.size} 个监控目标...`)

    const promises = Array.from(this.targets.values())
      .filter(target => target.isActive)
      .map(target => this.checkTarget(target))

    await Promise.allSettled(promises)
  }

  private async checkTarget(target: MonitoringTarget) {
    try {
      // 检查每个源
      for (const sourceId of target.sources) {
        const source = this.sources.get(sourceId)
        if (!source || !source.isActive) continue

        const events = await this.checkSource(source, target)
        
        // 处理事件
        for (const event of events) {
          await this.processEvent(event)
        }
      }
    } catch (error) {
      console.error(`❌ 检查目标失败 ${target.name}:`, error)
    }
  }

  private async checkSource(source: MonitoringSource, target: MonitoringTarget): Promise<MonitoringEvent[]> {
    const events: MonitoringEvent[] = []

    try {
      switch (source.type) {
        case 'api':
          events.push(...await this.checkAPISource(source, target))
          break
        case 'rss':
          events.push(...await this.checkRSSSource(source, target))
          break
        case 'web':
          events.push(...await this.checkWebSource(source, target))
          break
        case 'threat':
          events.push(...await this.checkThreatSource(source, target))
          break
      }
    } catch (error) {
      console.error(`❌ 检查源失败 ${source.name}:`, error)
    }

    return events
  }

  private async checkAPISource(source: MonitoringSource, target: MonitoringTarget): Promise<MonitoringEvent[]> {
    const events: MonitoringEvent[] = []

    try {
      // 模拟API调用
      for (const keyword of target.keywords) {
        // 这里应该是真实的API调用
        const mockData = await this.mockAPICall(source, keyword)
        
        if (mockData.matches.length > 0) {
          const event: MonitoringEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            targetId: target.id,
            type: 'match',
            severity: target.severity,
            title: `${source.name} 发现匹配`,
            description: `在 ${source.name} 中发现关键词 "${keyword}" 的匹配`,
            source: source.id,
            data: mockData,
            timestamp: new Date(),
            confidence: mockData.confidence,
            isRead: false,
            tags: [source.type, keyword]
          }
          events.push(event)
        }
      }
    } catch (error) {
      console.error(`API源检查失败 ${source.name}:`, error)
    }

    return events
  }

  private async checkRSSSource(source: MonitoringSource, target: MonitoringTarget): Promise<MonitoringEvent[]> {
    // RSS源检查实现
    return []
  }

  private async checkWebSource(source: MonitoringSource, target: MonitoringTarget): Promise<MonitoringEvent[]> {
    // Web源检查实现
    return []
  }

  private async checkThreatSource(source: MonitoringSource, target: MonitoringTarget): Promise<MonitoringEvent[]> {
    const events: MonitoringEvent[] = []

    try {
      // 模拟威胁情报源
      for (const keyword of target.keywords) {
        const threatData = await this.mockThreatCall(source, keyword)
        
        if (threatData.isThreat) {
          const event: MonitoringEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            targetId: target.id,
            type: 'threat',
            severity: threatData.severity,
            title: `🚨 ${source.name} 威胁检测`,
            description: `检测到关键词 "${keyword}" 的威胁活动`,
            source: source.id,
            data: threatData,
            timestamp: new Date(),
            confidence: threatData.confidence,
            isRead: false,
            tags: ['threat', source.type, keyword]
          }
          events.push(event)
        }
      }
    } catch (error) {
      console.error(`威胁源检查失败 ${source.name}:`, error)
    }

    return events
  }

  private async mockAPICall(source: MonitoringSource, keyword: string): Promise<any> {
    // 模拟API响应
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    const isMatch = Math.random() > 0.7 // 30% 概率匹配
    
    return {
      keyword,
      matches: isMatch ? [`${keyword}_match_${Date.now()}`] : [],
      confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
      timestamp: new Date().toISOString()
    }
  }

  private async mockThreatCall(source: MonitoringSource, keyword: string): Promise<any> {
    // 模拟威胁情报响应
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
    
    const isThreat = Math.random() > 0.8 // 20% 概率威胁
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical']
    
    return {
      keyword,
      isThreat,
      severity: severities[Math.floor(Math.random() * severities.length)],
      confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
      threatTypes: isThreat ? ['malware', 'phishing', 'c2'] : [],
      indicators: isThreat ? [`ind_${Date.now()}`] : [],
      timestamp: new Date().toISOString()
    }
  }

  private async processEvent(event: MonitoringEvent) {
    // 检查是否已存在类似事件（去重）
    const isDuplicate = this.events.some(existing => 
      existing.targetId === event.targetId &&
      existing.source === event.source &&
      Math.abs(existing.timestamp.getTime() - event.timestamp.getTime()) < 5000 // 5秒内重复
    )

    if (isDuplicate) {
      return
    }

    // 添加事件
    this.events.push(event)
    
    // 限制事件数量
    if (this.events.length > this.config.maxEventsPerTarget) {
      this.events = this.events.slice(-this.config.maxEventsPerTarget)
    }

    // 更新目标最后触发时间
    const target = this.targets.get(event.targetId)
    if (target) {
      target.lastTriggered = event.timestamp
    }

    // 检查预警规则
    await this.checkAlertRules(event)

    // 记录日志
    console.log(`📡 新事件: ${event.title} (${event.severity})`)
  }

  private async checkAlertRules(event: MonitoringEvent) {
    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue

      // 检查冷却时间
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered.getTime() < rule.cooldown * 1000) {
        continue
      }

      // 检查条件
      if (await this.evaluateAlertCondition(rule.condition, event)) {
        await this.triggerAlert(rule, event)
        rule.lastTriggered = new Date()
      }
    }
  }

  private async evaluateAlertCondition(condition: AlertCondition, event: MonitoringEvent): Promise<boolean> {
    const fieldValue = this.getEventFieldValue(event, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'gt':
        return Number(fieldValue) > Number(condition.value)
      case 'lt':
        return Number(fieldValue) < Number(condition.value)
      case 'contains':
        return String(fieldValue).includes(String(condition.value))
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue))
      default:
        return false
    }
  }

  private getEventFieldValue(event: MonitoringEvent, field: string): any {
    const fieldPath = field.split('.')
    let value: any = event
    
    for (const part of fieldPath) {
      value = value?.[part]
    }
    
    return value
  }

  private async triggerAlert(rule: AlertRule, event: MonitoringEvent) {
    console.log(`🚨 触发预警规则: ${rule.name}`)
    
    // 执行预警动作
    for (const action of rule.actions) {
      await this.executeAlertAction(action, event)
    }
  }

  private async executeAlertAction(action: AlertAction, event: MonitoringEvent) {
    try {
      switch (action.type) {
        case 'notification':
          // 发送通知
          console.log(`📧 发送通知: ${event.title}`)
          break
        case 'webhook':
          // 调用Webhook
          console.log(`🔗 调用Webhook: ${action.config.url}`)
          break
        case 'email':
          // 发送邮件
          console.log(`📧 发送邮件: ${action.config.to}`)
          break
        case 'log':
          // 记录日志
          console.log(`📝 记录预警日志: ${event.title}`)
          break
      }
    } catch (error) {
      console.error(`❌ 执行预警动作失败:`, error)
    }
  }

  private startEventProcessing() {
    // 启动事件处理线程
    setInterval(() => {
      this.cleanupOldEvents()
    }, 60000) // 每分钟清理一次旧事件
  }

  private cleanupOldEvents() {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000)
    const beforeCount = this.events.length
    
    this.events = this.events.filter(event => event.timestamp > cutoffDate)
    
    const removed = beforeCount - this.events.length
    if (removed > 0) {
      console.log(`🧹 清理 ${removed} 个过期事件`)
    }
  }

  getDashboard(): MonitoringDashboard {
    const activeTargets = Array.from(this.targets.values()).filter(t => t.isActive)
    const recentEvents = this.events
      .filter(e => !e.isRead)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    const criticalAlerts = this.events.filter(e => 
      e.severity === 'critical' && !e.isRead
    ).length

    const threatLevel = this.calculateThreatLevel()

    const sourceStats = Array.from(this.sources.values()).map(source => ({
      sourceId: source.id,
      name: source.name,
      events: this.events.filter(e => e.source === source.id).length,
      lastEvent: this.events
        .filter(e => e.source === source.id)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp,
      health: source.isActive ? 'healthy' : 'error'
    }))

    return {
      activeTargets: activeTargets.length,
      totalEvents: this.events.length,
      criticalAlerts,
      threatLevel,
      recentEvents,
      trendData: this.generateTrendData(),
      sourceStats
    }
  }

  private calculateThreatLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const recentEvents = this.events.filter(e => 
      Date.now() - e.timestamp.getTime() < 60 * 60 * 1000 // 最近1小时
    )

    const criticalCount = recentEvents.filter(e => e.severity === 'critical').length
    const highCount = recentEvents.filter(e => e.severity === 'high').length

    if (criticalCount > 0) return 'critical'
    if (highCount > 2) return 'high'
    if (recentEvents.length > 5) return 'medium'
    return 'low'
  }

  private generateTrendData(): TrendData[] {
    const data: TrendData[] = []
    const now = new Date()
    
    // 生成最近24小时的趋势数据
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourEvents = this.events.filter(e => 
        e.timestamp >= time && 
        e.timestamp < new Date(time.getTime() + 60 * 60 * 1000)
      )
      
      data.push({
        timestamp: time,
        events: hourEvents.length,
        threats: hourEvents.filter(e => e.type === 'threat').length,
        criticals: hourEvents.filter(e => e.severity === 'critical').length
      })
    }
    
    return data
  }

  getTargets(): MonitoringTarget[] {
    return Array.from(this.targets.values())
  }

  getEvents(targetId?: string, limit = 50): MonitoringEvent[] {
    let events = this.events
    
    if (targetId) {
      events = events.filter(e => e.targetId === targetId)
    }
    
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values())
  }

  getSources(): MonitoringSource[] {
    return Array.from(this.sources.values())
  }

  markEventAsRead(eventId: string): boolean {
    const event = this.events.find(e => e.id === eventId)
    if (event) {
      event.isRead = true
      return true
    }
    return false
  }

  getStatistics() {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const events24h = this.events.filter(e => e.timestamp >= last24h)
    const events7d = this.events.filter(e => e.timestamp >= last7d)
    
    return {
      totalEvents: this.events.length,
      events24h: events24h.length,
      events7d: events7d.length,
      activeTargets: Array.from(this.targets.values()).filter(t => t.isActive).length,
      activeRules: Array.from(this.rules.values()).filter(r => r.isActive).length,
      activeSources: Array.from(this.sources.values()).filter(s => s.isActive).length,
      threatLevel: this.calculateThreatLevel(),
      lastUpdate: now
    }
  }
}

// 导出单例实例
export const monitoringEngine = new RealTimeMonitoringEngine({
  checkInterval: 30, // 30秒检查一次
  retentionDays: 30, // 保留30天
  maxEventsPerTarget: 1000,
  enableRealTime: true,
  sources: []
})