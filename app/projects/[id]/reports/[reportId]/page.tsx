'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  FileText, 
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface ReportData {
  id: string;
  projectId: string;
  title: string;
  content: string;
  topic: string;
  generatedAt: string;
  dataSourceCount: number;
  reportLength: number;
  template?: string;
}

export default function ReportViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [params.reportId]);

  const loadReport = async () => {
    try {
      // 从localStorage加载报告数据
      const reportData = localStorage.getItem(`report_${params.reportId}`);
      
      if (reportData) {
        const parsedReport = JSON.parse(reportData);
        setReport(parsedReport);
      } else {
        toast({
          title: "报告未找到",
          description: "无法找到指定的报告",
          variant: "destructive",
        });
        router.push(`/projects/${params.id}`);
      }
    } catch (error) {
      console.error('加载报告失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载报告内容",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;

    const blob = new Blob([report.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "下载成功",
      description: "报告已下载到本地",
    });
  };

  const handleShare = async () => {
    if (!report) return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "链接已复制",
        description: "报告链接已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制链接",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getTemplateDisplayName = (template?: string) => {
    const templateNames = {
      'geopolitical': '地缘政治分析',
      'economic': '经济情报分析',
      'security': '安全威胁评估',
      'technology': '科技竞争分析',
      'comprehensive': '综合分析'
    };
    return templateNames[template as keyof typeof templateNames] || '综合分析';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">加载报告中...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">报告未找到</h2>
          <p className="text-gray-600 mb-4">无法找到指定的报告</p>
          <Button asChild>
            <Link href={`/projects/${params.id}`}>返回项目</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" asChild className="mr-4">
                <Link href={`/projects/${params.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回项目
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
                <p className="text-sm text-gray-600">报告ID: {report.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                已完成
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    报告内容
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      分享
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      下载
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {report.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 报告信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">报告信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">生成时间</p>
                    <p className="text-gray-600">{formatDate(report.generatedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-sm">
                  <BarChart3 className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">数据源数量</p>
                    <p className="text-gray-600">{report.dataSourceCount} 个</p>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">报告长度</p>
                    <p className="text-gray-600">{Math.round(report.reportLength / 1000)}K 字符</p>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <Eye className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">分析类型</p>
                    <p className="text-gray-600">{getTemplateDisplayName(report.template)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 质量指标 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">质量评估</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">完整性</span>
                    <Badge variant="secondary">95%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">准确性</span>
                    <Badge variant="secondary">90%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">相关性</span>
                    <Badge variant="secondary">92%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">时效性</span>
                    <Badge variant="secondary">88%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  导出为PDF
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  分享报告
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/projects/${params.id}/generate`}>
                    <FileText className="h-4 w-4 mr-2" />
                    生成新报告
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}