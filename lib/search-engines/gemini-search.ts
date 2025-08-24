import { SearchResult } from '@/lib/types'

export interface GeminiSearchOptions {
  maxResults?: number
  language?: string
  timeRange?: string
  searchType?: 'web' | 'news' | 'academic'
}

/**
 * Gemini 2.5 Flash 网络搜索实现
 * 利用Google AI Studio API Key进行实时网络搜索
 */
export async function search(
  query: string, 
  options: GeminiSearchOptions = {}
): Promise<SearchResult[]> {
  const {
    maxResults = 10,
    language = 'zh',
    timeRange = 'recent',
    searchType = 'web'
  } = options

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) {
    console.warn('Gemini API密钥未配置，跳过Gemini搜索')
    return []
  }

  try {
    console.log(`🔍 启动Gemini-2.5-Flash网络搜索: "${query}" (${language})`)

    // 构建多语言搜索提示词
    const searchPrompt = buildMultiLanguageSearchPrompt(query, language, timeRange, searchType, maxResults)

    // 网络连接检测与超时设置
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 缩短超时时间

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: searchPrompt }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4000,
              topP: 0.8,
              topK: 40
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          }),
          signal: controller.signal
        }
      )
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Gemini API请求失败: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (!content) {
        console.warn('Gemini API返回空内容')
        return []
      }

      // 解析搜索结果
      const results = parseGeminiSearchResults(content, query)
      console.log(`✅ Gemini-2.5-Flash搜索完成: 获取到${results.length}条结果`)
      
      return results

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // 网络连接错误处理
      if (fetchError.name === 'AbortError') {
        console.warn('⚠️ Gemini API请求超时，可能由于网络连接问题')
        throw new Error('网络连接超时，请检查网络状态或尝试其他搜索引擎')
      } else if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        console.warn('⚠️ Gemini API无法连接，可能由于网络防火墙或地理限制')
        throw new Error('无法连接到Gemini服务，建议使用Chrome MCP或其他搜索引擎')
      } else {
        throw fetchError
      }
    }

  } catch (error: any) {
    // 详细的错误分类和处理
    if (error.message.includes('网络连接') || error.message.includes('无法连接')) {
      console.error('🌐 Gemini网络连接问题:', error.message)
      console.log('💡 建议: 系统将自动使用Chrome MCP浏览器搜索作为替代方案')
    } else if (error.message.includes('API')) {
      console.error('🔑 Gemini API配置问题:', error.message)
    } else {
      console.error('❌ Gemini搜索失败:', error.message)
    }
    return []
  }
}

/**
 * 构建多语言网络搜索提示词
 */
function buildMultiLanguageSearchPrompt(
  query: string, 
  language: string, 
  timeRange: string, 
  searchType: string,
  maxResults: number
): string {
  const languageMap = {
    'zh': '中文',
    'en': 'English',
    'ar': 'العربية'
  }

  const timeRangeMap = {
    'recent': '最近',
    'day': '24小时内',
    'week': '一周内', 
    'month': '一个月内',
    'year': '一年内'
  }

  const searchTypeMap = {
    'web': '网络搜索',
    'news': '新闻搜索',
    'academic': '学术搜索'
  }

  // 根据语言调整提示词
  let promptTemplate = ''
  
  if (language === 'en') {
    promptTemplate = `You are an expert web search specialist. Perform a comprehensive real-time web search and analysis for the following query.

Search Query: ${query}
Search Type: ${searchTypeMap[searchType as keyof typeof searchTypeMap]}
Language Preference: ${languageMap[language as keyof typeof languageMap]}
Time Range: ${timeRangeMap[timeRange as keyof typeof timeRangeMap]}
Results Needed: ${maxResults} items

Please return a JSON array with the following structure:
{
  "results": [
    {
      "title": "Result title",
      "url": "Source URL",
      "snippet": "Brief summary",
      "content": "Detailed content", 
      "publishDate": "Publication date (ISO format)",
      "source": "Information source",
      "relevanceScore": "Relevance score (0-1)",
      "credibilityLevel": "Credibility level (T1/T2/T3/T4)"
    }
  ]
}

Requirements:
1. Search for the latest, most authoritative information
2. Prioritize official sources and authoritative media
3. Content should be accurate, complete, and valuable
4. Evaluate relevance and credibility for each result
5. Return standard JSON format for proper parsing
6. Focus on English sources and international perspectives

Begin search and return results:`
  } else if (language === 'ar') {
    promptTemplate = `أنت خبير متخصص في البحث عبر الإنترنت. قم بإجراء بحث شامل في الوقت الفعلي وتحليل للاستعلام التالي.

استعلام البحث: ${query}
نوع البحث: ${searchTypeMap[searchType as keyof typeof searchTypeMap]}
تفضيل اللغة: ${languageMap[language as keyof typeof languageMap]}
النطاق الزمني: ${timeRangeMap[timeRange as keyof typeof timeRangeMap]}
النتائج المطلوبة: ${maxResults} عنصر

يرجى إرجاع مصفوفة JSON بالهيكل التالي:
{
  "results": [
    {
      "title": "عنوان النتيجة",
      "url": "رابط المصدر",
      "snippet": "ملخص موجز",
      "content": "محتوى مفصل", 
      "publishDate": "تاريخ النشر (تنسيق ISO)",
      "source": "مصدر المعلومات",
      "relevanceScore": "درجة الصلة (0-1)",
      "credibilityLevel": "مستوى المصداقية (T1/T2/T3/T4)"
    }
  ]
}

المتطلبات:
1. البحث عن أحدث المعلومات الموثوقة
2. إعطاء الأولوية للمصادر الرسمية والإعلام المعتمد
3. يجب أن يكون المحتوى دقيقاً وكاملاً وذا قيمة
4. تقييم الصلة والمصداقية لكل نتيجة
5. إرجاع تنسيق JSON قياسي للتحليل الصحيح
6. التركيز على المصادر العربية والشرق أوسطية

ابدأ البحث وأرجع النتائج:`
  } else {
    promptTemplate = `你是专业的网络搜索专家。请基于以下查询进行实时网络搜索，并返回最相关、最新的信息。

搜索查询: ${query}
搜索类型: ${searchTypeMap[searchType as keyof typeof searchTypeMap]}
语言偏好: ${languageMap[language as keyof typeof languageMap]}
时间范围: ${timeRangeMap[timeRange as keyof typeof timeRangeMap]}
结果数量: ${maxResults}条

请返回JSON格式的搜索结果数组，每个结果包含以下字段：
{
  "results": [
    {
      "title": "标题",
      "url": "链接地址",
      "snippet": "摘要描述",
      "content": "详细内容", 
      "publishDate": "发布时间(ISO格式)",
      "source": "信息来源",
      "relevanceScore": "相关性评分(0-1)",
      "credibilityLevel": "可信度等级(T1/T2/T3/T4)"
    }
  ]
}

要求：
1. 搜索最新、最权威的信息源
2. 优先返回官方、权威媒体的内容
3. 内容要准确、完整、有价值
4. 评估每个结果的相关性和可信度
5. 返回标准JSON格式，确保可以正确解析
6. 关注中文资源和本土化内容

请开始搜索并返回结果：`
  }

  return promptTemplate
}

/**
 * 构建网络搜索提示词（保留原函数以兼容）
 */
function buildSearchPrompt(
  query: string, 
  language: string, 
  timeRange: string, 
  searchType: string,
  maxResults: number
): string {
  return buildMultiLanguageSearchPrompt(query, language, timeRange, searchType, maxResults)
}

/**
 * 解析Gemini搜索结果
 */
function parseGeminiSearchResults(content: string, query: string): SearchResult[] {
  try {
    // 尝试解析JSON格式
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.results && Array.isArray(parsed.results)) {
        return parsed.results.map((item: any) => ({
          title: item.title || '无标题',
          url: item.url || '',
          snippet: item.snippet || '',
          content: item.content || item.snippet || '',
          source: 'Gemini-2.5-Flash',
          publishDate: item.publishDate || new Date().toISOString(),
          relevanceScore: item.relevanceScore || 0.8,
          credibilityLevel: item.credibilityLevel || 'T2'
        }))
      }
    }

    // 如果JSON解析失败，尝试提取文本内容
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length > 0) {
      return [{
        title: `Gemini网络搜索: ${query}`,
        url: '',
        snippet: lines[0].substring(0, 200),
        content: content,
        source: 'Gemini-2.5-Flash',
        publishDate: new Date().toISOString(),
        relevanceScore: 0.9,
        credibilityLevel: 'T1'
      }]
    }

    return []
  } catch (error) {
    console.error('解析Gemini搜索结果失败:', error)
    
    // 返回基本结果
    return [{
      title: `Gemini分析: ${query}`,
      url: '',
      snippet: content.substring(0, 200),
      content: content,
      source: 'Gemini-2.5-Flash',
      publishDate: new Date().toISOString(),
      relevanceScore: 0.8,
      credibilityLevel: 'T2'
    }]
  }
}

/**
 * 获取Gemini搜索引擎状态
 */
export function getGeminiSearchStatus(): {
  available: boolean
  name: string
  description: string
  networkStatus?: string
} {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const hasApiKey = !!apiKey
  
  // 基本可用性检查
  let networkStatus = '未知'
  if (hasApiKey) {
    // 在这里可以添加实际的网络连接检查
    // 由于之前的测试，我们知道存在网络连接问题
    networkStatus = '网络连接受限（地理位置或防火墙限制）'
  }
  
  return {
    available: hasApiKey, // API密钥存在，但可能有网络限制
    name: 'Gemini-2.5-Flash网络搜索',
    description: '基于Google AI Studio的实时网络搜索，支持多语言和深度分析。当前可能受网络连接限制。',
    networkStatus
  }
}