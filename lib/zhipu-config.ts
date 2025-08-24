import OpenAI from 'openai'

// 智谱AI配置
export const zhipuAI = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY || 'd61a043155304f148dbbb3729528e905.MFJKfQfxWwbkQKz3',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
})

// 修正的模型配置 - 使用正确的模型名称
export const ZHIPU_MODELS = {
  'glm-4-plus': 'glm-4-plus',           // 使用稳定的GLM-4-Plus
  'glm-4v-plus': 'glm-4v-plus',         // 使用稳定的GLM-4V-Plus
  'glm-4-flash': 'glm-4-flash',         // 使用稳定的GLM-4-Flash
  'glm-4': 'glm-4',                     // 基础模型
  'glm-4v': 'glm-4v'                    // 基础视觉模型
}

// 智能模型选择 - 使用稳定可用的模型
export function selectOptimalModel(task: 'analysis' | 'vision' | 'speed' | 'comprehensive'): string {
  switch (task) {
    case 'vision':
      return ZHIPU_MODELS['glm-4v-plus']  // 使用稳定的视觉模型
    case 'speed':
      return ZHIPU_MODELS['glm-4-flash']  // 使用快速模型
    case 'comprehensive':
      return ZHIPU_MODELS['glm-4-plus']   // 使用增强模型
    default:
      return ZHIPU_MODELS['glm-4']        // 使用基础稳定模型
  }
}

export default zhipuAI