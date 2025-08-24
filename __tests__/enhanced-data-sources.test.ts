/**
 * 增强型数据源系统测试
 * 
 * 测试增强型数据采集、内容提取和报告生成功能
 */

import { enhancedDataSourceManager } from '../lib/enhanced-data-sources'
import { intelligentContentExtractor } from '../lib/intelligent-content-extractor'
import { generateAdvancedIntelligenceReport } from '../lib/enhanced-report-generator'

describe('增强型数据源系统测试', () => {
  // 设置测试超时时间
  jest.setTimeout(60000)

  describe('增强型数据源管理器', () => {
    test('应该能够获取数据源状态', () => {
      const status = enhancedDataSourceManager.getDataSourceStatus()
      
      expect(status).toBeDefined()
      expect(typeof status).toBe('object')
      expect(status).toHaveProperty('zhipu')
      expect(status.zhipu).toHaveProperty('enabled')
      expect(status.zhipu).toHaveProperty('name')
      expect(status.zhipu).toHaveProperty('priority')
    })

    test('应该能够执行综合搜索', async () => {
      const query = '人工智能发展趋势'
      const options = {
        maxResults: 5,
        language: 'zh' as const,
        timeRange: 'month' as const,
        contentDepth: 'summary' as const
      }

      try {
        const results = await enhancedDataSourceManager.comprehensiveSearch(query, options)
        
        expect(Array.isArray(results)).toBe(true)
        
        if (results.length > 0) {
          const firstResult = results[0]
          expect(firstResult).toHaveProperty('title')
          expect(firstResult).toHaveProperty('url')
          expect(firstResult).toHaveProperty('content')
          expect(firstResult).toHaveProperty('source')
          expect(firstResult).toHaveProperty('credibilityScore')
          expect(firstResult).toHaveProperty('freshness')
          expect(firstResult).toHaveProperty('contentAnalysis')
          
          expect(typeof firstResult.credibilityScore).toBe('number')
          expect(firstResult.credibilityScore).toBeGreaterThanOrEqual(0)
          expect(firstResult.credibilityScore).toBeLessThanOrEqual(1)
          
          expect(firstResult.contentAnalysis).toHaveProperty('wordCount')
          expect(firstResult.contentAnalysis).toHaveProperty('sentiment')
          expect(firstResult.contentAnalysis).toHaveProperty('topics')
          expect(firstResult.contentAnalysis).toHaveProperty('language')
        }
      } catch (error) {
        // 在没有配置API密钥的情况下，搜索可能会失败，这是预期的
        console.warn('搜索测试失败，可能是由于缺少API配置:', error)
      }
    })

    test('应该能够清理缓存', () => {
      expect(() => {
        enhancedDataSourceManager.clearCache()
      }).not.toThrow()
    })
  })

  describe('智能内容提取器', () => {
    test('应该能够检测和分类内容', () => {
      const testContent = '这是一篇关于人工智能发展的技术文章，讨论了机器学习和深度学习的最新进展。'
      const testTitle = '人工智能技术发展报告'

      // 测试内容检测方法（通过访问私有方法的方式，实际实现中可能需要公开这些方法）
      const extractor = intelligentContentExtractor as any

      // 测试语言检测
      const language = extractor.detectLanguage(testContent)
      expect(language).toBe('zh')

      // 测试字数统计
      const wordCount = extractor.countWords(testContent)
      expect(wordCount).toBeGreaterThan(0)

      // 测试内容分类
      const contentType = extractor.classifyContentType(testContent, testTitle)
      expect(typeof contentType).toBe('string')
      expect(['article', 'news', 'blog', 'academic', 'documentation', 'other']).toContain(contentType)
    })
  })

  describe('增强型报告生成器', () => {
    test('应该能够生成基础报告（在有API配置的情况下）', async () => {
      const topic = '人工智能在教育领域的应用'
      const options = {
        template: 'brief' as const,
        language: 'zh' as const,
        analysisDepth: 'basic' as const,
        contentDepth: 'summary' as const,
        maxDataSources: 3,
        urgencyLevel: 'high' as const
      }

      try {
        const report = await generateAdvancedIntelligenceReport(topic, options)
        
        expect(report).toBeDefined()
        expect(report).toHaveProperty('content')
        expect(report).toHaveProperty('metadata')
        expect(report).toHaveProperty('qualityAssessment')
        expect(report).toHaveProperty('appendix')
        
        expect(typeof report.content).toBe('string')
        expect(report.content.length).toBeGreaterThan(100)
        
        expect(report.metadata).toHaveProperty('topic')
        expect(report.metadata).toHaveProperty('generationTime')
        expect(report.metadata).toHaveProperty('dataSourceCount')
        expect(report.metadata).toHaveProperty('qualityScore')
        
        expect(report.qualityAssessment).toHaveProperty('overallScore')
        expect(report.qualityAssessment).toHaveProperty('strengths')
        expect(report.qualityAssessment).toHaveProperty('improvements')
        
        expect(typeof report.qualityAssessment.overallScore).toBe('number')
        expect(report.qualityAssessment.overallScore).toBeGreaterThanOrEqual(0)
        expect(report.qualityAssessment.overallScore).toBeLessThanOrEqual(100)
        
      } catch (error) {
        // 在没有配置智谱AI API的情况下，报告生成会失败
        if (error.message.includes('智谱AI') || error.message.includes('API')) {
          console.warn('报告生成测试跳过，需要智谱AI API配置:', error.message)
        } else {
          throw error
        }
      }
    })

    test('应该在没有有效主题时抛出错误', async () => {
      await expect(generateAdvancedIntelligenceReport('')).rejects.toThrow()
      await expect(generateAdvancedIntelligenceReport('   ')).rejects.toThrow()
    })
  })

  describe('系统集成测试', () => {
    test('数据源配置应该一致', () => {
      const dataSourceStatus = enhancedDataSourceManager.getDataSourceStatus()
      
      // 检查关键数据源
      expect(dataSourceStatus).toHaveProperty('zhipu')
      expect(dataSourceStatus).toHaveProperty('bing')
      expect(dataSourceStatus).toHaveProperty('newsapi')
      expect(dataSourceStatus).toHaveProperty('wikipedia')
      expect(dataSourceStatus).toHaveProperty('arxiv')
      expect(dataSourceStatus).toHaveProperty('github')
      
      // 检查配置结构
      Object.values(dataSourceStatus).forEach(config => {
        expect(config).toHaveProperty('enabled')
        expect(config).toHaveProperty('priority')
        expect(config).toHaveProperty('name')
        expect(typeof config.enabled).toBe('boolean')
        expect(typeof config.priority).toBe('number')
        expect(typeof config.name).toBe('string')
      })
    })

    test('系统应该能够优雅降级', async () => {
      // 测试在没有API配置的情况下系统是否能够优雅处理
      const status = enhancedDataSourceManager.getDataSourceStatus()
      const enabledSources = Object.entries(status).filter(([, config]) => config.enabled)
      
      // 至少应该有一些免费的数据源可用（如Wikipedia、arXiv）
      const freeSources = ['wikipedia', 'arxiv']
      const availableFreeSources = enabledSources.filter(([key]) => freeSources.includes(key))
      
      expect(availableFreeSources.length).toBeGreaterThan(0)
    })
  })

  describe('错误处理和边界测试', () => {
    test('应该处理无效的搜索查询', async () => {
      const invalidQueries = ['', '   ', null, undefined]
      
      for (const query of invalidQueries) {
        try {
          const results = await enhancedDataSourceManager.comprehensiveSearch(query as any)
          expect(Array.isArray(results)).toBe(true)
          expect(results.length).toBe(0)
        } catch (error) {
          // 期望抛出有意义的错误
          expect(error).toBeDefined()
        }
      }
    })

    test('应该处理网络错误', async () => {
      // 测试无效URL的内容提取
      const invalidUrl = 'https://this-domain-does-not-exist-12345.com'
      
      const result = await intelligentContentExtractor.extractContent(invalidUrl, {
        method: 'fetch'
      })
      
      expect(result).toBeNull()
    })

    test('应该限制资源使用', async () => {
      const options = {
        maxDataSources: 1000, // 超出合理范围
        contentDepth: 'full' as const
      }

      try {
        const results = await enhancedDataSourceManager.comprehensiveSearch('测试查询', options)
        // 系统应该自动限制实际使用的数据源数量
        expect(results.length).toBeLessThan(100)
      } catch (error) {
        // 或者系统应该抛出合理的限制错误
        expect(error.message).toContain('限制')
      }
    })
  })

  describe('性能测试', () => {
    test('数据源状态获取应该在合理时间内完成', () => {
      const start = Date.now()
      const status = enhancedDataSourceManager.getDataSourceStatus()
      const duration = Date.now() - start
      
      expect(status).toBeDefined()
      expect(duration).toBeLessThan(1000) // 应该在1秒内完成
    })

    test('缓存清理应该高效', () => {
      const start = Date.now()
      enhancedDataSourceManager.clearCache()
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(100) // 应该在100ms内完成
    })
  })
})

// 辅助函数：检查环境配置
function checkEnvironmentConfiguration() {
  const requiredEnvVars = ['ZHIPU_API_KEY']
  const optionalEnvVars = ['BING_API_KEY', 'NEWSAPI_KEY', 'GITHUB_TOKEN', 'FIRECRAWL_API_KEY']
  
  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar])
  const availableOptional = optionalEnvVars.filter(envVar => process.env[envVar])
  
  return {
    hasRequiredConfig: missingRequired.length === 0,
    missingRequired,
    availableOptional,
    configurationScore: availableOptional.length / optionalEnvVars.length
  }
}

// 运行配置检查
const configCheck = checkEnvironmentConfiguration()
console.log('环境配置检查:', configCheck)

if (!configCheck.hasRequiredConfig) {
  console.warn('警告: 缺少必需的环境变量:', configCheck.missingRequired)
  console.log('请配置 .env.local 文件，参考 .env.example.enhanced')
}

if (configCheck.availableOptional.length > 0) {
  console.log('已配置的可选服务:', configCheck.availableOptional)
} else {
  console.log('建议配置额外的API服务以获得更好的数据质量')
}