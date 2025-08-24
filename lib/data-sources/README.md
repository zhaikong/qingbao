# 数据源框架 (Data Sources Framework)

这是一个统一的数据获取框架，支持联网搜索和信源订阅两种数据获取方式，提供缓存、去重、排序等功能。

## 架构概览

```
lib/data-sources/
├── types.ts              # 核心类型定义
├── manager.ts            # 数据源管理器（主入口）
├── config-loader.ts      # 配置加载器
├── cache/                # 缓存模块
│   ├── types.ts
│   └── index.ts
├── web-search/           # 联网搜索模块
│   ├── types.ts
│   └── index.ts
├── feeds/                # 信源订阅模块
│   ├── types.ts
│   ├── index.ts
│   └── rss.ts
└── adapters/             # 适配器（兼容遗留代码）
    └── legacy-search.ts
```

## 核心特性

### 🔍 联网搜索
- **多引擎支持**: 智谱AI、DuckDuckGo、SearXNG
- **并发检索**: 同时查询多个搜索引擎
- **结果去重**: 基于URL自动去重
- **相关性排序**: 按相关性和时间排序

### 📰 信源订阅
- **RSS支持**: 自动解析RSS/Atom feeds
- **GNews集成**: 支持Google News API
- **并发获取**: 同时处理多个信源
- **错误容错**: 单个信源失败不影响整体

### 💾 缓存系统
- **内存缓存**: 高性能内存缓存
- **TTL支持**: 可配置过期时间
- **统计信息**: 命中率、大小等统计
- **可扩展**: 支持扩展到Redis等

### 🔧 配置管理
- **YAML配置**: 人性化的配置文件
- **环境变量**: 支持环境变量覆盖
- **热重载**: 支持配置热重载
- **默认配置**: 提供合理的默认值

## 快速开始

### 1. 配置文件

创建 `config/data-sources.yaml`:

```yaml
# 联网搜索配置
webSearch:
  enabled: true
  engines: ['zhipu']
  maxResults: 20
  zhipu:
    enabled: true
    searchEngine: 'search_pro'
    maxResults: 10

# 信源订阅配置
feeds:
  enabled: true
  maxItemsPerSource: 10
  sources:
    - name: "科技新闻"
      type: "rss"
      url: "https://example.com/tech.xml"
      category: "technology"

# 缓存配置
cache:
  enabled: true
  ttl: 300
  maxSize: 1000
```

### 2. 环境变量

```bash
# 智谱AI API密钥
ZHIPU_API_KEY=your_zhipu_api_key

# Google News API密钥（可选）
GNEWS_API_KEY=your_gnews_api_key
```

### 3. 基本使用

```typescript
import { DataSourceManager } from '@/lib/data-sources/manager';
import { CacheManager } from '@/lib/data-sources/cache';
import { configLoader } from '@/lib/data-sources/config-loader';

// 初始化
const config = configLoader.getConfig();
const cacheManager = new CacheManager();
const manager = new DataSourceManager({
  config,
  cacheManager,
  enableCache: true
});

// 综合搜索（联网搜索 + 信源订阅）
const result = await manager.getIntelligence('人工智能', {
  enableWebSearch: true,
  enableFeeds: true,
  maxResults: 50
});

// 仅获取最新信源内容
const feeds = await manager.getLatestFeeds({
  maxResults: 20
});
```

## API接口

### DataSourceManager

#### `getIntelligence(query, options)`

获取综合情报数据（联网搜索 + 信源订阅）

**参数:**
- `query: string` - 搜索查询
- `options?: object`
  - `enableWebSearch?: boolean` - 启用联网搜索（默认: true）
  - `enableFeeds?: boolean` - 启用信源订阅（默认: true）
  - `maxResults?: number` - 最大结果数（默认: 50）
  - `cacheKey?: string` - 自定义缓存键

**返回:** `Promise<DataSourceResult>`

#### `getLatestFeeds(options)`

获取最新信源内容

**参数:**
- `options?: object`
  - `maxResults?: number` - 最大结果数（默认: 50）
  - `cacheKey?: string` - 自定义缓存键

**返回:** `Promise<DataSourceResult>`

#### `clearCache(pattern?)`

清除缓存

**参数:**
- `pattern?: string` - 缓存键模式（可选）

#### `getCacheStats()`

获取缓存统计信息

**返回:** `CacheStats`

## 数据结构

### IntelligenceItem

```typescript
interface IntelligenceItem {
  id: string;                    // 唯一标识
  title: string;                 // 标题
  content: string;               // 内容摘要
  url: string;                   // 原文链接
  source: string;                // 数据源
  publishedAt: string;           // 发布时间
  relevanceScore: number;        // 相关性评分 (0-1)
  metadata?: Record<string, any>; // 元数据
}
```

### DataSourceResult

```typescript
interface DataSourceResult {
  success: boolean;
  data?: {
    items: IntelligenceItem[];
    total: number;
    query: string;
    timestamp: string;
    sources: string[];
    processingTime: number;
  };
  error?: string;
  errors?: string[];
}
```

## HTTP API

### POST /api/unified-search

综合搜索接口

```bash
curl -X POST /api/unified-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "人工智能",
    "enableWebSearch": true,
    "enableFeeds": true,
    "maxResults": 20
  }'
```

### GET /api/unified-search

获取最新信源内容

```bash
curl "/api/unified-search?maxResults=20&useCache=true"
```

### DELETE /api/unified-search

清除缓存

```bash
curl -X DELETE "/api/unified-search?pattern=web-search"
```

### OPTIONS /api/unified-search

获取系统状态

```bash
curl -X OPTIONS /api/unified-search
```

## 扩展开发

### 添加新的搜索引擎

1. 在 `lib/data-sources/web-search/types.ts` 中添加引擎类型
2. 在 `lib/data-sources/web-search/index.ts` 中实现搜索逻辑
3. 在配置文件中添加引擎配置

### 添加新的信源类型

1. 在 `lib/data-sources/feeds/types.ts` 中添加信源类型
2. 创建对应的处理器文件
3. 在 `lib/data-sources/feeds/index.ts` 中集成

### 自定义缓存后端

1. 实现 `CacheManager` 接口
2. 在初始化时传入自定义缓存管理器

## 测试

运行测试脚本：

```bash
node test-data-sources.js
```

## 故障排除

### 常见问题

1. **智谱搜索失败**
   - 检查 `ZHIPU_API_KEY` 环境变量
   - 确认API密钥有效且有足够额度

2. **RSS信源解析失败**
   - 检查RSS URL是否可访问
   - 确认RSS格式正确

3. **缓存问题**
   - 检查内存使用情况
   - 考虑调整缓存大小和TTL

### 调试模式

设置环境变量启用详细日志：

```bash
DEBUG=data-sources:* npm run dev
```

## 性能优化

1. **合理设置缓存TTL**: 根据数据更新频率调整
2. **限制并发数**: 避免过多并发请求
3. **结果分页**: 对大量结果进行分页处理
4. **监控指标**: 定期检查缓存命中率和响应时间

## 许可证

MIT License