"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { SearchResult, Engine } from '@/lib/types';
import { 
  FileText, 
  Zap, 
  Target, 
  ArrowRight,
  CheckCircle2,
  Search,
  TrendingUp,
  Shield,
  Globe
} from 'lucide-react';
import Link from 'next/link';

const availableEngines: { id: Engine; name: string }[] = [
  { id: 'zhipu', name: '智谱AI' },
  { id: 'duckduckgo', name: 'DuckDuckGo' },
  { id: 'searxng', name: 'SearXNG' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedEngines, setSelectedEngines] = useState<Engine[]>(['zhipu', 'duckduckgo']);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // 确保所有状态都正确初始化
  useEffect(() => {
    if (!results) {
      setResults([]);
    }
    if (!selectedEngines) {
      setSelectedEngines(['zhipu', 'duckduckgo']);
    }
  }, []);

  const handleSearch = async () => {
    if (!query || !query.trim()) {
      setError('查询内容不能为空');
      return;
    }
    if (!selectedEngines || selectedEngines.length === 0) {
      setError('请至少选择一个搜索引擎');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/unified-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), engines: selectedEngines }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '网络错误' }));
        throw new Error(errorData.error || '搜索失败');
      }

      const data = await response.json();
      // 处理API返回的数据结构
      if (data.items && Array.isArray(data.items)) {
        // 转换为前端期望的格式
        const convertedResults = data.items.map((item: any) => ({
          title: item.title,
          url: item.url,
          content: item.content,
          source: item.author || item.source?.name || '未知来源',
          publishDate: item.publishedAt,
          relevanceScore: item.metadata?.relevanceScore || 0.8
        }));
        setResults(convertedResults);
        // 搜索完成后显示报告生成选项
        if (convertedResults.length > 0) {
          setShowReportOptions(true);
        }
      } else if (data.results && Array.isArray(data.results)) {
        // 兼容旧格式
        setResults(data.results);
        if (data.results.length > 0) {
          setShowReportOptions(true);
        }
      } else {
        setResults([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误';
      setError(errorMessage);
      console.error('搜索错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEngineChange = (engineId: Engine) => {
    setSelectedEngines(prev => {
      if (!prev) return [engineId];
      return prev.includes(engineId)
        ? prev.filter(e => e !== engineId)
        : [...prev, engineId];
    });
  };

  const handleResultSelect = (index: number) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedResults(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(Array.from({ length: results.length }, (_, i) => i)));
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    if (selectedResults.size === 0) {
      toast({
        title: "请选择数据源",
        description: "请至少选择一个搜索结果作为报告的数据源",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    
    try {
      const selectedData = Array.from(selectedResults).map(index => results[index]);
      const projectId = `search-${Date.now()}`;
      const reportTitle = `${query} - 情报分析报告`;
      
      // 创建项目
      const projectData = {
        id: projectId,
        name: reportTitle,
        description: `基于搜索"${query}"的${selectedData.length}个数据源生成的情报分析报告`,
        template: reportType,
        createdAt: new Date().toISOString(),
        status: 'active',
        searchQuery: query,
        dataSourceCount: selectedData.length
      };

      // 保存项目到localStorage
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      existingProjects.push(projectData);
      localStorage.setItem('projects', JSON.stringify(existingProjects));

      // 构造报告生成的提示词
      const dataContext = selectedData.map((result, index) => 
        `数据源${index + 1}:
标题: ${result.title}
来源: ${result.source}
内容: ${result.content}
URL: ${result.url}${result.publishDate ? `
发布时间: ${result.publishDate}` : ''}
`
      ).join('\n---\n');

      const systemPrompt = getSystemPromptByType(reportType);
      const userPrompt = `请基于以下搜索结果，针对主题"${query}"生成详细的情报分析报告:\n\n${dataContext}\n\n请确保报告结构完整，分析深入，结论可信，建议可行。`;

      // 调用报告生成API
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          topic: query,
          template: reportType,
          dataContext: `基于${selectedData.length}个搜索结果生成报告`
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
          topic: query,
          generatedAt: result.generatedAt,
          dataSourceCount: selectedData.length,
          reportLength: result.reportLength,
          template: reportType,
          sourceData: selectedData
        };

        localStorage.setItem(`report_${result.reportId}`, JSON.stringify(reportData));
        
        // 更新项目的报告列表
        const reportSummary = {
          id: result.reportId,
          title: reportTitle,
          generatedAt: result.generatedAt,
          dataSourceCount: selectedData.length,
          reportLength: result.reportLength
        };
        
        localStorage.setItem(`project_${projectId}_reports`, JSON.stringify([reportSummary]));

        toast({
          title: "报告生成成功！",
          description: "正在跳转到报告页面...",
        });

        // 跳转到报告页面
        setTimeout(() => {
          router.push(`/projects/${projectId}/reports/${result.reportId}`);
        }, 1500);
      } else {
        throw new Error(result.error || '报告生成失败');
      }

    } catch (error: any) {
      console.error('报告生成失败:', error);
      toast({
        title: "生成失败",
        description: error.message || "请重试",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getSystemPromptByType = (type: string): string => {
    const prompts = {
      'comprehensive': '你是一名资深的情报分析专家，擅长综合分析和战略研判。请生成全面深入的综合情报报告。',
      'security': '你是一名安全威胁评估专家，专注于识别和分析各类安全风险。请生成专业的安全威胁评估报告。',
      'economic': '你是一名经济情报分析师，专长经济趋势分析和市场研判。请生成详细的经济情报分析报告。',
      'geopolitical': '你是一名地缘政治分析专家，擅长国际关系和政治风险评估。请生成专业的地缘政治分析报告。'
    };
    return prompts[type as keyof typeof prompts] || prompts.comprehensive;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">统一情报搜索平台</h1>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <div className="space-y-6">
              <div>
                <Label htmlFor="search-query" className="text-lg font-medium text-gray-700">搜索内容</Label>
                <Input
                  id="search-query"
                  type="text"
                  value={query || ''}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您想搜索的任何信息..."
                  className="mt-2 text-base h-12"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label className="text-lg font-medium text-gray-700">选择搜索引擎</Label>
                <div className="mt-3 flex flex-wrap gap-4">
                  {availableEngines.map((engine) => (
                    <div key={engine.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={engine.id}
                        checked={selectedEngines?.includes(engine.id) || false}
                        onCheckedChange={() => handleEngineChange(engine.id)}
                        disabled={isLoading}
                      />
                      <Label htmlFor={engine.id} className="font-normal text-base cursor-pointer">
                        {engine.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={isLoading || !query?.trim()} 
                className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                {isLoading ? '正在搜索...' : '立即搜索'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm" role="alert">
              <strong className="font-bold">错误: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mt-8">
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg text-gray-600">
                  正在从 {selectedEngines?.join(', ') || '搜索引擎'} 获取数据，请稍候...
                </p>
              </div>
            )}

            {!isLoading && results && results.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    搜索结果 ({results.length} 条)
                  </h2>
                  {showReportOptions && (
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="px-3 py-1">
                        已选择 {selectedResults.size} 条
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedResults.size === results.length ? '取消全选' : '全选'}
                      </Button>
                    </div>
                  )}
                </div>

                {results.map((result, index) => (
                  <div key={`result-${index}`} className={`bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border transition-all duration-200 ${
                    selectedResults.has(index) 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-white/20 hover:shadow-xl'
                  }`}>
                    {showReportOptions && (
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`result-${index}`}
                          checked={selectedResults.has(index)}
                          onCheckedChange={() => handleResultSelect(index)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor={`result-${index}`} className="cursor-pointer block">
                            <a 
                              href={result.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {result.title || '无标题'}
                            </a>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {!showReportOptions && (
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {result.title || '无标题'}
                      </a>
                    )}
                    
                    <p className="text-sm text-gray-500 mt-2">
                      来源: {result.source || '未知'} 
                      {result.publishDate && ` | 发布于: ${result.publishDate}`}
                    </p>
                    {result.content && (
                      <p className="mt-3 text-gray-700 leading-relaxed">
                        {result.content}
                      </p>
                    )}
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-blue-500 mt-3 inline-block break-all hover:text-blue-700 transition-colors"
                    >
                      {result.url}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* 报告生成选项 */}
            {showReportOptions && !isGeneratingReport && selectedResults.size > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    生成情报分析报告
                  </CardTitle>
                  <CardDescription>
                    基于已选择的 {selectedResults.size} 个数据源生成专业情报分析报告
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleGenerateReport('comprehensive')}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto flex items-start gap-3"
                    >
                      <Target className="h-5 w-5 mt-1 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-semibold">综合分析报告</div>
                        <div className="text-sm opacity-90">全面深入的综合情报分析</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => handleGenerateReport('security')}
                      variant="outline"
                      className="border-red-200 hover:bg-red-50 p-4 h-auto flex items-start gap-3"
                    >
                      <Shield className="h-5 w-5 mt-1 flex-shrink-0 text-red-600" />
                      <div className="text-left">
                        <div className="font-semibold">安全威胁评估</div>
                        <div className="text-sm text-gray-600">识别和分析安全风险</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => handleGenerateReport('economic')}
                      variant="outline"
                      className="border-green-200 hover:bg-green-50 p-4 h-auto flex items-start gap-3"
                    >
                      <TrendingUp className="h-5 w-5 mt-1 flex-shrink-0 text-green-600" />
                      <div className="text-left">
                        <div className="font-semibold">经济情报分析</div>
                        <div className="text-sm text-gray-600">经济趋势和市场研判</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => handleGenerateReport('geopolitical')}
                      variant="outline"
                      className="border-purple-200 hover:bg-purple-50 p-4 h-auto flex items-start gap-3"
                    >
                      <Globe className="h-5 w-5 mt-1 flex-shrink-0 text-purple-600" />
                      <div className="text-left">
                        <div className="font-semibold">地缘政治分析</div>
                        <div className="text-sm text-gray-600">国际关系和政治风险</div>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        AI智能分析
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        结构化报告
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        可信度评估
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 生成中状态 */}
            {isGeneratingReport && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                      <Zap className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">AI正在生成情报报告</h3>
                      <p className="text-gray-600">正在分析 {selectedResults.size} 个数据源，生成专业分析报告...</p>
                    </div>
                    <div className="w-full max-w-md mx-auto">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && results && results.length === 0 && query && (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">未找到相关结果，请尝试其他关键词</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}