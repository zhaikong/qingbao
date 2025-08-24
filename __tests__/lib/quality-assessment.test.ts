import { QualityAssessmentService, assessReportQuality } from '@/lib/quality-assessment'
import { SearchResult } from '@/lib/search-engine'

describe('QualityAssessmentService', () => {
  let service: QualityAssessmentService

  beforeEach(() => {
    service = new QualityAssessmentService()
  })

  const mockSearchResults: SearchResult[] = [
    {
      title: '人工智能发展报告',
      url: 'https://example.com/ai-report',
      snippet: '人工智能技术在各个领域的应用正在快速发展...',
      content: '详细的AI发展内容',
      source: '学术资源',
      verified: true,
      publishDate: '2024-01-15'
    },
    {
      title: 'AI政策分析',
      url: 'https://example.com/ai-policy',
      snippet: '政府对人工智能的政策支持力度不断加强...',
      content: '政策分析内容',
      source: '官方资源',
      verified: true,
      publishDate: '2024-01-10'
    },
    {
      title: 'AI市场趋势',
      url: 'https://example.com/ai-market',
      snippet: '人工智能市场规模持续扩大...',
      content: '市场分析内容',
      source: '新闻媒体',
      verified: false,
      publishDate: '2023-12-20'
    }
  ]

  const mockReportContent = `
# 人工智能发展趋势分析报告

## 执行摘要
本报告对人工智能发展趋势进行了深度分析，通过综合多个数据源的信息，评估了当前AI技术的发展状况。

## 背景分析
人工智能作为当前最重要的技术发展方向之一，正在经历快速的发展和变革。

## 深度分析
### 技术层面分析
AI技术在机器学习、深度学习等领域取得了重大突破。

### 政策层面分析
各国政府都在加大对AI技术的政策支持力度。

## 趋势预测
预计未来3-5年，AI技术将在更多领域实现商业化应用。

## 对策建议
建议加强AI技术研发投入，完善相关政策法规。

## 结论
综合分析表明，人工智能具有广阔的发展前景。
  `

  describe('assessReportQuality', () => {
    it('应该返回完整的质量评估结果', async () => {
      const result = await service.assessReportQuality(
        mockReportContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      expect(result).toBeDefined()
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.strengths).toBeInstanceOf(Array)
      expect(result.improvements).toBeInstanceOf(Array)
      expect(result.dataQuality).toBeGreaterThanOrEqual(0)
      expect(result.contentQuality).toBeGreaterThanOrEqual(0)
      expect(result.structureQuality).toBeGreaterThanOrEqual(0)
      expect(result.detailedAnalysis).toBeDefined()
    })

    it('应该正确评估数据源质量', async () => {
      const result = await service.assessReportQuality(
        mockReportContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      const dataAnalysis = result.detailedAnalysis.dataSourceAnalysis
      expect(dataAnalysis.totalSources).toBe(3)
      expect(dataAnalysis.verifiedSources).toBe(2)
      expect(dataAnalysis.averageRelevance).toBeGreaterThan(0)
      expect(dataAnalysis.sourceTypes).toBeDefined()
      expect(dataAnalysis.freshnessScore).toBeGreaterThanOrEqual(0)
      expect(dataAnalysis.diversityScore).toBeGreaterThan(0)
    })

    it('应该正确评估内容质量', async () => {
      const result = await service.assessReportQuality(
        mockReportContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      const contentAnalysis = result.detailedAnalysis.contentAnalysis
      expect(contentAnalysis.wordCount).toBeGreaterThan(0)
      expect(contentAnalysis.readabilityScore).toBeGreaterThanOrEqual(0)
      expect(contentAnalysis.professionalTermsCount).toBeGreaterThan(0)
      expect(contentAnalysis.analysisDepth).toMatch(/^(basic|detailed|expert)$/)
      expect(contentAnalysis.keywordDensity).toBeGreaterThanOrEqual(0)
    })

    it('应该正确评估结构质量', async () => {
      const result = await service.assessReportQuality(
        mockReportContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      const structureAnalysis = result.detailedAnalysis.structureAnalysis
      expect(structureAnalysis.hasExecutiveSummary).toBe(true)
      expect(structureAnalysis.hasBackground).toBe(true)
      expect(structureAnalysis.hasAnalysis).toBe(true)
      expect(structureAnalysis.hasTrends).toBe(true)
      expect(structureAnalysis.hasRecommendations).toBe(true)
      expect(structureAnalysis.hasConclusion).toBe(true)
      expect(structureAnalysis.sectionCompleteness).toBe(1.0)
      expect(structureAnalysis.logicalFlow).toBeGreaterThan(0)
    })

    it('应该处理空数据源的情况', async () => {
      const result = await service.assessReportQuality(
        mockReportContent,
        [],
        '人工智能发展趋势'
      )

      expect(result.dataQuality).toBe(0)
      expect(result.detailedAnalysis.dataSourceAnalysis.totalSources).toBe(0)
      expect(result.improvements).toContain('建议配置更多高质量数据源API')
    })

    it('应该处理空内容的情况', async () => {
      const result = await service.assessReportQuality(
        '',
        mockSearchResults,
        '人工智能发展趋势'
      )

      expect(result.contentQuality).toBeLessThan(50)
      expect(result.structureQuality).toBeLessThan(50)
    })

    it('应该生成合理的优势和改进建议', async () => {
      const result = await service.assessReportQuality(
        mockReportContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      expect(result.strengths.length).toBeGreaterThan(0)
      expect(result.improvements.length).toBeGreaterThanOrEqual(0)
      
      // 检查建议内容的合理性
      result.strengths.forEach(strength => {
        expect(typeof strength).toBe('string')
        expect(strength.length).toBeGreaterThan(0)
      })
      
      result.improvements.forEach(improvement => {
        expect(typeof improvement).toBe('string')
        expect(improvement.length).toBeGreaterThan(0)
      })
    })

    it('应该正确计算综合评分', async () => {
      const result = await service.assessReportQuality(
        mockReportContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      // 综合评分应该是数据质量、内容质量和结构质量的加权平均
      const expectedScore = Math.round(
        result.dataQuality * 0.30 + 
        result.contentQuality * 0.45 + 
        result.structureQuality * 0.25
      )
      
      expect(result.score).toBe(expectedScore)
    })

    it('应该识别不同类型的数据源', async () => {
      const diverseSearchResults: SearchResult[] = [
        { ...mockSearchResults[0], source: '学术资源' },
        { ...mockSearchResults[1], source: '政府官方' },
        { ...mockSearchResults[2], source: 'GitHub技术' },
        { 
          title: 'AI新闻',
          url: 'https://news.com/ai',
          snippet: 'AI新闻内容',
          source: '新闻媒体',
          verified: true
        }
      ]

      const result = await service.assessReportQuality(
        mockReportContent,
        diverseSearchResults,
        '人工智能发展趋势'
      )

      const sourceTypes = result.detailedAnalysis.dataSourceAnalysis.sourceTypes
      expect(Object.keys(sourceTypes).length).toBeGreaterThan(1)
    })

    it('应该评估分析深度', async () => {
      const expertContent = `
        本报告进行了战略性深层分析，采用系统性方法，具有前瞻性洞察，
        提供了专业的预见性分析。通过详细的综合研究，进行了全面的多维度深度评估。
      `

      const result = await service.assessReportQuality(
        expertContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      expect(result.detailedAnalysis.contentAnalysis.analysisDepth).toBe('expert')
    })

    it('应该计算关键词密度', async () => {
      const keywordRichContent = `
        人工智能发展趋势分析。人工智能技术正在快速发展。
        人工智能应用领域不断扩大。发展趋势显示人工智能前景广阔。
      `

      const result = await service.assessReportQuality(
        keywordRichContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      expect(result.detailedAnalysis.contentAnalysis.keywordDensity).toBeGreaterThan(0)
    })
  })

  describe('便捷函数', () => {
    it('assessReportQuality函数应该正常工作', async () => {
      const result = await assessReportQuality(
        mockReportContent,
        mockSearchResults,
        '人工智能发展趋势'
      )

      expect(result).toBeDefined()
      expect(result.score).toBeGreaterThan(0)
    })
  })

  describe('边界情况测试', () => {
    it('应该处理极短的内容', async () => {
      const result = await service.assessReportQuality(
        '短内容',
        mockSearchResults,
        '测试'
      )

      expect(result.contentQuality).toBeLessThan(50)
    })

    it('应该处理极长的内容', async () => {
      const longContent = 'A'.repeat(10000)
      const result = await service.assessReportQuality(
        longContent,
        mockSearchResults,
        '测试'
      )

      expect(result.detailedAnalysis.contentAnalysis.wordCount).toBeGreaterThan(1000)
    })

    it('应该处理无效的发布日期', async () => {
      const invalidDateResults: SearchResult[] = [
        {
          ...mockSearchResults[0],
          publishDate: 'invalid-date'
        }
      ]

      const result = await service.assessReportQuality(
        mockReportContent,
        invalidDateResults,
        '人工智能发展趋势'
      )

      expect(result.detailedAnalysis.dataSourceAnalysis.freshnessScore).toBeGreaterThanOrEqual(0)
    })
  })
})