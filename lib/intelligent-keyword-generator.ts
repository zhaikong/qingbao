interface KeywordAnalysis {
  primaryKeywords: string[]
  secondaryKeywords: string[]
  contextKeywords: string[]
  timeKeywords: string[]
  locationKeywords: string[]
  entityKeywords: string[]
  searchQueries: string[]
  analysisInsights: string[]
}

export class IntelligentKeywordGenerator {
  private readonly GOOGLE_API_KEY = 'AIzaSyB7crWTiihx2NLychNN8yVW59hb8DAgdqw'
  private readonly GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

  /**
   * 动态分析用户输入的主题和内容，生成智能搜索关键词
   * @param topic 用户输入的主题
   * @param summary 用户输入的内容摘要
   * @returns 智能分析的关键词策略
   */
  async generateKeywords(topic: string, summary: string): Promise<KeywordAnalysis> {
    console.log('🤖 使用Google Gemini进行关键词分析...')
    
    try {
      // 使用Google Gemini API
      const prompt = this.createGeminiPrompt(topic, summary)
      
      const response = await fetch(`${this.GOOGLE_API_URL}?key=${this.GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3000,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Google Gemini API请求失败: ${response.status}`)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        throw new Error('Google Gemini返回内容为空')
      }

      console.log('✅ Google Gemini关键词分析成功')

      // 尝试解析JSON响应
      try {
        const parsed = JSON.parse(content)
        return this.validateAndEnhanceKeywords(parsed, topic, summary)
      } catch {
        // 如果不是JSON格式，智能解析文本
        return this.parseTextResponse(content, topic, summary)
      }
    } catch (error: any) {
      console.error('❌ Google Gemini关键词分析失败:', error)
      
      // 降级到本地启发式生成
      console.log('🔄 降级到本地启发式关键词生成')
      return this.generateFallbackKeywords(topic, summary)
    }
  }

  /**
   * 创建适合Google Gemini的提示词 - 参考舆情产品优化
   */
  private createGeminiPrompt(topic: string, summary: string): string {
    return `
作为专业的舆情分析和信息检索专家，请分析以下主题并生成精准的搜索关键词策略。

参考示例：
主题："9月1日交社保近7天的事件"
生成关键词：(社保|社会保险)+(缴纳|个人|用人单位|养老保险|医疗保险|缴费|续交|转移|政策|法规|流程|办理)

现在分析：
主题：${topic}
内容概要：${summary}

请提供以下分析，以JSON格式返回：

{
  "primaryKeywords": ["核心关键词1", "核心关键词2", "核心关键词3"],
  "secondaryKeywords": ["相关词汇1", "相关词汇2", "相关词汇3", "相关词汇4", "相关词汇5"],
  "contextKeywords": ["背景词汇1", "背景词汇2", "背景词汇3", "背景词汇4"],
  "timeKeywords": ["时间词汇1", "时间词汇2", "时间词汇3"],
  "locationKeywords": ["地理词汇1", "地理词汇2", "地理词汇3"],
  "entityKeywords": ["实体词汇1", "实体词汇2", "实体词汇3"],
  "searchQueries": [
    "搜索查询1",
    "搜索查询2", 
    "搜索查询3",
    "搜索查询4",
    "搜索查询5",
    "搜索查询6"
  ],
  "analysisInsights": [
    "分析洞察1",
    "分析洞察2",
    "分析洞察3"
  ]
}

要求：
1. 提取最核心的概念和术语作为主要关键词
2. 生成相关的同义词和衍生词汇
3. 包含政治、经济、社会背景相关词汇
4. 添加时间维度和地理维度的关键词
5. 识别相关的人物、组织、机构实体
6. 生成多样化的搜索查询语句
7. 提供搜索策略建议和潜在关联主题

请确保返回标准的JSON格式。
`
  }

  /**
   * 创建安全的提示词（去除敏感表述）
   */
  private createSafePrompt(topic: string, summary: string): string {
    // 对输入进行安全过滤
    const safeTopic = this.sanitizeInput(topic)
    const safeSummary = this.sanitizeInput(summary)
    
    return `
请分析以下研究主题，生成学术检索关键词：

研究主题：${safeTopic}
内容概要：${safeSummary}

请提供以下分析：

1. 核心概念词汇（3-5个）
2. 相关学术术语（5-8个）  
3. 研究背景词汇（5-7个）
4. 时间相关词汇（3-5个）
5. 地理相关词汇（3-6个）
6. 机构组织词汇（3-6个）
7. 检索查询语句（8-12个）
8. 检索策略建议（3-5个）

请以JSON格式返回，字段名使用英文：primaryKeywords, secondaryKeywords, contextKeywords, timeKeywords, locationKeywords, entityKeywords, searchQueries, analysisInsights
`
  }

  /**
   * 创建超安全的提示词（最大程度避免敏感内容）
   */
  private createUltraSafePrompt(topic: string, summary: string): string {
    const ultraSafeTopic = this.ultraSanitizeInput(topic)
    const ultraSafeSummary = this.ultraSanitizeInput(summary)
    
    return `
学术信息检索任务：

主题：${ultraSafeTopic}
描述：${ultraSafeSummary}

请生成检索关键词分类：
- 主要词汇
- 次要词汇  
- 背景词汇
- 时间词汇
- 地点词汇
- 机构词汇
- 查询语句
- 检索建议

JSON格式输出。
`
  }

  /**
   * 输入内容安全过滤
   */
  private sanitizeInput(input: string): string {
    // 移除或替换可能的敏感词汇
    const sensitivePatterns = [
      /抗议|示威|冲突|暴力|革命|政变/g,
      /敏感|机密|内部|秘密/g,
      /攻击|威胁|危险|恐怖/g
    ]
    
    let sanitized = input
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match) => {
        // 替换为中性词汇
        const replacements: Record<string, string> = {
          '抗议': '公众活动',
          '示威': '集会',
          '冲突': '分歧',
          '暴力': '事件',
          '革命': '变革',
          '政变': '政治变化',
          '敏感': '重要',
          '机密': '内部',
          '秘密': '非公开',
          '攻击': '行动',
          '威胁': '风险',
          '危险': '风险',
          '恐怖': '极端'
        }
        return replacements[match] || '相关事件'
      })
    })
    
    return sanitized
  }

  /**
   * 超级安全过滤（更激进的替换）
   */
  private ultraSanitizeInput(input: string): string {
    // 提取核心名词和地名，移除所有可能敏感的修饰词
    const words = input.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || []
    const safeWords = words.filter(word => {
      // 只保留地名、时间、中性名词
      return word.length > 1 && !this.isSensitiveWord(word)
    })
    
    return safeWords.slice(0, 10).join(' ')
  }

  /**
   * 检查是否为敏感词汇
   */
  private isSensitiveWord(word: string): boolean {
    const sensitiveWords = [
      '抗议', '示威', '冲突', '暴力', '革命', '政变',
      '敏感', '机密', '秘密', '攻击', '威胁', '危险', '恐怖',
      'protest', 'violence', 'conflict', 'revolution', 'attack'
    ]
    
    return sensitiveWords.some(sensitive => 
      word.toLowerCase().includes(sensitive.toLowerCase())
    )
  }

  /**
   * 验证和增强关键词结果
   */
  private validateAndEnhanceKeywords(parsed: any, topic: string, summary: string): KeywordAnalysis {
    const result: KeywordAnalysis = {
      primaryKeywords: this.ensureArray(parsed.primaryKeywords || parsed.核心关键词 || []),
      secondaryKeywords: this.ensureArray(parsed.secondaryKeywords || parsed.次要关键词 || []),
      contextKeywords: this.ensureArray(parsed.contextKeywords || parsed.背景关键词 || []),
      timeKeywords: this.ensureArray(parsed.timeKeywords || parsed.时间关键词 || []),
      locationKeywords: this.ensureArray(parsed.locationKeywords || parsed.地理关键词 || []),
      entityKeywords: this.ensureArray(parsed.entityKeywords || parsed.实体关键词 || []),
      searchQueries: this.ensureArray(parsed.searchQueries || parsed.搜索查询 || []),
      analysisInsights: this.ensureArray(parsed.analysisInsights || parsed.分析洞察 || [])
    }

    // 如果某些字段为空，进行智能补充
    if (result.primaryKeywords.length === 0) {
      result.primaryKeywords = this.extractKeywordsFromText(topic, 3)
    }

    if (result.searchQueries.length === 0) {
      result.searchQueries = this.generateBasicQueries(topic, result.primaryKeywords)
    }

    return result
  }

  /**
   * 解析文本格式的响应
   */
  private parseTextResponse(content: string, topic: string, summary: string): KeywordAnalysis {
    const result: KeywordAnalysis = {
      primaryKeywords: [],
      secondaryKeywords: [],
      contextKeywords: [],
      timeKeywords: [],
      locationKeywords: [],
      entityKeywords: [],
      searchQueries: [],
      analysisInsights: []
    }

    const lines = content.split('\n')
    let currentSection = ''

    for (const line of lines) {
      const trimmed = line.trim()
      
      // 识别章节
      if (this.isSectionHeader(trimmed)) {
        currentSection = this.identifySection(trimmed)
        continue
      }

      // 提取内容
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('**')) {
        const items = this.extractItemsFromLine(trimmed)
        this.addItemsToSection(result, currentSection, items)
      }
    }

    // 确保基本内容存在
    if (result.primaryKeywords.length === 0) {
      result.primaryKeywords = this.extractKeywordsFromText(topic, 5)
    }

    return result
  }

  /**
   * 生成备用关键词（当AI分析失败时）
   */
  private generateFallbackKeywords(topic: string, summary: string): KeywordAnalysis {
    const topicWords = this.extractKeywordsFromText(topic, 3)
    const summaryWords = this.extractKeywordsFromText(summary, 5)
    
    return {
      primaryKeywords: topicWords,
      secondaryKeywords: summaryWords.slice(0, 6),
      contextKeywords: ['政治', '经济', '社会', '国际关系', '政策'],
      timeKeywords: ['2024', '近期', '当前', '最新'],
      locationKeywords: this.extractLocations(topic + ' ' + summary),
      entityKeywords: this.extractEntities(topic + ' ' + summary),
      searchQueries: [
        `"${topic}"`,
        `${topic} 最新消息`,
        `${topic} 分析报告`,
        `${topic} 影响`,
        ...topicWords.map(word => `${word} 2024`)
      ],
      analysisInsights: [
        '建议多角度搜索获取全面信息',
        '关注官方和媒体不同观点',
        '注意信息时效性和可信度'
      ]
    }
  }

  // 辅助方法
  private ensureArray(value: any): string[] {
    if (Array.isArray(value)) return value.filter(item => typeof item === 'string')
    if (typeof value === 'string') return [value]
    return []
  }

  private extractKeywordsFromText(text: string, limit: number): string[] {
    // 简单的关键词提取逻辑
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || []
    const filtered = words.filter(word => word.length > 1)
    return [...new Set(filtered)].slice(0, limit)
  }

  private extractLocations(text: string): string[] {
    const locationPatterns = [
      /[\u4e00-\u9fa5]*国/g,
      /[\u4e00-\u9fa5]*省/g,
      /[\u4e00-\u9fa5]*市/g,
      /[\u4e00-\u9fa5]*地区/g
    ]
    
    const locations: string[] = []
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      locations.push(...matches)
    })
    
    return [...new Set(locations)].slice(0, 5)
  }

  private extractEntities(text: string): string[] {
    // 简单的实体提取
    const entityPatterns = [
      /[\u4e00-\u9fa5]*政府/g,
      /[\u4e00-\u9fa5]*组织/g,
      /[\u4e00-\u9fa5]*公司/g,
      /[\u4e00-\u9fa5]*部门/g
    ]
    
    const entities: string[] = []
    entityPatterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      entities.push(...matches)
    })
    
    return [...new Set(entities)].slice(0, 5)
  }

  private generateBasicQueries(topic: string, keywords: string[]): string[] {
    const queries = [
      `"${topic}"`,
      `${topic} 最新`,
      `${topic} 分析`,
      `${topic} 报告`
    ]

    keywords.forEach(keyword => {
      queries.push(`${keyword} ${new Date().getFullYear()}`)
      queries.push(`${keyword} 影响`)
    })

    return queries.slice(0, 10)
  }

  private isSectionHeader(line: string): boolean {
    return line.includes('关键词') || line.includes('搜索') || line.includes('分析') || 
           line.includes('Keywords') || line.includes('Search') || line.includes('Analysis')
  }

  private identifySection(line: string): string {
    if (line.includes('核心') || line.includes('primary')) return 'primary'
    if (line.includes('次要') || line.includes('secondary')) return 'secondary'
    if (line.includes('背景') || line.includes('context')) return 'context'
    if (line.includes('时间') || line.includes('time')) return 'time'
    if (line.includes('地理') || line.includes('location')) return 'location'
    if (line.includes('实体') || line.includes('entity')) return 'entity'
    if (line.includes('搜索') || line.includes('search')) return 'queries'
    if (line.includes('洞察') || line.includes('insight')) return 'insights'
    return ''
  }

  private extractItemsFromLine(line: string): string[] {
    return line.split(/[,，、；;]/)
              .map(item => item.trim())
              .filter(item => item.length > 0)
  }

  private addItemsToSection(result: KeywordAnalysis, section: string, items: string[]): void {
    switch (section) {
      case 'primary':
        result.primaryKeywords.push(...items)
        break
      case 'secondary':
        result.secondaryKeywords.push(...items)
        break
      case 'context':
        result.contextKeywords.push(...items)
        break
      case 'time':
        result.timeKeywords.push(...items)
        break
      case 'location':
        result.locationKeywords.push(...items)
        break
      case 'entity':
        result.entityKeywords.push(...items)
        break
      case 'queries':
        result.searchQueries.push(...items)
        break
      case 'insights':
        result.analysisInsights.push(...items)
        break
    }
  }

  /**
   * 生成搜索策略
   */
  async generateSearchStrategy(topic: string, summary: string): Promise<{
    keywords: KeywordAnalysis
    searchPlan: {
      phase: string
      queries: string[]
      sources: string[]
      priority: number
      description: string
    }[]
  }> {
    const keywords = await this.generateKeywords(topic, summary)
    
    const searchPlan = [
      {
        phase: '核心信息搜索',
        queries: keywords.primaryKeywords.map(k => `"${k}"`),
        sources: ['新闻媒体', '官方网站', '学术数据库'],
        priority: 1,
        description: '获取主题的核心信息和最新动态'
      },
      {
        phase: '背景信息收集',
        queries: keywords.contextKeywords.map(k => `${k} ${keywords.primaryKeywords[0] || topic}`),
        sources: ['百科全书', '研究报告', '政府文件'],
        priority: 2,
        description: '收集相关背景信息和历史脉络'
      },
      {
        phase: '多角度分析',
        queries: keywords.searchQueries.slice(0, 6),
        sources: ['社交媒体', '专业论坛', '国际媒体'],
        priority: 3,
        description: '从多个角度获取不同观点和分析'
      },
      {
        phase: '深度挖掘',
        queries: [
          ...keywords.entityKeywords.map(e => `${e} ${topic}`),
          ...keywords.locationKeywords.map(l => `${l} ${topic}`)
        ],
        sources: ['专业数据库', '智库报告', '行业分析'],
        priority: 4,
        description: '深入挖掘相关实体和地理信息'
      }
    ]

    return { keywords, searchPlan }
  }
}

// 导出单例实例
export const keywordGenerator = new IntelligentKeywordGenerator()