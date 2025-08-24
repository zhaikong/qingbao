'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  FileText, 
  Globe, 
  Database, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Clock,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  Target,
  Lightbulb,
  Download,
  Share2,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Square
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'search' | 'rss' | 'api' | 'database';
  description: string;
  status: 'available' | 'unavailable' | 'premium';
  icon: React.ReactNode;
  category: string;
}

interface GenerationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  duration?: number;
  result?: any;
}

export default function GenerateReportPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [analysisType, setAnalysisType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [reportId, setReportId] = useState<string | null>(null);

  // 数据源配置
  const dataSources: DataSource[] = [
    {
      id: 'zhipu-search',
      name: '智谱AI搜索',
      type: 'search',
      description: '使用智谱AI的在线搜索能力获取最新信息',
      status: 'available',
      icon: <Brain className="w-5 h-5" />,
      category: 'AI搜索'
    },
    {
      id: 'xinhua-rss',
      name: '新华网RSS',
      type: 'rss',
      description: '新华网最新新闻和资讯',
      status: 'available',
      icon: <Globe className="w-5 h-5" />,
      category: '新闻媒体'
    },
    {
      id: 'people-rss',
      name: '人民网RSS',
      type: 'rss',
      description: '人民网权威新闻报道',
      status: 'available',
      icon: <Globe className="w-5 h-5" />,
      category: '新闻媒体'
    },
    {
      id: 'bbc-rss',
      name: 'BBC新闻RSS',
      type: 'rss',
      description: 'BBC国际新闻和分析',
      status: 'available',
      icon: <Globe className="w-5 h-5" />,
      category: '国际媒体'
    },
    {
      id: 'cnn-rss',
      name: 'CNN新闻RSS',
      type: 'rss',
      description: 'CNN全球新闻报道',
      status: 'available',
      icon: <Globe className="w-5 h-5" />,
      category: '国际媒体'
    },
    {
      id: 'reuters-rss',
      name: '路透社RSS',
      type: 'rss',
      description: '路透社财经和国际新闻',
      status: 'available',
      icon: <TrendingUp className="w-5 h-5" />,
      category: '财经媒体'
    }
  ];

  // 生成步骤配置
  const initializeSteps = (): GenerationStep[] => [
    {
      id: 'data-collection',
      name: '数据收集',
      description: '从选定的数据源收集相关信息',
      status: 'pending',
      progress: 0
    },
    {
      id: 'data-processing',
      name: '数据处理',
      description: '清洗和预处理收集到的数据',
      status: 'pending',
      progress: 0
    },
    {
      id: 'analysis',
      name: '智能分析',
      description: '使用AI模型进行深度分析',
      status: 'pending',
      progress: 0
    },
    {
      id: 'report-generation',
      name: '报告生成',
      description: '生成结构化的情报报告',
      status: 'pending',
      progress: 0
    },
    {
      id: 'quality-check',
      name: '质量检查',
      description: '验证报告质量和准确性',
      status: 'pending',
      progress: 0
    }
  ];

  useEffect(() => {
    // 获取项目信息，根据模板类型设置默认的分析类型和智能预填充
    const getProjectTemplate = () => {
      try {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const project = projects.find((p: any) => p.id === params.id);
        
        if (project && project.template) {
          // 根据模板设置对应的分析类型和预填充信息
          switch(project.template) {
            case 'geopolitical':
              setAnalysisType('risk');
              setReportTitle(project.name || `地缘政治分析报告 - ${new Date().toLocaleDateString()}`);
              // 智能选择相关数据源
              setSelectedDataSources(['zhipu-search', 'xinhua-rss', 'bbc-rss', 'cnn-rss']);
              break;
            case 'economic':
              setAnalysisType('market');
              setReportTitle(project.name || `经济情报分析报告 - ${new Date().toLocaleDateString()}`);
              // 智能选择财经相关数据源
              setSelectedDataSources(['zhipu-search', 'reuters-rss', 'xinhua-rss']);
              break;
            case 'security':
              setAnalysisType('risk');
              setReportTitle(project.name || `安全威胁评估报告 - ${new Date().toLocaleDateString()}`);
              // 智能选择安全相关数据源
              setSelectedDataSources(['zhipu-search', 'bbc-rss', 'cnn-rss']);
              break;
            case 'technology':
              setAnalysisType('competitive');
              setReportTitle(project.name || `科技竞争分析报告 - ${new Date().toLocaleDateString()}`);
              // 智能选择科技相关数据源
              setSelectedDataSources(['zhipu-search', 'xinhua-rss', 'reuters-rss']);
              break;
            default:
              setAnalysisType('comprehensive');
              setReportTitle(project.name || `综合情报分析报告 - ${new Date().toLocaleDateString()}`);
              setSelectedDataSources(['zhipu-search']);
          }
          
          // 设置报告描述，优先使用项目描述
          if (project.description) {
            setReportDescription(project.description);
          } else {
            // 根据自定义字段生成描述
            const customFields = project.customFields || {};
            const fieldValues = Object.values(customFields).filter(Boolean);
            if (fieldValues.length > 0) {
              setReportDescription(`分析重点：${fieldValues.join('、')}`);
            }
          }
        } else {
          setAnalysisType('comprehensive');
          setReportTitle(`综合情报分析报告 - ${new Date().toLocaleDateString()}`);
          setSelectedDataSources(['zhipu-search']);
        }
      } catch (error) {
        console.error('获取项目模板失败:', error);
        setAnalysisType('comprehensive');
        setReportTitle(`综合情报分析报告 - ${new Date().toLocaleDateString()}`);
        setSelectedDataSources(['zhipu-search']);
      }
    };
    
    getProjectTemplate();
    setGenerationSteps(initializeSteps());
  }, [params.id]);

  const handleDataSourceToggle = (sourceId: string) => {
    setSelectedDataSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const simulateStepProgress = (stepIndex: number, onComplete: () => void) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setGenerationSteps(prev => prev.map((step, idx) => 
          idx === stepIndex 
            ? { ...step, status: 'completed', progress: 100 }
            : step
        ));
        onComplete();
      } else {
        setGenerationSteps(prev => prev.map((step, idx) => 
          idx === stepIndex 
            ? { ...step, status: 'running', progress: Math.round(progress) }
            : step
        ));
      }
    }, 500 + Math.random() * 1000);
  };

  const generateReport = async () => {
    if (!reportTitle.trim()) {
      toast({
        title: "错误",
        description: "请输入报告标题",
        variant: "destructive",
      });
      return;
    }

    if (selectedDataSources.length === 0) {
      toast({
        title: "错误",
        description: "请至少选择一个数据源",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);
    setGenerationSteps(initializeSteps());

    try {
      // 执行每个步骤
      for (let i = 0; i < generationSteps.length; i++) {
        setCurrentStep(i);
        await new Promise<void>((resolve) => {
          simulateStepProgress(i, resolve);
        });
        
        // 添加步骤间的延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 调用实际的报告生成API
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: `你是一名资深的情报分析专家和战略咨询顾问。请基于提供的数据生成专业的${analysisType === 'comprehensive' ? '综合分析' : analysisType === 'trend' ? '趋势分析' : analysisType === 'risk' ? '风险评估' : analysisType === 'competitive' ? '竞争分析' : '市场分析'}报告。`,
          userPrompt: `请针对"${reportTitle}"生成详细的情报分析报告。报告描述：${reportDescription}。请确保报告结构完整，分析深入，建议可行。`,
          topic: reportTitle,
          dataContext: `数据源：${selectedDataSources.join(', ')}，分析类型：${analysisType}`
        }),
      });

      if (!response.ok) {
        throw new Error('报告生成失败');
      }

      const result = await response.json();
      
      if (result.success && result.reportId) {
        setReportId(result.reportId);

        // 保存报告数据到localStorage
        const reportData = result.reportData || {
          id: result.reportId,
          projectId: params.id,
          title: reportTitle,
          content: result.content,
          topic: reportTitle,
          generatedAt: result.generatedAt,
          dataSourceCount: result.dataSourceCount,
          reportLength: result.reportLength,
          enhancedGeneration: result.enhancedGeneration,
          realDataSources: result.realDataSources,
          dataCollectionMethod: result.dataCollectionMethod,
          qualityMetrics: result.qualityMetrics
        };

        // 保存到localStorage
        localStorage.setItem(`report_${result.reportId}`, JSON.stringify(reportData));
        
        // 更新项目的报告列表
        const existingReports = JSON.parse(localStorage.getItem(`project_${params.id}_reports`) || '[]');
        const reportSummary = {
          id: result.reportId,
          title: reportTitle,
          generatedAt: result.generatedAt,
          dataSourceCount: result.dataSourceCount,
          reportLength: result.reportLength
        };
        
        if (!existingReports.find((r: any) => r.id === result.reportId)) {
          existingReports.push(reportSummary);
          localStorage.setItem(`project_${params.id}_reports`, JSON.stringify(existingReports));
        }

        console.log('✅ 报告数据已保存到localStorage:', result.reportId);

        toast({
          title: "成功",
          description: "报告生成完成！正在跳转...",
        });

        // 跳转到报告页面
        setTimeout(() => {
          router.push(`/projects/${params.id}/reports/${result.reportId}`);
        }, 2000);
      } else {
        throw new Error(result.error || '报告生成失败，未返回报告ID');
      }

    } catch (error) {
      console.error('报告生成错误:', error);
      toast({
        title: "错误",
        description: "报告生成失败，请重试",
        variant: "destructive",
      });
      
      // 标记当前步骤为错误
      setGenerationSteps(prev => prev.map((step, idx) => 
        idx === currentStep 
          ? { ...step, status: 'error' }
          : step
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepIcon = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const groupedDataSources = dataSources.reduce((acc, source) => {
    if (!acc[source.category]) {
      acc[source.category] = [];
    }
    acc[source.category].push(source);
    return acc;
  }, {} as Record<string, DataSource[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">智能报告生成</h1>
          <p className="text-gray-600">配置数据源和分析参数，生成专业的情报分析报告</p>
        </div>

        {!isGenerating ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧配置面板 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    报告基本信息
                  </CardTitle>
                  <CardDescription>
                    设置报告的标题和描述信息
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">报告标题</Label>
                    <Input
                      id="title"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="输入报告标题..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">报告描述</Label>
                    <Textarea
                      id="description"
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="描述报告的目标和范围..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 数据源选择 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    数据源配置
                  </CardTitle>
                  <CardDescription>
                    选择用于收集信息的数据源
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">全部</TabsTrigger>
                      <TabsTrigger value="ai">AI搜索</TabsTrigger>
                      <TabsTrigger value="news">新闻媒体</TabsTrigger>
                      <TabsTrigger value="international">国际媒体</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-4">
                      <div className="space-y-4">
                        {Object.entries(groupedDataSources).map(([category, sources]) => (
                          <div key={category}>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {sources.map((source) => (
                                <div
                                  key={source.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                    selectedDataSources.includes(source.id)
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => handleDataSourceToggle(source.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                      {source.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-medium text-sm">{source.name}</h5>
                                        <Badge 
                                          variant={source.status === 'available' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {source.status === 'available' ? '可用' : '不可用'}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1">{source.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupedDataSources['AI搜索']?.map((source) => (
                          <div
                            key={source.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedDataSources.includes(source.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleDataSourceToggle(source.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {source.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-sm">{source.name}</h5>
                                  <Badge variant="default" className="text-xs">可用</Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{source.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="news" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupedDataSources['新闻媒体']?.map((source) => (
                          <div
                            key={source.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedDataSources.includes(source.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleDataSourceToggle(source.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {source.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-sm">{source.name}</h5>
                                  <Badge variant="default" className="text-xs">可用</Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{source.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="international" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupedDataSources['国际媒体']?.map((source) => (
                          <div
                            key={source.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedDataSources.includes(source.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleDataSourceToggle(source.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {source.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-sm">{source.name}</h5>
                                  <Badge variant="default" className="text-xs">可用</Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{source.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* 分析配置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    分析配置
                  </CardTitle>
                  <CardDescription>
                    选择分析类型和参数
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="analysis-type">分析类型</Label>
                      <Select value={analysisType} onValueChange={setAnalysisType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="选择分析类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comprehensive">综合分析</SelectItem>
                          <SelectItem value="trend">趋势分析</SelectItem>
                          <SelectItem value="risk">风险评估</SelectItem>
                          <SelectItem value="competitive">竞争分析</SelectItem>
                          <SelectItem value="market">市场分析</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧预览面板 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    配置预览
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">报告标题</h4>
                    <p className="text-sm text-gray-600">
                      {reportTitle || '未设置'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">已选数据源</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedDataSources.length > 0 ? (
                        selectedDataSources.map(sourceId => {
                          const source = dataSources.find(s => s.id === sourceId);
                          return source ? (
                            <Badge key={sourceId} variant="secondary" className="text-xs">
                              {source.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <p className="text-sm text-gray-500">未选择数据源</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">分析类型</h4>
                    <Badge variant="outline" className="text-xs">
                      {analysisType === 'comprehensive' && '综合分析'}
                      {analysisType === 'trend' && '趋势分析'}
                      {analysisType === 'risk' && '风险评估'}
                      {analysisType === 'competitive' && '竞争分析'}
                      {analysisType === 'market' && '市场分析'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    生成建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p>建议选择多个数据源以获得更全面的信息</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p>智谱AI搜索能提供最新的在线信息</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p>RSS源提供权威媒体的实时资讯</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button 
                  onClick={generateReport}
                  className="w-full"
                  size="lg"
                  disabled={!reportTitle.trim() || selectedDataSources.length === 0}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  开始生成报告
                </Button>
                
                <Button 
                  onClick={() => {
                    // 一键快速生成，使用默认配置
                    if (reportTitle.trim()) {
                      generateReport();
                    } else {
                      toast({
                        title: "提示",
                        description: "请先确认报告标题",
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={!reportTitle.trim() || isGenerating}
                >
                  <Play className="w-4 h-4 mr-2" />
                  一键快速生成
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* 生成进度面板 */
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  正在生成报告...
                </CardTitle>
                <CardDescription>
                  请稍候，系统正在处理您的请求
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {generationSteps.map((step, index) => (
                  <div key={step.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStepIcon(step)}
                        <div>
                          <h4 className="font-medium text-sm">{step.name}</h4>
                          <p className="text-xs text-gray-600">{step.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {step.progress}%
                        </div>
                      </div>
                    </div>
                    <Progress value={step.progress} className="h-2" />
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      当前步骤: {generationSteps[currentStep]?.name}
                    </span>
                    <span className="font-medium">
                      {currentStep + 1} / {generationSteps.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}