// 核心服务层 (NEW)
// 统一接口定义 - 分析器接口

export interface IAnalyzer {
  analyze(data: any): Promise<any>
}