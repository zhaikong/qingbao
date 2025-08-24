import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Report, QualityAssessment, initialQualityAssessment } from '@/lib/data-sources/report-types';

// 定义组件接收的属性
interface ReportQualityAssessmentProps {
  report: Report;
  className?: string;
}

// 定义质量评估指标的类型
type QualityMetric = 'dataQuality' | 'structureQuality' | 'contentQuality' | 'overallQuality';

// 定义指标的详细信息
interface MetricDetail {
  label: string;
  description: string;
  score: number;
  suggestions: string[];
}

// 定义质量评估的完整结构
interface QualityDetails {
  dataQuality: MetricDetail;
  structureQuality: MetricDetail;
  contentQuality: MetricDetail;
  overallQuality: MetricDetail;
}


// 默认的质量评估数据
const defaultQualityDetails: QualityDetails = {
  dataQuality: {
    label: "数据质量",
    description: "评估数据的准确性、完整性、时效性和来源可靠性。",
    score: 0,
    suggestions: []
  },
  structureQuality: {
    label: "结构质量",
    description: "评估报告的逻辑结构、格式和可读性。",
    score: 0,
    suggestions: []
  },
  contentQuality: {
    label: "内容质量",
    description: "评估内容的相关性、深度、客观性和洞察力。",
    score: 0,
    suggestions: []
  },
  overallQuality: {
    label: "综合质量",
    description: "综合以上所有指标，对报告的整体质量进行评估。",
    score: 0,
    suggestions: []
  }
};

// 质量评估组件
const ReportQualityAssessment: React.FC<ReportQualityAssessmentProps> = ({ report, className }) => {
  const [currentQuality, setCurrentQuality] = useState<QualityAssessment>(initialQualityAssessment);
  const [qualityDetails, setQualityDetails] = useState<QualityDetails>(defaultQualityDetails);
  const [isOpen, setIsOpen] = useState(true); // 默认展开

  // 当报告更新时，重新计算质量评估
  useEffect(() => {
    if (report) {
      const newQuality = calculateQuality(report);
      setCurrentQuality(newQuality);
      updateQualityDetails(newQuality);
    }
  }, [report]);

  // 模拟质量计算逻辑
  const calculateQuality = (report: Report): QualityAssessment => {
    // 这里应该是基于报告内容的复杂评估逻辑
    // 为简化示例，我们使用一些随机或固定的分数
    const dataScore = Math.min(95, 80 + (report.content?.length || 0) * 2 );
    const structureScore = Math.min(90, 75 + (report.title ? 5 : 0) );
    const contentScore = Math.min(98, 85 + (report.content?.length || 0) / 100);
    
    const overallScore = Math.round((dataScore + structureScore + contentScore) / 3);

    return {
      rating: overallScore,
      feedback: generateSuggestions({ dataScore, structureScore, contentScore }).join(' '),
    };
  };

  // 生成改进建议
  const generateSuggestions = (scores: { dataScore: number, structureScore: number, contentScore: number }): string[] => {
    const suggestions: string[] = [];
    if (scores.dataScore < 85) suggestions.push("增强数据源多样性，提高信息全面性。");
    if (scores.structureScore < 80) suggestions.push("优化报告结构，确保逻辑清晰、层次分明。");
    if (scores.contentScore < 90) suggestions.push("深化内容分析，提供更有价值的洞察和观点。");
    if (suggestions.length === 0) suggestions.push("报告质量良好，暂无明显改进点。");
    return suggestions;
  };

  // 更新质量详情
  const updateQualityDetails = (quality: QualityAssessment) => {
    const suggestions = quality.feedback.split(' ').filter(s => s);
    const dataScore = quality.rating; // Simplified for example
    const structureScore = quality.rating; // Simplified for example
    const contentScore = quality.rating; // Simplified for example
    const overallScore = quality.rating;

    setQualityDetails({
      dataQuality: { ...defaultQualityDetails.dataQuality, score: dataScore, suggestions: suggestions.filter(s => s.includes("数据")) },
      structureQuality: { ...defaultQualityDetails.structureQuality, score: structureScore, suggestions: suggestions.filter(s => s.includes("结构")) },
      contentQuality: { ...defaultQualityDetails.contentQuality, score: contentScore, suggestions: suggestions.filter(s => s.includes("内容")) },
      overallQuality: { ...defaultQualityDetails.overallQuality, score: overallScore, suggestions: suggestions },
    });
  };

  // 根据分数返回颜色类
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const getScoreTextColor = (score: number) => {
    if (score >= 90) return "text-green-700";
    if (score >= 70) return "text-yellow-700";
    return "text-red-700";
  };

  // 渲染单个质量指标
  const renderMetric = (metric: MetricDetail) => (
    <div key={metric.label} className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold">{metric.label}</span>
        <span className={`font-bold ${getScoreTextColor(metric.score)}`}>{metric.score} / 100</span>
      </div>
      <p className="text-sm text-gray-500 mb-2">{metric.description}</p>
      <Progress value={metric.score} className="w-full" />
      {metric.suggestions && metric.suggestions.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          {metric.suggestions.map((suggestion, index) => (
            <p key={index}>• {suggestion}</p>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className={`w-full ${className}`}>
      {/* <Collapsible open={isOpen} onOpenChange={setIsOpen}> */}
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-lg font-semibold">
            情报质量评估
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">综合得分:</span>
              <Badge className={`text-lg ${getScoreColor(currentQuality.rating)}`}>
                {currentQuality.rating}
              </Badge>
            </div>
            {/* <CollapsibleTrigger asChild> */}
              <Button variant="ghost" size="sm" className="w-9 p-0" onClick={() => setIsOpen(!isOpen)}>
                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            {/* </CollapsibleTrigger> */}
          </div>
        </CardHeader>
        {isOpen && (
          // <CollapsibleContent>
            <CardContent className="px-4 pb-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* 左侧：综合评估和建议 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">综合评估</h3>
                    <div className="flex items-center mb-2">
                      <div className={`w-4 h-4 rounded-full ${getScoreColor(currentQuality.rating)} mr-2`}></div>
                      <p className="text-sm">
                        报告综合质量为 
                        <span className={`font-bold ${getScoreTextColor(currentQuality.rating)}`}>
                          {currentQuality.rating >= 90 ? '优秀' : currentQuality.rating >= 70 ? '良好' : '待改进'}
                        </span>
                        。
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {qualityDetails.overallQuality.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">改进建议</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {currentQuality.feedback.split(' ').filter(f => f).map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 右侧：详细指标 */}
                <div className="space-y-4">
                  {renderMetric(qualityDetails.dataQuality)}
                  {renderMetric(qualityDetails.structureQuality)}
                  {renderMetric(qualityDetails.contentQuality)}
                </div>
              </div>

              {/* 质量分布统计 */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2 text-center">质量分数分布</h3>
                <div className="flex justify-around text-sm">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div>
                      <span className="text-gray-600">优秀 (≥90)</span>
                    </div>
                    <span className="font-medium">
                      {[qualityDetails.dataQuality.score, qualityDetails.structureQuality.score, qualityDetails.contentQuality.score]
                        .filter(score => score >= 90).length} 项
                    </span>
                  </div>
                  <div className="text-center">
                     <div className="flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>
                      <span className="text-gray-600">良好 (70-89)</span>
                    </div>
                    <span className="font-medium">
                      {[qualityDetails.dataQuality.score, qualityDetails.structureQuality.score, qualityDetails.contentQuality.score]
                        .filter(score => score >= 70 && score < 90).length} 项
                    </span>
                  </div>
                  <div className="text-center">
                     <div className="flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
                      <span className="text-gray-600">待改进 (&lt;70)</span>
                    </div>
                    <span className="font-medium">
                      {[qualityDetails.dataQuality.score, qualityDetails.structureQuality.score, qualityDetails.contentQuality.score]
                        .filter(score => score < 70).length} 项
                    </span>
                  </div>
                </div>
              </div>

            </CardContent>
          // </CollapsibleContent>
        )}
      {/* </Collapsible> */}
    </Card>
  );
};

export default ReportQualityAssessment;