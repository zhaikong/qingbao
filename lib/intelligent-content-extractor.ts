/**
 * 智能内容提取器
 * 
 * 核心功能：
 * 1. 网页内容智能提取
 * 2. 多格式内容解析（HTML、PDF、文档）
 * 3. 内容清洗和结构化
 * 4. 多语言内容处理
 * 5. 图片和表格内容识别
 */

import { performanceMonitor } from './performance-monitor'

export interface ExtractedContent {
  title: string
  content: string
  metadata: {
    author?: string
    publishDate?: string
    language: string
    wordCount: number
    contentType: 'article' | 'news' | 'blog' | 'academic' | 'documentation' | 'other'
    images: string[]
    links: string[]
    tables: any[]
  }
  structure: {
    headings: Array<{ level: number; text: string }>
    paragraphs: string[]
    sections: Array<{ title: string; content: string }>
  }
  quality: {
    readabilityScore: number
    contentDepth: 'shallow' | 'medium' | 'deep'
    informativeness: number
    credibility: number
  }
}

export class IntelligentContentExtractor {
  private firecrawlApiKey: string | undefined
  private readonly maxRetries = 3
  private readonly timeout = 30000

  constructor() {
    this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY
  }

  /**
   * 主要内容提取方法
   */
  async extractContent(url: string, options: {
    method?: 'firecrawl' | 'puppeteer' | 'fetch' | 'auto'
    includeImages?: boolean
    includeTables?: boolean
    maxContentLength?: number
    language?: string
  } = {}): Promise<ExtractedContent | null> {
    
    const {
      method = 'auto',
      includeImages = false,
      includeTables = true,
      maxContentLength = 50000,
      language = 'auto'
    } = options

    console.log(`📄 开始提取内容: ${url}`)
    console.log(`⚙️ 提取配置:`, { method, includeImages, includeTables })

    performanceMonitor.start(`content-extract-${url}`)

    try {
      let extractedContent: ExtractedContent | null = null

      // 根据方法选择提取策略
      if (method === 'auto') {
        // 自动选择最佳方法
        extractedContent = await this.autoExtract(url, options)
      } else if (method === 'firecrawl' && this.firecrawlApiKey) {
        extractedContent = await this.extractWithFirecrawl(url, options)
      } else if (method === 'fetch') {
        extractedContent = await this.extractWithFetch(url, options)
      } else {
        throw new Error(`不支持的提取方法: ${method}`)
      }

      if (extractedContent) {
        // 内容后处理
        extractedContent = await this.postProcessContent(extractedContent, options)
        
        console.log(`✅ 内容提取成功: ${extractedContent.metadata.wordCount} 字`)
        console.log(`📊 内容质量评分: ${extractedContent.quality.informativeness.toFixed(2)}`)
      } else {
        console.warn(`⚠️ 内容提取失败: ${url}`)
      }

      performanceMonitor.end(`content-extract-${url}`)
      return extractedContent

    } catch (error: any) {
      console.error(`❌ 内容提取错误: ${error.message}`)
      performanceMonitor.end(`content-extract-${url}`)
      return null
    }
  }

  /**
   * 自动选择最佳提取方法
   */
  private async autoExtract(url: string, options: any): Promise<ExtractedContent | null> {
    const methods = []

    // 根据可用性确定尝试顺序
    if (this.firecrawlApiKey) methods.push('firecrawl')
    methods.push('fetch')

    for (const method of methods) {
      try {
        console.log(`🔄 尝试方法: ${method}`)
        
        if (method === 'firecrawl') {
          return await this.extractWithFirecrawl(url, options)
        } else if (method === 'fetch') {
          return await this.extractWithFetch(url, options)
        }
      } catch (error: any) {
        console.warn(`⚠️ ${method} 提取失败: ${error.message}`)
        continue
      }
    }

    return null
  }

  /**
   * 使用Firecrawl API提取内容
   */
  private async extractWithFirecrawl(url: string, options: any): Promise<ExtractedContent | null> {
    if (!this.firecrawlApiKey) {
      throw new Error('Firecrawl API密钥未配置')
    }

    console.log(`🔥 使用Firecrawl提取: ${url}`)

    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.firecrawlApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'article'],
        excludeTags: ['nav', 'footer', 'aside', 'script', 'style'],
        waitFor: 2000,
        timeout: this.timeout
      }),
      signal: AbortSignal.timeout(this.timeout)
    })

    if (!response.ok) {
      throw new Error(`Firecrawl API错误: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(`Firecrawl提取失败: ${data.error || '未知错误'}`)
    }

    return this.parseFirecrawlResponse(data.data, url)
  }

  /**
   * 使用简单fetch提取内容
   */
  private async extractWithFetch(url: string, options: any): Promise<ExtractedContent | null> {
    console.log(`🌐 使用Fetch提取: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IntelligenceBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate'
      },
      signal: AbortSignal.timeout(this.timeout)
    })

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    
    if (!contentType.includes('text/html')) {
      throw new Error(`不支持的内容类型: ${contentType}`)
    }

    const html = await response.text()
    return this.parseHtmlContent(html, url)
  }

  /**
   * 解析Firecrawl响应
   */
  private parseFirecrawlResponse(data: any, url: string): ExtractedContent {
    const markdown = data.markdown || ''
    const html = data.html || ''
    const metadata = data.metadata || {}

    // 提取基本信息
    const title = metadata.title || this.extractTitleFromMarkdown(markdown) || 'Untitled'
    const content = this.cleanMarkdownContent(markdown)

    // 分析内容结构
    const structure = this.analyzeContentStructure(markdown)
    
    // 提取元数据
    const extractedMetadata = {
      author: metadata.author,
      publishDate: metadata.publishDate || this.extractDateFromContent(content),
      language: metadata.language || this.detectLanguage(content),
      wordCount: this.countWords(content),
      contentType: this.classifyContentType(content, title) as any,
      images: this.extractImages(html),
      links: this.extractLinks(html),
      tables: this.extractTables(html)
    }

    // 质量评估
    const quality = this.assessContentQuality(content, title, structure)

    return {
      title,
      content,
      metadata: extractedMetadata,
      structure,
      quality
    }
  }

  /**
   * 解析HTML内容
   */
  private parseHtmlContent(html: string, url: string): ExtractedContent {
    // 提取标题
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    const title = titleMatch ? this.cleanText(titleMatch[1]) : 'Untitled'

    // 提取主要内容
    let content = this.extractMainContent(html)
    content = this.cleanHtmlContent(content)

    // 分析结构
    const structure = this.analyzeHtmlStructure(html)

    // 提取元数据
    const metadata = {
      author: this.extractMetaContent(html, 'author'),
      publishDate: this.extractMetaContent(html, 'published_time') || 
                   this.extractMetaContent(html, 'article:published_time') ||
                   this.extractDateFromContent(content),
      language: this.extractMetaContent(html, 'language') || 
                html.match(/<html[^>]*lang=["']([^"']+)["']/i)?.[1] ||
                this.detectLanguage(content),
      wordCount: this.countWords(content),
      contentType: this.classifyContentType(content, title) as any,
      images: this.extractImages(html),
      links: this.extractLinks(html),
      tables: this.extractTables(html)
    }

    // 质量评估
    const quality = this.assessContentQuality(content, title, structure)

    return {
      title,
      content,
      metadata,
      structure,
      quality
    }
  }

  /**
   * 提取HTML主要内容
   */
  private extractMainContent(html: string): string {
    // 尝试常见的内容容器选择器
    const contentSelectors = [
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '.main-content',
      '#content',
      '.article-body',
      '.post-body'
    ]

    for (const selector of contentSelectors) {
      const regex = new RegExp(`<[^>]*class[^>]*${selector.replace('.', '')}[^>]*>(.*?)</[^>]*>`, 'is')
      const match = html.match(regex)
      if (match && match[1].length > 500) {
        return match[1]
      }
    }

    // 如果没有找到特定容器，提取body内容
    const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is)
    return bodyMatch ? bodyMatch[1] : html
  }

  /**
   * 清理HTML内容
   */
  private cleanHtmlContent(html: string): string {
    return html
      // 移除脚本和样式
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      // 移除注释
      .replace(/<!--.*?-->/gs, '')
      // 移除导航和页脚
      .replace(/<nav[^>]*>.*?<\/nav>/gis, '')
      .replace(/<footer[^>]*>.*?<\/footer>/gis, '')
      .replace(/<aside[^>]*>.*?<\/aside>/gis, '')
      // 转换段落和换行
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // 保留标题
      .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, '\n\n# $2\n\n')
      // 移除所有HTML标签
      .replace(/<[^>]*>/g, '')
      // 清理多余空白
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()
  }

  /**
   * 分析内容结构
   */
  private analyzeContentStructure(content: string): ExtractedContent['structure'] {
    const headings: Array<{ level: number; text: string }> = []
    const paragraphs: string[] = []
    const sections: Array<{ title: string; content: string }> = []

    // 提取标题（Markdown格式）
    const headingMatches = content.match(/^#{1,6}\s+(.+)$/gm) || []
    headingMatches.forEach(match => {
      const level = (match.match(/^#+/) || [''])[0].length
      const text = match.replace(/^#+\s+/, '').trim()
      headings.push({ level, text })
    })

    // 提取段落
    const paragraphMatches = content.split(/\n\s*\n/).filter(p => 
      p.trim().length > 50 && !p.match(/^#+\s/)
    )
    paragraphs.push(...paragraphMatches.map(p => p.trim()))

    // 构建章节
    let currentSection = { title: '', content: '' }
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.match(/^#+\s/)) {
        if (currentSection.title) {
          sections.push({ ...currentSection })
        }
        currentSection = { 
          title: line.replace(/^#+\s+/, '').trim(), 
          content: '' 
        }
      } else if (line.trim()) {
        currentSection.content += line + '\n'
      }
    }
    
    if (currentSection.title) {
      sections.push(currentSection)
    }

    return { headings, paragraphs, sections }
  }

  /**
   * 分析HTML结构
   */
  private analyzeHtmlStructure(html: string): ExtractedContent['structure'] {
    const headings: Array<{ level: number; text: string }> = []
    const paragraphs: string[] = []
    const sections: Array<{ title: string; content: string }> = []

    // 提取标题
    const headingMatches = html.match(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi) || []
    headingMatches.forEach(match => {
      const levelMatch = match.match(/<h([1-6])/)
      const textMatch = match.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i)
      
      if (levelMatch && textMatch) {
        headings.push({
          level: parseInt(levelMatch[1]),
          text: this.cleanText(textMatch[1])
        })
      }
    })

    // 提取段落
    const paragraphMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi) || []
    paragraphMatches.forEach(match => {
      const text = this.cleanText(match.replace(/<[^>]*>/g, ''))
      if (text.length > 50) {
        paragraphs.push(text)
      }
    })

    return { headings, paragraphs, sections }
  }

  /**
   * 评估内容质量
   */
  private assessContentQuality(
    content: string, 
    title: string, 
    structure: ExtractedContent['structure']
  ): ExtractedContent['quality'] {
    
    const wordCount = this.countWords(content)
    
    // 可读性评分
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
    const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1)
    const readabilityScore = Math.max(0, Math.min(1, 1 - Math.abs(avgWordsPerSentence - 15) / 15))

    // 内容深度
    let contentDepth: 'shallow' | 'medium' | 'deep' = 'shallow'
    if (wordCount > 2000 && structure.headings.length > 3) contentDepth = 'deep'
    else if (wordCount > 800 && structure.headings.length > 1) contentDepth = 'medium'

    // 信息量评分
    const structureScore = Math.min(structure.headings.length / 5, 1) * 0.3
    const lengthScore = Math.min(wordCount / 3000, 1) * 0.4
    const diversityScore = (new Set(content.toLowerCase().split(/\s+/)).size / Math.max(wordCount, 1)) * 0.3
    const informativeness = structureScore + lengthScore + diversityScore

    // 可信度基础评分
    const credibility = 0.7 // 基础可信度，可以根据来源进一步调整

    return {
      readabilityScore,
      contentDepth,
      informativeness,
      credibility
    }
  }

  // 辅助方法
  private extractTitleFromMarkdown(markdown: string): string | null {
    const match = markdown.match(/^#\s+(.+)$/m)
    return match ? match[1].trim() : null
  }

  private cleanMarkdownContent(markdown: string): string {
    return markdown
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接格式，保留文本
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/`([^`]+)`/g, '$1') // 移除行内代码格式
      .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体格式
      .replace(/\*([^*]+)\*/g, '$1') // 移除斜体格式
      .replace(/^\s*[-*+]\s+/gm, '') // 移除列表标记
      .replace(/^\s*\d+\.\s+/gm, '') // 移除数字列表标记
      .replace(/\n{3,}/g, '\n\n') // 规范化换行
      .trim()
  }

  private extractMetaContent(html: string, property: string): string | undefined {
    const patterns = [
      new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i')
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) return match[1]
    }

    return undefined
  }

  private extractDateFromContent(content: string): string | undefined {
    // 匹配常见的日期格式
    const datePatterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/
    ]

    for (const pattern of datePatterns) {
      const match = content.match(pattern)
      if (match) {
        try {
          return new Date(match[0]).toISOString()
        } catch {
          continue
        }
      }
    }

    return undefined
  }

  private detectLanguage(content: string): string {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const totalChars = content.length
    
    if (chineseChars / totalChars > 0.3) return 'zh'
    if (/[a-zA-Z]/.test(content)) return 'en'
    return 'unknown'
  }

  private countWords(content: string): number {
    // 中文按字符计算，英文按单词计算
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = content.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(w => w.length > 0).length
    
    return chineseChars + englishWords
  }

  private classifyContentType(content: string, title: string): string {
    const text = (title + ' ' + content).toLowerCase()
    
    if (text.includes('research') || text.includes('study') || text.includes('论文') || text.includes('研究')) {
      return 'academic'
    }
    if (text.includes('news') || text.includes('breaking') || text.includes('新闻') || text.includes('快讯')) {
      return 'news'
    }
    if (text.includes('blog') || text.includes('博客') || text.includes('日记')) {
      return 'blog'
    }
    if (text.includes('documentation') || text.includes('guide') || text.includes('tutorial') || text.includes('文档')) {
      return 'documentation'
    }
    if (text.includes('article') || text.includes('文章')) {
      return 'article'
    }
    
    return 'other'
  }

  private extractImages(html: string): string[] {
    const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["']/gi) || []
    return imgMatches.map(match => {
      const srcMatch = match.match(/src=["']([^"']+)["']/i)
      return srcMatch ? srcMatch[1] : ''
    }).filter(src => src.length > 0)
  }

  private extractLinks(html: string): string[] {
    const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["']/gi) || []
    return linkMatches.map(match => {
      const hrefMatch = match.match(/href=["']([^"']+)["']/i)
      return hrefMatch ? hrefMatch[1] : ''
    }).filter(href => href.length > 0 && href.startsWith('http'))
  }

  private extractTables(html: string): any[] {
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || []
    return tableMatches.map((table, index) => ({
      id: index,
      html: table,
      rows: (table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []).length
    }))
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private async postProcessContent(
    content: ExtractedContent, 
    options: any
  ): Promise<ExtractedContent> {
    // 内容长度限制
    if (options.maxContentLength && content.content.length > options.maxContentLength) {
      content.content = content.content.substring(0, options.maxContentLength) + '...'
      content.metadata.wordCount = this.countWords(content.content)
    }

    // 移除不需要的图片
    if (!options.includeImages) {
      content.metadata.images = []
    }

    // 移除不需要的表格
    if (!options.includeTables) {
      content.metadata.tables = []
    }

    return content
  }
}

// 导出实例
export const intelligentContentExtractor = new IntelligentContentExtractor()