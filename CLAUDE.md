# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 开发命令

### 核心开发
- `npm run dev` - 启动开发服务器 (Next.js)，运行在 http://localhost:3000
- `npm run build` - 构建生产环境应用
- `npm start` - 启动生产服务器

### 测试
- `npm run test` - 运行 Jest 单元测试
- `npm run test:watch` - 以监视模式运行 Jest 测试
- `npm run test:coverage` - 运行 Jest 测试并生成覆盖率报告
- `npm run test:e2e` - 运行 Playwright 端到端测试
- `npm run test:e2e:ui` - 运行带 UI 的 Playwright 测试
- `npm run test:all` - 运行所有测试（单元测试 + 端到端测试）

### 代码质量
- `npm run lint` - 运行 Next.js 代码检查器

## 项目架构

### 核心系统
这是一个名为"烽火"的中文情报分析平台，它聚合来自多个搜索引擎的数据，并使用 AI 生成综合分析报告。

### 关键组件

#### 1. 增强型数据源管理器 (`lib/enhanced-data-sources.ts`) - **2.0新增**
- **多渠道数据采集**: Bing搜索、NewsAPI、Wikipedia、arXiv、GitHub、Reddit等
- **智能内容分析**: 情感分析、主题提取、实体识别、语言检测
- **动态可信度评估**: 基于
来源、新鲜度、内容质量的综合评分
- **多语言支持**: 自动语言检测和翻译能力
- **优雅降级**: 根据API可用性自动调整数据源策略

#### 2. 智能内容提取器 (`lib/intelligent-content-extractor.ts`) - **2.0新增**
- **多格式内容解析**: HTML、PDF、Markdown等格式的智能提取
- **Firecrawl集成**: 高质量网页内容提取服务
- **内容结构分析**: 标题层级、段落结构、章节划分
- **质量评估**: 可读性、信息量、可信度的自动评估
- **元数据提取**: 作者、发布时间、内容类型等信息

#### 3. 增强型报告生成器 (`lib/enhanced-report-generator.ts`) - **2.0重构**
- **6阶段生成流程**: 数据采集 → 内容提取 → 质量评估 → AI生成 → 质量验证 → 结构化输出
- **多种分析深度**: basic、detailed、expert、strategic四个级别
- **目标受众适配**: general、professional、academic、executive四种模式
- **紧急程度调节**: low、medium、high、critical四档响应速度
- **7维质量评分**: 数据质量、分析深度、结构质量、可执行性、可靠性、完整性

#### 4. 原始搜索系统 (`lib/unified-search.ts`) - **Legacy**
- 聚合来自多个搜索引擎的结果：智谱 AI、DuckDuckGo、SearXNG
- 并行执行并处理错误
- 基于 URL 的结果去重
- 位于 `lib/search-engines/` 目录，包含各个引擎的独立实现

#### 5. 原始数据源管理 (`lib/data-sources/manager.ts`) - **Legacy**
- 统一管理网络搜索和 RSS 订阅的数据源
- 可配置 TTL 的缓存管理
- 支持 YAML 配置的数据源
- 集成性能监控

#### 6. 原始报告生成 (`lib/report-generator.ts`) - **Legacy**
- 使用智谱 AI 的 AI 驱动报告生成
- 多种报告模板：综合、简要、技术、政策、市场
- 多阶段流程：数据收集 → 质量评估 → AI 生成 → 后处理
- 数据源的复杂质量评分系统

#### 7. 质量评估 (`lib/quality-assessment.ts`)
- 综合质量评估系统
- 数据源可信度评分（T1-T4 评级系统）
- 内容质量、结构质量和数据质量评估
- 详细指标和改进建议

### 目录结构

#### 前端 (`app/`)
- Next.js App Router 结构
- API 路由位于 `app/api/`
- 仪表板、搜索、分析、项目的页面组件
- 身份验证页面（登录、注册）

#### 组件 (`components/`)
- 使用 shadcn/ui 设计系统的 React 组件
- 核心组件：Dashboard、ReportGeneration、DataSourceStatus
- UI 组件位于 `components/ui/`
- 身份验证提供者位于 `components/providers/`

#### 核心逻辑 (`lib/`)
- 业务逻辑与框架代码分离
- 数据处理、LLM 管理、搜索引擎
- 缓存管理和性能监控
- 类型定义位于 `lib/types.ts`

### 配置文件
- `jest.config.js` - Jest 配置，包含模块路径映射
- `playwright.config.ts` - 端到端测试配置
- `next.config.js` - Next.js 配置（最小化）
- `config/data-sources.yaml` - 数据源配置

### 测试策略
- 使用 Jest 在 `__tests__/` 目录中进行单元测试
- 使用 Playwright 在 `e2e/` 目录中进行端到端测试
- 测试工具位于 `__tests__/test-utils.tsx`
- UI 组件的组件测试
- API 端点测试

### 环境要求
- 需要 Node.js v18+
- **必需环境变量**: `ZHIPU_API_KEY` (智谱AI API密钥)
- **推荐环境变量**: 
  - `BING_API_KEY` (Bing搜索API)
  - `NEWSAPI_KEY` (NewsAPI新闻数据)
  - `FIRECRAWL_API_KEY` (网页内容提取)
  - `GITHUB_TOKEN` (GitHub技术信息)
- **可选环境变量**: `GOOGLE_API_KEY`, `GOOGLE_CSE_ID` (Google搜索)
- 整个代码库使用 TypeScript
- 参考 `.env.example.enhanced` 配置环境变量

### API 端点

#### 增强型报告生成 - **2.0新增**
- `POST /api/enhanced-report` - 生成增强型智能报告
- `GET /api/enhanced-report` - 获取系统状态和配置信息

#### 原始报告生成 - **Legacy**
- `POST /api/generate-report` - 生成基础报告
- `GET /api/data-sources` - 获取数据源状态
- 其他现有API端点保持不变

### 主要功能

#### 2.0版本新增功能
- **多源实时数据采集**: 6个以上数据源并行采集
- **智能内容深度提取**: 完整网页内容的智能解析
- **多维度质量评估**: 7个维度的综合质量评分
- **动态分析策略**: 根据紧急程度和目标受众调整分析方式
- **增强型缓存机制**: 智能缓存策略提高响应速度

#### 原有功能
- 多源情报收集
- 带质量控制的 AI 驱动报告生成
- 信息源可信度评分系统
- 性能优化缓存
- 用户身份验证和项目管理
- 实时数据源状态监控

### 开发指南

#### 使用增强型系统
```typescript
// 使用增强型报告生成器
import { generateAdvancedIntelligenceReport } from '@/lib/enhanced-report-generator'

const report = await generateAdvancedIntelligenceReport('AI发展趋势', {
  template: 'comprehensive',
  analysisDepth: 'expert',
  targetAudience: 'professional',
  urgencyLevel: 'medium'
})
```

#### 配置数据源
1. 复制 `.env.example.enhanced` 为 `.env.local`
2. 配置必需的 `ZHIPU_API_KEY`
3. 根据需要配置其他API密钥
4. 系统会根据可用API自动调整数据源使用

#### 运行测试
```bash
# 运行增强型系统测试
npm test -- enhanced-data-sources.test.ts

# 检查数据源配置状态
npm run dev
# 访问 GET /api/enhanced-report 查看系统状态
```

### 性能优化建议
- 配置多个数据源API以提高数据质量和可靠性
- 根据使用场景选择合适的 `contentDepth` 和 `analysisDepth`
- 对于高频使用的查询，适当增加缓存TTL
- 监控API配额使用情况，避免超出限制

"烽火"智能情报分析平台 - 项目文档说明

  🎯 项目概览

  项目名称： 烽火智能情报分析平台 (Fenghuo Intelligence Platform)版本：
  v0.1.0定位： 先进的AI驱动情报分析与报告生成平台

  ✨ 核心价值与设计特色

  🎨 界面设计亮点

  - 现代化UI设计： 基于 shadcn/ui 组件库，采用优雅的设计系统
  - 响应式布局： 完美适配桌面端和移动端
  - 直观的用户体验： 清晰的信息架构和流畅的交互流程
  - 专业的数据可视化： 高质量的图表和进度展示

  🚀 技术架构优势

  - 前端： Next.js 14 + React 18 + TypeScript + Tailwind CSS
  - UI组件： Radix UI + shadcn/ui 设计系统
  - 状态管理： React Hooks + Context API
  - API集成： 多引擎并行搜索 + AI报告生成
  - 测试覆盖： Jest单元测试 + Playwright端到端测试

  🔧 核心功能模块

  1. 🔍 多引擎统一搜索系统

  技术实现： lib/unified-search.ts
  - 智谱AI搜索： 集成最新AI搜索引擎
  - DuckDuckGo： 保护隐私的传统搜索
  - SearXNG： 开源元搜索引擎
  - 并行处理： 异步并发，结果实时聚合
  - 智能去重： 基于URL的高效去重算法

  2. 📊 信源可信度评级系统

  算法特色： T1-T4四级评级体系
  - T1 (高可信)： 权威媒体、政府官网、学术机构
  - T2 (较可信)： 知名媒体、行业报告
  - T3 (一般可信)： 普通媒体、博客
  - T4 (低可信)： 不明来源、可疑网站

  3. 🤖 AI驱动报告生成

  智能特性：
  - 6阶段生成流程： 数据采集→内容提取→质量评估→AI生成→质量验证→结构化输出
  - 4种分析深度： Basic、Detailed、Expert、Strategic
  - 4种目标受众： General、Professional、Academic、Executive
  - 4档紧急程度： Low、Medium、High、Critical

  4. 🎯 增强型数据源管理

  2.0版本新增： lib/enhanced-data-sources.ts
  - 多渠道采集： Bing、NewsAPI、Wikipedia、arXiv、GitHub、Reddit
  - 智能分析： 情感分析、主题提取、实体识别
  - 动态评估： 基于来源、新鲜度、内容质量的综合评分
  - 多语言支持： 自动语言检测和翻译

  🎨 界面设计展示

  主要页面布局：

  - 🏠 仪表板页面： 数据概览、快速访问、状态监控
  - 🔍 搜索页面： 多引擎搜索、实时结果展示
  - 📈 分析页面： 深度分析工具、可视化图表
  - 📋 项目管理： 项目创建、报告生成、历史记录
  - 👤 用户中心： 个人设置、权限管理

  关键UI组件：

  - ReportGeneration： 报告生成核心组件
  - Dashboard： 仪表板数据展示
  - DataSourceStatus： 数据源状态监控
  - IntelligentProgressDisplay： 智能进度展示
  - ModelSelector： AI模型选择器

  📁 项目结构说明

  📦 情报/
  ├── 🎯 app/                    # Next.js App Router
  │   ├── 🔌 api/               # 后端API路由
  │   │   ├── enhanced-report/   # 增强型报告生成
  │   │   ├── generate-report/   # 基础报告生成
  │   │   ├── unified-search/    # 统一搜索接口
  │   │   └── data-sources/      # 数据源管理
  │   ├── 🏠 dashboard/         # 仪表板页面
  │   ├── 🔍 search/            # 搜索功能页面
  │   ├── 📈 analysis/          # 分析工具页面
  │   ├── 📋 projects/          # 项目管理页面
  │   └── 🔐 auth/              # 用户认证页面
  ├── 🧩 components/            # UI组件库
  │   ├── ui/                   # 基础UI组件
  │   └── providers/            # 上下文提供者
  ├── 🔧 lib/                   # 核心业务逻辑
  │   ├── search-engines/       # 搜索引擎实现
  │   ├── data-sources/         # 数据源管理
  │   ├── llm/                  # 大语言模型管理
  │   └── intelligence-apis/    # 情报API集成
  ├── 🧪 __tests__/             # 单元测试
  ├── 🎭 e2e/                   # 端到端测试
  └── ⚙️ config/                # 配置文件

  🚀 快速启动指南

  环境要求：

  - Node.js 18+
  - npm/pnpm/yarn
  - 智谱AI API密钥

  安装步骤：

  # 1. 安装依赖
  npm install

  # 2. 配置环境变量
  cp .env.example .env.local
  # 编辑 .env.local，添加 ZHIPU_API_KEY

  # 3. 启动开发服务器
  npm run dev

  # 4. 访问应用
  # http://localhost:3000

  开发命令：

  npm run dev          # 开发服务器
  npm run build        # 生产构建
  npm run test         # 单元测试
  npm run test:e2e     # 端到端测试
  npm run test:all     # 全部测试
  npm run lint         # 代码检查

  🎯 发展路线图

  ✅ 第一阶段（已完成）

  - 核心搜索功能开发
  - 基础UI界面设计
  - 多引擎集成

  🔄 第二阶段（进行中）

  - 增强型报告生成系统
  - 用户认证与权限管理
  - 数据源质量评估

  📋 第三阶段（计划中）

  - 可视化分析图表
  - 协作与分享功能
  - Beta版本发布

  🛡️ 质量保证

  测试策略：

  - 单元测试： Jest + React Testing Library
  - 集成测试： API接口测试
  - 端到端测试： Playwright自动化测试
  - 性能测试： 响应时间和并发测试

  代码质量：

  - TypeScript： 全项目类型安全
  - ESLint： 代码规范检查
  - Prettier： 代码格式化
  - Husky： Git钩子管理

  🎨 设计系统

  颜色方案：

  - 主色调： 专业蓝色系列
  - 辅助色： 温暖橙色点缀
  - 状态色： 成功绿/警告黄/错误红
  - 中性色： 灰色层次丰富

  组件规范：

  - 按钮： 多种尺寸和状态
  - 表单： 统一的输入组件
  - 数据展示： 表格、卡片、徽章
  - 导航： 侧边栏、面包屑、标签页

  📈 性能优化

  前端优化：

  - 代码分割： 按路由动态加载
  - 图片优化： Next.js Image组件
  - 缓存策略： 浏览器缓存和CDN
  - 打包优化： Tree-shaking和压缩

  后端优化：

  - API缓存： Redis集成
  - 并发处理： 异步并行请求
  - 错误处理： 优雅降级机制
  - 监控告警： 性能指标追踪

  ---
  总结： "烽火"智能情报分析平台是一个设计精美、功能强大的现代化情报分析系统
  。项目采用最新的前端技术栈，具有出色的用户体验和强大的AI分析能力。当前的
  界面设计已经非常优秀，建议保持现有的设计风格，专注于功能完善和性能优化。