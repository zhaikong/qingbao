/**
 * 性能监控工具
 */

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  resultCount?: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  /**
   * 开始监控
   */
  start(name: string): void {
    this.metrics.set(name, {
      name,
      startTime: Date.now(),
      success: false
    });
  }

  /**
   * 结束监控
   */
  end(name: string, success: boolean = true, resultCount?: number, error?: string): void {
    const metric = this.metrics.get(name);
    if (metric) {
      const endTime = Date.now();
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      metric.success = success;
      metric.resultCount = resultCount;
      metric.error = error;
    }
  }

  /**
   * 获取指标
   */
  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const metrics = this.getAllMetrics();
    
    if (metrics.length === 0) {
      return '📊 暂无性能数据';
    }

    let report = '📊 性能监控报告\n';
    report += '=' .repeat(50) + '\n';

    metrics.forEach(metric => {
      const status = metric.success ? '✅' : '❌';
      const duration = metric.duration ? `${metric.duration}ms` : '未完成';
      const resultCount = metric.resultCount !== undefined ? ` (${metric.resultCount}条结果)` : '';
      
      report += `${status} ${metric.name}: ${duration}${resultCount}\n`;
      
      if (metric.error) {
        report += `   错误: ${metric.error}\n`;
      }
    });

    // 统计信息
    const successCount = metrics.filter(m => m.success).length;
    const totalDuration = metrics
      .filter(m => m.duration)
      .reduce((sum, m) => sum + (m.duration || 0), 0);
    
    report += '\n📈 统计信息:\n';
    report += `   成功率: ${successCount}/${metrics.length} (${Math.round(successCount / metrics.length * 100)}%)\n`;
    report += `   总耗时: ${totalDuration}ms\n`;
    report += `   平均耗时: ${Math.round(totalDuration / metrics.length)}ms\n`;

    return report;
  }

  /**
   * 清空指标
   */
  clear(): void {
    this.metrics.clear();
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();