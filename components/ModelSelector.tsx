"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  Cloud, 
  Server, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Cpu,
  Globe,
  Shield,
  Sparkles,
  Activity,
  Star
} from 'lucide-react'

interface ModelInfo {
  id: string
  name: string
  provider: string
  type: 'local' | 'cloud'
  status: 'available' | 'unavailable' | 'loading'
  description: string
  capabilities: string[]
  specs: {
    parameters: string
    memory: string
    speed: number
    quality: number
  }
  tags: string[]
  recommended?: boolean
}

const MODELS: ModelInfo[] = [
  {
    id: 'qwen2-8b',
    name: 'Qwen2 8B',
    provider: 'Ollama服务',
    type: 'local',
    status: 'available',
    description: '阿里巴巴开源的中文大语言模型，擅长中文理解和生成，适合情报分析和报告生成',
    capabilities: ['中文理解', '文本生成', '对话交互', '知识问答'],
    specs: {
      parameters: '8.19B',
      memory: '0.7GB',
      speed: 8.5,
      quality: 8.2
    },
    tags: ['中文优化', '本地部署', '开源'],
    recommended: true
  },
  {
    id: 'gemma2-12b',
    name: 'Gemma2 12B',
    provider: 'Ollama服务',
    type: 'local',
    status: 'available',
    description: 'Google开源的高性能语言模型，具备强大的推理能力，适合复杂分析任务',
    capabilities: ['逻辑推理', '代码生成', '数学计算', '多语言支持'],
    specs: {
      parameters: '12B',
      memory: '0.7GB',
      speed: 7.8,
      quality: 8.9
    },
    tags: ['逻辑推理', '代码生成', '数学计算']
  }
]

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void
  selectedModel?: string
}

export default function ModelSelector({ onModelSelect, selectedModel }: ModelSelectorProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local')

  const localModels = MODELS.filter(model => model.type === 'local')
  const cloudModels = MODELS.filter(model => model.type === 'cloud')

  const renderModelCard = (model: ModelInfo) => (
    <Card 
      key={model.id} 
      className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 group ${
        selectedModel === model.id 
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50'
      } ${model.recommended ? 'ring-2 ring-orange-200 shadow-md' : ''}`}
      onClick={() => onModelSelect(model.id)}
    >
      {model.recommended && (
        <div className="absolute -top-3 -right-3 z-10">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
            <Sparkles className="w-3 h-3 mr-1" />
            当前选择的模型
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 ${
              model.type === 'local' 
                ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700' 
                : 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700'
            }`}>
              {model.type === 'local' ? <Server className="w-6 h-6" /> : <Cloud className="w-6 h-6" />}
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                {model.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 font-medium">
                {model.provider}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {model.status === 'available' && (
              <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-xs font-bold">运行中</span>
              </div>
            )}
            {model.status === 'unavailable' && (
              <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-xs font-bold">不可用</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm text-gray-700 leading-relaxed font-medium">{model.description}</p>
        
        {/* 性能指标 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Activity className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-xs font-bold text-blue-800">响应速度</span>
              </div>
              <span className="text-sm font-bold text-blue-900">{model.specs.speed}/10</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 shadow-sm" 
                style={{ width: `${model.specs.speed * 10}%` }}
              />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-xs font-bold text-green-800">输出质量</span>
              </div>
              <span className="text-sm font-bold text-green-900">{model.specs.quality}/10</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 shadow-sm" 
                style={{ width: `${model.specs.quality * 10}%` }}
              />
            </div>
          </div>
        </div>

        {/* 规格信息 */}
        <div className="flex items-center justify-between text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center font-medium">
            <Cpu className="w-4 h-4 mr-2 text-gray-600" />
            <span>参数量: {model.specs.parameters}</span>
          </div>
          <div className="flex items-center font-medium">
            <Brain className="w-4 h-4 mr-2 text-gray-600" />
            <span>内存: {model.specs.memory}</span>
          </div>
        </div>

        {/* 能力标签 */}
        <div>
          <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">核心能力</h4>
          <div className="flex flex-wrap gap-2">
            {model.capabilities.map((capability, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-3 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors font-medium">
                {capability}
              </Badge>
            ))}
          </div>
        </div>

        {/* 特性标签 */}
        <div>
          <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">特性标签</h4>
          <div className="flex flex-wrap gap-2">
            {model.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-3 py-1.5 border-2 border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-full mb-6 shadow-lg">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">AI模型配置中心</h2>
        <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
          选择最适合您需求的AI模型 - 支持本地部署和云端服务
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'local' | 'cloud')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-10 bg-gray-100 p-1.5 rounded-xl shadow-inner">
          <TabsTrigger 
            value="local" 
            className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg py-3 px-6 font-bold transition-all duration-300"
          >
            <Server className="w-5 h-5" />
            <span>本地模型</span>
          </TabsTrigger>
          <TabsTrigger 
            value="cloud" 
            className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg py-3 px-6 font-bold transition-all duration-300"
          >
            <Cloud className="w-5 h-5" />
            <span>云端模型</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {localModels.map(renderModelCard)}
          </div>
          
          {localModels.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
              <Server className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">暂无可用的本地模型</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">请先安装并配置本地AI模型以开始使用情报分析功能</p>
              <Button variant="outline" className="px-6 py-3">
                <Globe className="w-4 h-4 mr-2" />
                查看安装指南
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cloud" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {cloudModels.map(renderModelCard)}
          </div>
          
          {cloudModels.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-2 border-dashed border-purple-300">
              <Cloud className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">云端模型配置</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">配置您的云端AI服务以获得更强大的分析能力和更快的响应速度</p>
              <Button variant="outline" className="px-6 py-3">
                <Shield className="w-4 h-4 mr-2" />
                配置API密钥
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedModel && (
        <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-lg">
          <div className="flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-blue-600 mr-3" />
            <span className="text-blue-900 font-bold text-lg">
              已选择模型: {MODELS.find(m => m.id === selectedModel)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}