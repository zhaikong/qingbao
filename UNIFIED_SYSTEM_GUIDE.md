# 统一情报采集系统使用指南

## 🎯 系统概述

经过全面重构，您的情报分析平台现在支持三种数据采集方式和智谱AI分级模型调度，实现了真正的统一化、智能化情报处理。

## 📊 核心特性

### 1. 三种数据采集方式

#### 方式1: API密钥直接调用 🔑
- **GNews API**: 全球新闻数据
- **NewsAPI**: 多源新闻聚合
- **特点**: 快速、稳定、高质量

#### 方式2: 浏览器直接爬取 🌐
- **OTX网络安全情报**: https://otx.alienvault.com/dashboard/new
- **ACLED俄乌冲突监测**: https://acleddata.com/monitor/ukraine-conflict-monitor
- **ACLED月度区域数据**: https://acleddata.com/series/monthly-regional-updates
- **特点**: 保持登录状态、真实环境、无需API

#### 方式3: MCP智能处理 🔧
- **Firecrawl**: AI优化的网页爬虫
- **Chrome MCP Server**: 浏览器自动化
- **特点**: AI优化、智能提取、结构化数据

### 2. 智谱AI分级模型调度 🤖

#### 第一级: GLM-4.5-Air
- **用途**: 基础文本情报处理
- **特点**: 快速响应、成本优化
- **适用**: 日常文本分析、摘要生成

#### 第二级: GLM-4.5-V
- **用途**: 深度图像/视频分析
- **特点**: 多模态处理、视觉理解
- **适用**: 图片分析、视频内容提取

#### 第三级: GLM-4.1V-Thinking-FlashX
- **用途**: 实时响应任务
- **特点**: 推理能力强、响应迅速
- **适用**: 紧急情报、实时分析

## 🚀 快速开始

### 1. 环境配置

确保 `.env.local` 文件包含以下配置：

```env
# 智谱AI模型配置
ZHIPU_API_KEY=your_zhipu_api_key_here
GLM_4_5_AIR_MODEL=glm-4.5-air
GLM_4_5_V_MODEL=glm-4.5-v
GLM_4_1V_THINKING_MODEL=glm-4.1v-thinking-flashx

# 新闻API密钥
GNEWS_API_TOKEN=your_gnews_api_key_here
NEWSAPI_KEY=your_newsapi_key_here

# Chrome MCP配置
CHROME_MCP_ENABLED=true
OTX_DASHBOARD_URL=https://otx.alienvault.com/dashboard/new
ACLED_UKRAINE_URL=https://acleddata.com/monitor/ukraine-conflict-monitor
ACLED_MONTHLY_URL=https://acleddata.com/series/monthly-regional-updates

# Firecrawl配置
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

### 2. 启动Chrome MCP Server

```bash
# 确保Chrome MCP Server正在运行
# 具体启动命令取决于您的MCP服务器配置
```

### 3. 测试系统功能

```bash
# 运行系统测试
node test-unified-system.js

# 启动开发服务器
npm run dev
```

## 📋 使用流程

### 1. 创建情报分析任务

访问 `http://localhost:3000/intelligent-report` 页面：

1. **输入分析主题**: 例如"人工智能发展趋势"
2. **提供内容摘要**: 简要描述分析需求
3. **选择报告类型**: comprehensive（推荐）

### 2. 系统自动执行

系统将自动执行以下步骤：

1. **智能关键词分析** 🧠
   - 提取核心关键词
   - 生成搜索策略
   - 构建查询计划

2. **统一数据采集** 📡
   - 方式1: API密钥调用新闻源
   - 方式2: Chrome MCP访问专业平台
   - 方式3: Firecrawl智能爬取

3. **数据质量评估** 📊
   - 相关性评分
   - 可信度分析
   - 内容质量检查

4. **智谱分级处理** 🤖
   - 根据内容类型选择合适模型
   - 分级分析处理
   - 生成专业报告

### 3. 获取分析结果

系统将返回包含以下内容的完整报告：

- **执行摘要**: 核心发现和结论
- **背景分析**: 议题背景和现状
- **多维度分析**: 政策、技术、市场等
- **趋势预测**: 短期、中期、长期预测
- **风险评估**: 风险因素和应对策略
- **决策建议**: 具体可行的行动建议

## 🔧 高级配置

### 1. 数据源优先级调整

编辑 `lib/unified-data-collector.ts` 中的数据源配置：

```typescript
private dataSources: DataSourceConfig[] = [
  // 调整enabled字段来启用/禁用特定数据源
  // 调整timeout来设置超时时间
  // 添加新的数据源配置
]
```

### 2. 模型调度策略

编辑 `lib/zhipu-model-scheduler.ts` 来调整模型选择逻辑：

```typescript
// 根据任务复杂度、紧急程度等因素
// 自定义模型选择策略
```

### 3. Chrome MCP自定义

编辑 `lib/chrome-mcp-integration.ts` 来添加新的网站支持：

```typescript
// 添加新的自动化访问方法
// 自定义数据提取规则
```

## 📊 监控和调试

### 1. 实时进度监控

访问进度API查看实时状态：
```
GET /api/progress-status
```

### 2. 数据源状态检查

```javascript
// 在浏览器控制台中执行
fetch('/api/data-sources/status')
  .then(r => r.json())
  .then(console.log)
```

### 3. 模型调度状态

```javascript
// 检查智谱模型状态
fetch('/api/models/status')
  .then(r => r.json())
  .then(console.log)
```

## 🚨 故障排除

### 常见问题

1. **数据采集失败**
   - 检查API密钥配置
   - 确认网络连接
   - 查看Chrome MCP Server状态

2. **模型调用失败**
   - 验证智谱API密钥
   - 检查模型名称配置
   - 确认API额度充足

3. **浏览器自动化失败**
   - 确保Chrome MCP Server运行
   - 检查目标网站可访问性
   - 验证登录状态

### 日志查看

```bash
# 查看服务器日志
tail -f server.log

# 查看浏览器控制台
# 打开开发者工具查看详细错误信息
```

## 🔄 系统更新

### 添加新数据源

1. 在 `lib/unified-data-collector.ts` 中添加配置
2. 实现对应的采集方法
3. 更新测试脚本验证功能

### 集成新模型

1. 在 `lib/zhipu-model-scheduler.ts` 中添加模型配置
2. 实现调用方法
3. 更新分级调度逻辑

## 📈 性能优化

### 1. 并发控制
- 合理设置并发数量
- 避免API限制触发
- 优化请求间隔

### 2. 缓存策略
- 实现结果缓存
- 避免重复请求
- 提高响应速度

### 3. 资源管理
- 监控内存使用
- 及时释放资源
- 优化数据结构

## 🎯 最佳实践

1. **定期更新API密钥**
2. **监控数据源质量**
3. **调整模型选择策略**
4. **备份重要配置**
5. **定期系统测试**

---

## 📞 技术支持

如遇到问题，请：

1. 查看测试报告: `unified-system-test-report.json`
2. 运行诊断脚本: `node test-unified-system.js`
3. 检查系统日志和错误信息
4. 参考本指南的故障排除部分

**系统版本**: v2.0 统一情报采集系统
**最后更新**: 2025年8月23日