import jwt from 'jsonwebtoken';
import https from 'https';
import { SearchResult, Engine } from '@/lib/types';
import { ZhipuModelSelector, ZhipuRequestBuilder } from '@/lib/zhipu-model-config';

// 从环境变量中获取API密钥
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;

if (!ZHIPU_API_KEY) {
  console.warn('⚠️ 未找到 ZHIPU_API_KEY 环境变量，智谱搜索将不可用。');
}

export interface ZhipuSearchOptions {
  maxResults?: number
  language?: string
  timeRange?: string
  searchType?: 'web' | 'news' | 'academic'
  useAIEnhancement?: boolean
  model?: 'glm-4.5-air' | 'glm-4.5v' | 'glm-4.1v-thinking-flashx'
}

// 生成JWT
function generateToken(apiKey: string): string {
  const [id, secret] = apiKey.split('.');
  
  // 验证密钥格式
  if (!id || !secret) {
    throw new Error(`无效的智谱API密钥格式: ${apiKey.substring(0, 20)}...`)
  }
  
  console.log(`🔑 智谱AI密钥检查: ID=${id.substring(0, 10)}..., Secret长度=${secret.length}`)
  
  const payload = {
    api_key: id,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
    timestamp: Math.floor(Date.now() / 1000), // 使用秒级时间戳
  };
  
  try {
    return jwt.sign(payload, secret, { 
      algorithm: 'HS256',
      header: {
        alg: 'HS256',
        sign_type: 'SIGN'
      }
    });
  } catch (error: any) {
    console.error('JWT签名失败:', error.message)
    throw new Error(`JWT签名失败: ${error.message}`)
  }
}

/**
 * GLM-4.5智能关键词生成和搜索策略
 */
async function generateIntelligentSearchStrategy(
  query: string, 
  options: ZhipuSearchOptions
): Promise<{
  enhancedQueries: string[]
  searchStrategy: string
  language: string
}> {
  if (!ZHIPU_API_KEY || !options.useAIEnhancement) {
    return {
      enhancedQueries: [query],
      searchStrategy: '基础搜索',
      language: options.language || 'zh'
    }
  }

  try {
    console.log(`🧠 启动GLM-4.5智能关键词专家分析: "${query}"`)
    
    // 选择最适合关键词生成的模型
    const model = ZhipuModelSelector.selectByTask('keyword_generation')
    console.log(`🎯 选择模型: ${model.name} (${model.modelId})`)
    
    const token = generateToken(ZHIPU_API_KEY)
    
    // 构建智能关键词生成提示词
    const promptTemplate = `你是专业的情报搜索关键词专家。请基于以下查询生成最优的搜索关键词策略。

原始查询: ${query}
搜索类型: ${options.searchType || 'web'}
目标语言: ${options.language || '中文'}
时间范围: ${options.timeRange || '最近'}

请返回JSON格式的结果：
{
  "enhancedQueries": [
    "优化后的关键词1",
    "优化后的关键词2", 
    "优化后的关键词3",
    "多语言关键词1",
    "多语言关键词2"
  ],
  "searchStrategy": "搜索策略说明",
  "targetLanguage": "目标语言",
  "rationale": "关键词选择理由"
}

要求:
1. 生成5个高质量的搜索关键词
2. 包含同义词、相关词、专业术语
3. 考虑不同角度和深度的搜索需求
4. 如果需要，包含英文关键词以获取国际视角
5. 返回标准JSON格式`

    const requestData = ZhipuRequestBuilder.buildChatRequest(
      model,
      [{ role: 'user', content: promptTemplate }],
      { 
        temperature: 0.3,
        maxTokens: 1000,
        enableThinking: true 
      }
    )

    const response = await callZhipuAPI('/api/paas/v4/chat/completions', requestData, token)
    
    if (response.choices?.[0]?.message?.content) {
      const content = response.choices[0].message.content
      console.log(`📄 GLM-4.5响应长度: ${content.length}`)
      
      // 尝试解析JSON结果
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        console.log(`✅ GLM-4.5关键词生成成功: ${parsed.enhancedQueries?.length || 0}个关键词`)
        
        return {
          enhancedQueries: parsed.enhancedQueries || [query],
          searchStrategy: parsed.searchStrategy || '智能优化搜索',
          language: parsed.targetLanguage || options.language || 'zh'
        }
      }
    }
    
    console.warn('⚠️ GLM-4.5关键词生成失败，使用基础搜索')
    return {
      enhancedQueries: [query],
      searchStrategy: '基础搜索（AI增强失败）',
      language: options.language || 'zh'
    }
    
  } catch (error: any) {
    console.error('❌ GLM-4.5关键词生成错误:', error.message)
    return {
      enhancedQueries: [query],
      searchStrategy: '基础搜索（AI增强错误）',
      language: options.language || 'zh'
    }
  }
}

/**
 * 通用智谱API调用函数
 */
async function callZhipuAPI(endpoint: string, data: any, token: string): Promise<any> {
  const requestData = JSON.stringify(data)
  
  const options = {
    hostname: 'open.bigmodel.cn',
    port: 443,
    path: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(requestData),
      'User-Agent': 'IntelligencePlatform/2.0-GLM4.5'
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => (responseData += chunk))
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData)
          if (response.error) {
            console.error('智谱API错误:', response.error.message)
            reject(new Error(response.error.message))
            return
          }
          resolve(response)
        } catch (error) {
          console.error('解析智谱响应失败:', error)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      console.error('请求智谱API失败:', error)
      reject(error)
    })

    req.setTimeout(30000, () => {
      console.error('智谱API请求超时')
      req.destroy()
      reject(new Error('请求超时'))
    })

    req.write(requestData)
    req.end()
  })
}

/**
 * 增强型智谱搜索主函数
 */
export async function search(
  query: string, 
  options: ZhipuSearchOptions = {}
): Promise<SearchResult[]> {
  if (!ZHIPU_API_KEY) {
    console.warn('智谱API密钥未配置，跳过智谱搜索')
    return []
  }

  const {
    maxResults = 10,
    useAIEnhancement = true,
    searchType = 'web'
  } = options

  try {
    console.log(`🔍 启动智谱AI增强搜索: "${query}"`)
    
    const token = generateToken(ZHIPU_API_KEY)
    
    // 1. 智能关键词生成（如果启用AI增强）
    const strategy = await generateIntelligentSearchStrategy(query, options)
    console.log(`🎯 搜索策略: ${strategy.searchStrategy}`)
    console.log(`🔑 增强关键词: ${strategy.enhancedQueries.join(', ')}`)
    
    // 2. 执行所有关键词的搜索
    const allResults: SearchResult[] = []
    
    for (const enhancedQuery of strategy.enhancedQueries.slice(0, 3)) { // 限制前3个关键词
      try {
        console.log(`🔍 搜索关键词: "${enhancedQuery}"`)
        
        const requestData = {
          search_engine: 'search_pro',
          search_query: enhancedQuery,
          count: Math.ceil(maxResults / strategy.enhancedQueries.length),
        }

        const response = await callZhipuAPI('/api/paas/v4/web_search', requestData, token)
        
        if (response.search_result && Array.isArray(response.search_result)) {
          const results: SearchResult[] = response.search_result.map((item: any) => ({
            title: item.title || '无标题',
            url: item.link || '',
            content: item.content || '',
            snippet: item.content?.substring(0, 200) || '',
            source: 'zhipu-glm4.5' as Engine,
            publishDate: item.publish_date || new Date().toISOString(),
            relevanceScore: 0.8,
            credibilityLevel: 'T2',
            metadata: {
              searchQuery: enhancedQuery,
              model: 'GLM-4.5-Enhanced',
              strategy: strategy.searchStrategy
            }
          }))
          
          allResults.push(...results)
          console.log(`✅ 关键词"${enhancedQuery}"获取到${results.length}条结果`)
        }
        
        // 避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error: any) {
        console.warn(`⚠️ 关键词"${enhancedQuery}"搜索失败:`, error.message)
      }
    }
    
    // 3. 结果去重和排序
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.url, item])).values()
    ).slice(0, maxResults)
    
    console.log(`✅ 智谱AI增强搜索完成: 总计${uniqueResults.length}条有效结果`)
    return uniqueResults
    
  } catch (error: any) {
    console.error('❌ 智谱搜索失败:', error.message)
    return []
  }
}

/**
 * 获取智谱搜索引擎状态
 */
export function getZhipuSearchStatus(): {
  available: boolean
  name: string
  description: string
  models: string[]
} {
  const hasApiKey = !!ZHIPU_API_KEY
  return {
    available: hasApiKey,
    name: '智谱AI GLM-4.5增强搜索',
    description: '基于GLM-4.5系列模型的智能关键词生成和多策略搜索引擎',
    models: ['GLM-4.5-Air', 'GLM-4.5V', 'GLM-4.1V-Thinking-FlashX']
  }
}