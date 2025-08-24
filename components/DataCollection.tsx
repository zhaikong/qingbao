"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Search, Database, Globe, Clock, CheckCircle, AlertCircle, RefreshCw, Rss } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DataCollectionProps {
  onDataCollected: (data: any) => void
}

interface CollectionResult {
  source: string
  results: any[]
  status: 'pending' | 'collecting' | 'completed' | 'error'
  error?: string
}

interface DataSource {
  name: string;
  type: string;
  category: string;
  url?: string;
  description?: string;
}

interface GroupedDataSources {
  [category: string]: DataSource[];
}

const getSourceIcon = (type: string) => {
    switch (type) {
      case 'rss':
        return <Rss className="h-6 w-6 text-orange-500" />;
      case 'zhipu':
      case 'duckduckgo':
      case 'searxng':
        return <Search className="h-6 w-6 text-blue-500" />;
      case 'gnews':
      case 'newsapi':
      case 'guardian':
        return <Globe className="h-6 w-6 text-green-500" />;
      default:
        return <Database className="h-6 w-6 text-gray-500" />;
    }
};

export default function DataCollection({ onDataCollected }: DataCollectionProps) {
  const [isCollecting, setIsCollecting] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const [timeRange, setTimeRange] = useState('month')
  const [keywords, setKeywords] = useState('')
  const [language, setLanguage] = useState<'zh' | 'en' | 'all'>('all')
  const [collectionResults, setCollectionResults] = useState<CollectionResult[]>([])
  const [realTimeResults, setRealTimeResults] = useState<any[]>([])

  // State for dynamic data sources
  const [dataSources, setDataSources] = useState<GroupedDataSources>({});
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [errorSources, setErrorSources] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('全部');

  useEffect(() => {
    const fetchDataSources = async () => {
      setIsLoadingSources(true);
      try {
        const response = await fetch('/api/data-sources');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || '无法获取数据源');
        }
        const data: GroupedDataSources = await response.json();
        
        const enhancedData = Object.entries(data).reduce((acc, [category, sources]) => {
          acc[category] = sources.map(source => ({
            ...source,
            description: source.url || `类型: ${source.type}`
          }));
          return acc;
        }, {} as GroupedDataSources);

        setDataSources(enhancedData);
        const allSourceNames = Object.values(enhancedData).flat().map(source => source.name);
        setSelectedSources(allSourceNames);
      } catch (err) {
        setErrorSources(err instanceof Error ? err.message : '发生未知错误');
      } finally {
        setIsLoadingSources(false);
      }
    };

    fetchDataSources();
  }, []);

  const handleSourceToggle = (sourceName: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceName)
        ? prev.filter(name => name !== sourceName)
        : [...prev, sourceName]
    );
  };

  // NOTE: This function needs to be adapted to the new data source structure.
  const performRealDataCollection = async () => {
    alert("数据收集功能正在适配新的数据源结构，暂不可用。");
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'collecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string, count?: number) => {
    switch (status) {
      case 'pending':
        return '等待开始...'
      case 'collecting':
        return '正在搜索...'
      case 'completed':
        return `已收集 ${count || 0} 条`
      case 'error':
        return '收集失败'
      default:
        return ''
    }
  }

  const allCategories = ['全部', ...Object.keys(dataSources)];
  const sourcesToShow = activeTab === '全部' 
    ? dataSources 
    : { [activeTab]: dataSources[activeTab] };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            全球信源搜索配置
          </CardTitle>
          <CardDescription>
            连接全球优质信源，获取最新、最权威的信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="keywords">搜索关键词</Label>
            <Input
              id="keywords"
              placeholder="输入您要研究的主题或关键词"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="text-base"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>时间范围</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">最近24小时</SelectItem>
                  <SelectItem value="week">最近1周</SelectItem>
                  <SelectItem value="month">最近1个月</SelectItem>
                  <SelectItem value="year">最近1年</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>语言偏好</Label>
              <Select value={language} onValueChange={(value: 'zh' | 'en' | 'all') => setLanguage(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部语言</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">英文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>数据源配置</Label>
            <CardDescription>选择用于收集信息的数据源</CardDescription>
            
            {isLoadingSources ? (
              <p>正在加载数据源...</p>
            ) : errorSources ? (
              <p className="text-red-500">加载数据源失败: {errorSources}</p>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pt-2">
                <TabsList>
                  {allCategories.map(category => (
                    category in dataSources || category === '全部' ? <TabsTrigger key={category} value={category}>{category}</TabsTrigger> : null
                  ))}
                </TabsList>
                
                <div className="mt-6 space-y-8">
                  {Object.entries(sourcesToShow).map(([category, sources]) => (
                    sources && (
                      <div key={category}>
                        <h3 className="text-lg font-semibold mb-4">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sources.map(source => (
                            <div
                              key={source.name}
                              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedSources.includes(source.name)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleSourceToggle(source.name)}
                            >
                              <div className="mr-3 shrink-0">
                                {getSourceIcon(source.type)}
                              </div>
                              <div className="flex-grow overflow-hidden">
                                <h4 className="font-bold">{source.name}</h4>
                                <p className="text-sm text-gray-500 truncate">{source.description}</p>
                              </div>
                              <Checkbox
                                checked={selectedSources.includes(source.name)}
                                className="ml-3"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </Tabs>
            )}
          </div>

          <Button 
            onClick={performRealDataCollection}
            disabled={isCollecting || selectedSources.length === 0 || !keywords.trim()}
            className="w-full"
            size="lg"
          >
            {isCollecting ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />正在搜索...</>
            ) : (
              <><Search className="h-4 w-4 mr-2" />开始智能搜索</>
            )}
          </Button>
        </CardContent>
      </Card>

      {isCollecting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              实时搜索进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>搜索进度</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                已收集 {realTimeResults.length} 条信息
              </p>
            </div>
            <div className="space-y-3">
              {collectionResults.map((result) => {
                return (
                  <div key={result.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <span className="font-medium">{result.source}</span>
                        {result.error && (
                          <p className="text-xs text-red-600 mt-1">{result.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                        {getStatusText(result.status, result.results.length)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}