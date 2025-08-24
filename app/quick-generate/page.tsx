'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Globe, 
  TrendingUp, 
  Shield, 
  Target,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

const QUICK_TEMPLATES = [
  {
    id: 'geopolitical',
    name: '地缘政治分析',
    description: '分析特定地区的政治稳定性、冲突风险和战略影响',
    icon: Globe,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    defaultSources: ['zhipu-search', 'xinhua-rss', 'bbc-rss', 'cnn-rss'],
    analysisType: 'risk'
  },
  {
    id: 'economic',
    name: '经济情报分析',
    description: '评估经济趋势、市场风险和投资机会',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    defaultSources: ['zhipu-search', 'reuters-rss', 'xinhua-rss'],
    analysisType: 'market'
  },
  {
    id: 'security',
    name: '安全威胁评估',
    description: '识别和评估各类安全威胁及其影响',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    defaultSources: ['zhipu-search', 'bbc-rss', 'cnn-rss'],
    analysisType: 'risk'
  }
];

export default function QuickGeneratePage() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = QUICK_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setReportTitle(`${template.name} - ${new Date().toLocaleDateString()}`);
      setReportDescription(template.description);
    }
  };

  const handleQuickGenerate = async () => {
    if (!selectedTemplate || !reportTitle.trim()) {
      toast({
        title: "请完善信息",
        description: "请选择模板并输入报告标题",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // 创建项目
      const projectId = `quick-${Date.now()}`;
      const template = QUICK_TEMPLATES.find(t => t.id === selectedTemplate)!;
      
      const projectData = {
        id: projectId,
        name: reportTitle,
        description: reportDescription,
        template: selectedTemplate,
        createdAt: new Date().toISOString(),
        status: 'active',
        isQuickGenerate: true
      };

      // 保存项目到localStorage
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      existingProjects.push(projectData);
      localStorage.setItem('projects', JSON.stringify(existingProjects));

      // 直接调用报告生成API
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: `你是一名资深的情报分析专家和战略咨询顾问。请基于提供的数据生成专业的${template.name}报告。`,
          userPrompt: `请针对"${reportTitle}"生成详细的情报分析报告。报告描述：${reportDescription}。请确保报告结构完整，分析深入，建议可行。`,
          topic: reportTitle,
          template: template.analysisType,
          dataContext: `数据源：${template.defaultSources.join(', ')}，分析类型：${template.analysisType}`
        }),
      });

      if (!response.ok) {
        throw new Error('报告生成失败');
      }

      const result = await response.json();
      
      if (result.success && result.reportId) {
        // 保存报告数据
        const reportData = {
          id: result.reportId,
          projectId: projectId,
          title: reportTitle,
          content: result.content,
          topic: reportTitle,
          generatedAt: result.generatedAt,
          dataSourceCount: result.dataSourceCount,
          reportLength: result.reportLength,
          template: selectedTemplate
        };

        localStorage.setItem(`report_${result.reportId}`, JSON.stringify(reportData));
        
        // 更新项目的报告列表
        const reportSummary = {
          id: result.reportId,
          title: reportTitle,
          generatedAt: result.generatedAt,
          dataSourceCount: result.dataSourceCount,
          reportLength: result.reportLength
        };
        
        localStorage.setItem(`project_${projectId}_reports`, JSON.stringify([reportSummary]));

        toast({
          title: "生成成功！",
          description: "报告已生成完成，正在跳转...",
        });

        // 跳转到报告页面
        setTimeout(() => {
          router.push(`/projects/${projectId}/reports/${result.reportId}`);
        }, 1500);
      } else {
        throw new Error(result.error || '报告生成失败');
      }

    } catch (error: any) {
      console.error('快速生成失败:', error);
      toast({
        title: "生成失败",
        description: error.message || "请重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTemplateData = QUICK_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回仪表板
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">快速生成报告</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isGenerating ? (
          <div className="space-y-8">
            {/* 介绍 */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  一键智能生成专业报告
                </CardTitle>
                <CardDescription>
                  选择模板，输入主题，AI自动生成高质量情报分析报告
                </CardDescription>
              </CardHeader>
            </Card>

            {/* 模板选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  选择分析模板
                </CardTitle>
                <CardDescription>
                  根据您的需求选择合适的分析模板
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {QUICK_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <div
                        key={template.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <div className="text-center">
                          <div className={`inline-flex p-3 rounded-lg ${template.bgColor} mb-3`}>
                            <Icon className={`h-6 w-6 ${template.color}`} />
                          </div>
                          <h3 className="font-medium text-gray-900 mb-2">{template.name}</h3>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 报告信息 */}
            <Card>
              <CardHeader>
                <CardTitle>报告信息</CardTitle>
                <CardDescription>
                  填写报告的基本信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    报告标题 *
                  </label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="例如：中美AI领域最新政策对比分析"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    报告描述
                  </label>
                  <Textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="简要描述分析重点和目标..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 配置预览 */}
            {selectedTemplateData && (
              <Card>
                <CardHeader>
                  <CardTitle>生成配置预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">选择的模板</h4>
                      <div className="flex items-center gap-2">
                        <selectedTemplateData.icon className={`h-4 w-4 ${selectedTemplateData.color}`} />
                        <span className="text-sm">{selectedTemplateData.name}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">分析类型</h4>
                      <span className="text-sm text-gray-600">
                        {selectedTemplateData.analysisType === 'risk' ? '风险评估' : 
                         selectedTemplateData.analysisType === 'market' ? '市场分析' : '综合分析'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">数据源</h4>
                      <span className="text-sm text-gray-600">
                        {selectedTemplateData.defaultSources.length} 个智能选择的数据源
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">预计时间</h4>
                      <span className="text-sm text-gray-600">2-3 分钟</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 生成按钮 */}
            <div className="flex justify-center">
              <Button
                onClick={handleQuickGenerate}
                size="lg"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={!selectedTemplate || !reportTitle.trim()}
              >
                <Zap className="h-5 w-5 mr-2" />
                立即生成报告
              </Button>
            </div>
          </div>
        ) : (
          /* 生成中状态 */
          <div className="text-center py-16">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI正在生成您的报告</h3>
                    <p className="text-gray-600">正在收集数据并进行智能分析，请稍候...</p>
                  </div>
                  <div className="w-full max-w-md">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}