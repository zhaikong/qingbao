"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe, TrendingUp, Shield, Zap } from "lucide-react";

export default function AnalysisPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>("all");
  const [templateStats, setTemplateStats] = useState({
    geopolitical: 0,
    economic: 0,
    security: 0,
    technology: 0
  });
  // 加载项目数据
  useEffect(() => {
    const loadProjects = () => {
      try {
        const projectsData = JSON.parse(localStorage.getItem('projects') || '[]');
        setProjects(projectsData);
        
        // 统计各模板类型的项目数量
        const stats = {
          geopolitical: 0,
          economic: 0,
          security: 0,
          technology: 0
        };
        
        projectsData.forEach((project: any) => {
          if (project.template && stats.hasOwnProperty(project.template)) {
            stats[project.template as keyof typeof stats]++;
          }
        });
        
        setTemplateStats(stats);
      } catch (error) {
        console.error('加载项目数据失败:', error);
      }
    };
    
    loadProjects();
  }, []);
  
  // 根据选择的模板类型过滤项目
  const filteredProjects = selectedTemplateType === 'all' 
    ? projects 
    : projects.filter(project => project.template === selectedTemplateType);
  
  // 获取模板图标
  const getTemplateIcon = (templateType: string) => {
    switch(templateType) {
      case 'geopolitical':
        return <Globe className="h-5 w-5 text-blue-600" />;
      case 'economic':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'security':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'technology':
        return <Zap className="h-5 w-5 text-purple-600" />;
      default:
        return null;
    }
  };
  
  // 获取模板名称
  const getTemplateName = (templateType: string) => {
    switch(templateType) {
      case 'geopolitical':
        return '地缘政治分析';
      case 'economic':
        return '经济情报分析';
      case 'security':
        return '安全威胁评估';
      case 'technology':
        return '科技竞争分析';
      default:
        return '未知模板';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">数据分析</h1>
      </div>
      
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">项目数据分析</TabsTrigger>
          <TabsTrigger value="reports">报告分析</TabsTrigger>
          <TabsTrigger value="templates">模板分析</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>项目数据概览</CardTitle>
                <CardDescription>查看所有项目的数据统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>总项目数</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>活跃项目</span>
                    <span className="font-bold">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已完成项目</span>
                    <span className="font-bold">7</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">查看详细统计</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>数据源分布</CardTitle>
                <CardDescription>项目使用的数据源分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>智谱AI联网搜索</span>
                    <span className="font-bold">78%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ollama模型</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>其他数据源</span>
                    <span className="font-bold">7%</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">查看详细分布</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>项目时间分析</CardTitle>
                <CardDescription>项目完成时间和效率分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>平均完成时间</span>
                    <span className="font-bold">3.5 天</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最快完成时间</span>
                    <span className="font-bold">1.2 小时</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最长项目周期</span>
                    <span className="font-bold">14 天</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">查看时间详情</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>报告生成统计</CardTitle>
                <CardDescription>报告生成数量和质量分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>总报告数</span>
                    <span className="font-bold">28</span>
                  </div>
                  <div className="flex justify-between">
                    <span>本月生成</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>平均质量评分</span>
                    <span className="font-bold">4.7/5</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">查看报告详情</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>报告内容分析</CardTitle>
                <CardDescription>报告内容和主题分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>政治分析报告</span>
                    <span className="font-bold">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>经济分析报告</span>
                    <span className="font-bold">28%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>科技竞争报告</span>
                    <span className="font-bold">37%</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">查看主题详情</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>报告引用分析</CardTitle>
                <CardDescription>报告引用源和可靠性分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>官方数据引用</span>
                    <span className="font-bold">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>新闻媒体引用</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>学术研究引用</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">查看引用详情</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="template-filter">按模板类型筛选</Label>
                <Select value={selectedTemplateType} onValueChange={setSelectedTemplateType}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="选择模板类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有模板</SelectItem>
                    <SelectItem value="geopolitical">地缘政治分析</SelectItem>
                    <SelectItem value="economic">经济情报分析</SelectItem>
                    <SelectItem value="security">安全威胁评估</SelectItem>
                    <SelectItem value="technology">科技竞争分析</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">导出分析报告</Button>
              </div>
            </div>
            
            {/* 模板统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    地缘政治分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700">{templateStats.geopolitical}</div>
                  <p className="text-sm text-blue-600 mt-1">项目数量</p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    经济情报分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">{templateStats.economic}</div>
                  <p className="text-sm text-green-600 mt-1">项目数量</p>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    安全威胁评估
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700">{templateStats.security}</div>
                  <p className="text-sm text-red-600 mt-1">项目数量</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    科技竞争分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700">{templateStats.technology}</div>
                  <p className="text-sm text-purple-600 mt-1">项目数量</p>
                </CardContent>
              </Card>
            </div>
            
            {/* 项目列表 */}
            <Card>
              <CardHeader>
                <CardTitle>模板项目列表</CardTitle>
                <CardDescription>
                  {selectedTemplateType === 'all' 
                    ? '所有项目' 
                    : `${getTemplateName(selectedTemplateType)}项目`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredProjects.length > 0 ? (
                  <div className="space-y-4">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTemplateIcon(project.template)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{project.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {getTemplateName(project.template)}
                              </span>
                              <span className="text-xs text-gray-500">
                                创建于 {new Date(project.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    {selectedTemplateType === 'all' 
                      ? '暂无项目数据' 
                      : `暂无${getTemplateName(selectedTemplateType)}类型的项目`}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>趋势分析</CardTitle>
                <CardDescription>项目和报告趋势分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-100 rounded-md">
                  <p className="text-gray-500">趋势图表将在这里显示</p>
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full">生成趋势报告</Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>热点主题</CardTitle>
                  <CardDescription>当前热门分析主题</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>人工智能发展</span>
                      <span className="text-red-500">↑ 24%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>地缘政治冲突</span>
                      <span className="text-red-500">↑ 18%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>经济制裁影响</span>
                      <span className="text-red-500">↑ 15%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>能源安全分析</span>
                      <span className="text-green-500">↓ 8%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>贸易关系变化</span>
                      <span className="text-red-500">↑ 12%</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>预测分析</CardTitle>
                  <CardDescription>基于历史数据的未来趋势预测</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>政治稳定性预测</span>
                      <span className="font-medium">中等风险</span>
                    </li>
                    <li className="flex justify-between">
                      <span>经济增长预期</span>
                      <span className="font-medium">缓慢增长</span>
                    </li>
                    <li className="flex justify-between">
                      <span>科技竞争态势</span>
                      <span className="font-medium">高度竞争</span>
                    </li>
                    <li className="flex justify-between">
                      <span>区域合作前景</span>
                      <span className="font-medium">有限改善</span>
                    </li>
                    <li className="flex justify-between">
                      <span>资源安全预测</span>
                      <span className="font-medium">潜在风险</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}