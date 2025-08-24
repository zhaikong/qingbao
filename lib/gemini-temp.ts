// 临时修复Gemini方法
export function analyzeWithGemini25Flash(content: string, analysisType: string = 'quick'): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.error('Gemini API request timed out after 120 seconds.')
    }, 120000) // 120秒超时

    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('Gemini API密钥未配置')
      }

      const prompt = getGeminiAnalysisPrompt(analysisType, content)
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        signal: controller.signal, // 添加中止信号
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000, // 增加输出token以处理更复杂的报告
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HATE_SPEECH", 
              threshold: "BLOCK_NONE"
            },
            {
              category: "SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      })

      clearTimeout(timeoutId) // 成功后清除超时

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('Gemini API Error:', errorBody)
        throw new Error(`Gemini-2.5-Flash API请求失败: ${response.status} - ${errorBody}`)
      }

      const data = await response.json()
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '分析失败'
      
      resolve({
        analysis: analysisText,
        model: 'Gemini-2.5-Flash',
        timestamp: new Date().toISOString(),
        usage: data.usageMetadata || {},
        speed: 'ultra-fast',
        capability: '多模态智能分析',
        source: 'Google Gemini'
      })
    } catch (error: any) {
      clearTimeout(timeoutId) // 出错后也要清除超时
      if (error.name === 'AbortError') {
        console.error('Gemini-2.5-Flash分析超时')
        reject(new Error('Gemini-2.5-Flash analysis timed out after 120 seconds'))
      } else {
        console.error('Gemini-2.5-Flash分析错误:', error)
        reject(error)
      }
    }
  })
}

function getGeminiAnalysisPrompt(analysisType: string, content: string): string {
  const basePrompt = `你是一个专业的情报分析专家，请对以下内容进行深度分析：\n\n${content}\n\n`
  
  switch (analysisType) {
    case 'web_search':
      return basePrompt + `请重点关注：
1. 关键信息提取和总结
2. 情报价值和重要性评估
3. 可信度分析
4. 相关性和背景信息
5. 行动建议和下一步研究方向

请以结构化方式提供分析结果，包括关键发现、风险评估和建议措施。`
    
    case 'realtime':
      return basePrompt + `请提供实时情报分析：
1. 当前态势评估
2. 紧急程度判断
3. 影响范围分析
4. 应对建议
5. 发展趋势预测

要求分析简洁准确，突出重点。`
    
    case 'summary':
      return basePrompt + `请提供情报摘要：
1. 核心内容概括
2. 关键要点提炼
3. 价值评估
4. 可信度评级
5. 建议分类标签

要求内容精炼，信息密度高。`
    
    default: // quick
      return basePrompt + `请进行快速情报分析：
1. 关键信息提取
2. 重要性评估
3. 可信度判断
4. 简要总结

要求快速准确，突出重点信息。`
  }
}