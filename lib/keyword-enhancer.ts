/**
 * 关键词增强器 - 参考舆情产品的关键词扩展策略
 */

interface KeywordExpansion {
  synonyms: string[]
  related: string[]
  combinations: string[]
  booleanQueries: string[]
}

export class KeywordEnhancer {
  /**
   * 参考舆情产品的关键词扩展策略
   * 输入: "社保政策"
   * 输出: "(社保|社会保险)+(政策|法规|规定|办法)"
   */
  expandKeywords(primaryKeywords: string[]): KeywordExpansion {
    const synonymMap = this.buildSynonymMap()
    const result: KeywordExpansion = {
      synonyms: [],
      related: [],
      combinations: [],
      booleanQueries: []
    }

    primaryKeywords.forEach(keyword => {
      // 获取同义词
      const synonyms = this.getSynonyms(keyword, synonymMap)
      result.synonyms.push(...synonyms)

      // 获取相关词
      const related = this.getRelatedTerms(keyword)
      result.related.push(...related)

      // 生成布尔查询
      const booleanQuery = this.generateBooleanQuery(keyword, synonyms, related)
      result.booleanQueries.push(booleanQuery)
    })

    // 生成组合查询
    result.combinations = this.generateCombinations(primaryKeywords, result.synonyms)

    return result
  }

  /**
   * 构建同义词映射表
   */
  private buildSynonymMap(): Map<string, string[]> {
    const synonymMap = new Map<string, string[]>()
    
    // 社会保障相关
    synonymMap.set('社保', ['社会保险', '社会保障', '五险一金'])
    synonymMap.set('医保', ['医疗保险', '医疗保障'])
    synonymMap.set('养老', ['养老保险', '退休保险'])
    
    // 政策法规相关
    synonymMap.set('政策', ['法规', '规定', '办法', '条例', '通知'])
    synonymMap.set('法律', ['法规', '条例', '规章', '制度'])
    
    // 经济金融相关
    synonymMap.set('经济', ['金融', '财政', '货币'])
    synonymMap.set('投资', ['融资', '资金', '资本'])
    
    // 国际关系相关
    synonymMap.set('外交', ['国际关系', '对外关系'])
    synonymMap.set('贸易', ['商务', '经贸', '进出口'])
    
    // 科技相关
    synonymMap.set('人工智能', ['AI', '机器学习', '深度学习'])
    synonymMap.set('区块链', ['数字货币', '加密货币'])
    
    return synonymMap
  }

  /**
   * 获取同义词
   */
  private getSynonyms(keyword: string, synonymMap: Map<string, string[]>): string[] {
    const synonyms: string[] = []
    
    // 直接匹配
    if (synonymMap.has(keyword)) {
      synonyms.push(...(synonymMap.get(keyword) || []))
    }
    
    // 模糊匹配
    for (const [key, values] of synonymMap.entries()) {
      if (keyword.includes(key) || key.includes(keyword)) {
        synonyms.push(...values)
      }
    }
    
    return Array.from(new Set(synonyms))
  }

  /**
   * 获取相关术语
   */
  private getRelatedTerms(keyword: string): string[] {
    const relatedTermsMap: Record<string, string[]> = {
      '社保': ['缴纳', '个人', '用人单位', '缴费', '续交', '转移', '流程', '办理'],
      '政策': ['实施', '执行', '解读', '影响', '变化', '调整'],
      '经济': ['增长', '发展', '指标', '数据', '统计', '分析'],
      '外交': ['会谈', '访问', '合作', '协议', '声明', '立场'],
      '科技': ['创新', '研发', '技术', '应用', '发展', '突破']
    }
    
    const related: string[] = []
    
    for (const [key, terms] of Object.entries(relatedTermsMap)) {
      if (keyword.includes(key) || key.includes(keyword)) {
        related.push(...terms)
      }
    }
    
    return related
  }

  /**
   * 生成布尔查询 - 参考舆情产品格式
   * 例: "(社保|社会保险)+(缴纳|个人|用人单位)"
   */
  private generateBooleanQuery(keyword: string, synonyms: string[], related: string[]): string {
    const mainTerms = [keyword, ...synonyms].slice(0, 4) // 限制主要词汇数量
    const relatedTerms = related.slice(0, 6) // 限制相关词汇数量
    
    let query = ''
    
    if (mainTerms.length > 1) {
      query += `(${mainTerms.join('|')})`
    } else {
      query += keyword
    }
    
    if (relatedTerms.length > 0) {
      query += `+(${relatedTerms.join('|')})`
    }
    
    return query
  }

  /**
   * 生成组合查询
   */
  private generateCombinations(keywords: string[], synonyms: string[]): string[] {
    const combinations: string[] = []
    const allTerms = [...keywords, ...synonyms]
    
    // 两两组合
    for (let i = 0; i < allTerms.length; i++) {
      for (let j = i + 1; j < allTerms.length && j < i + 3; j++) {
        combinations.push(`${allTerms[i]} ${allTerms[j]}`)
      }
    }
    
    return combinations.slice(0, 10) // 限制组合数量
  }

  /**
   * 生成搜索策略 - 参考舆情产品的多阶段搜索
   */
  generateSearchStrategy(topic: string, keywords: string[]): {
    phase: string
    queries: string[]
    description: string
    priority: number
  }[] {
    const expansion = this.expandKeywords(keywords)
    
    return [
      {
        phase: '核心信息搜索',
        queries: expansion.booleanQueries,
        description: '使用布尔查询获取精准信息',
        priority: 1
      },
      {
        phase: '同义词扩展搜索',
        queries: expansion.synonyms.map(s => `"${s}" ${topic}`),
        description: '通过同义词扩大搜索范围',
        priority: 2
      },
      {
        phase: '相关概念搜索',
        queries: expansion.related.map(r => `${r} ${keywords[0] || topic}`),
        description: '搜索相关概念和术语',
        priority: 3
      },
      {
        phase: '组合查询搜索',
        queries: expansion.combinations,
        description: '使用组合查询发现关联信息',
        priority: 4
      }
    ]
  }
}

export const keywordEnhancer = new KeywordEnhancer()