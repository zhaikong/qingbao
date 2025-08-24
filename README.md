# "烽火"智能情报分析平台

## 1. 项目简介

"烽火"是一个先进的智能情报分析平台，旨在通过聚合多个搜索引擎（智谱AI、DuckDuckGo、SearXNG）的数据源，对信息进行深度分析、评估和整合。平台的核心能力在于其独特的信源可信度评级系统和基于大语言模型的智能报告生成功能，能够为用户提供可信、实时、可溯源的综合情报分析报告。

## 2. 核心功能

- **多引擎统一搜索**: 并行调用多个搜索引擎接口，对结果进行去重和聚合，扩大信息覆盖面。
- **信源可信度评级**: 基于域名黑白名单、域名特征和内容质量，建立了一套从T1（高可信）到T4（低可信）的自动化评级体系。
- **智能报告生成**: 利用大语言模型（LLM），将处理和分析后的高质量信息源，自动生成结构完整、逻辑清晰的分析报告。
- **质量控制体系**: 在数据处理和报告生成环节中，自动检查信源数量、内容重复率和高可信信源占比，确保最终产出的质量。
- **高性能架构**: 通过引入Redis缓存和异步并发处理机制，大幅提升数据采集和处理的效率。

## 3. 技术栈

- **前端**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **后端 (API)**: Next.js API Routes, Node.js
- **核心算法与服务**: Python (用于信源评级、质量控制等核心逻辑), Zhipu AI API
- **数据库与缓存**: PostgreSQL, Redis
- **部署**: Docker, Docker Compose
- **测试**: Jest, Playwright

## 4. 快速启动指南

### 4.1. 环境准备

- Node.js (v18.x 或更高版本)
- pnpm (或 npm/yarn)
- Docker (用于完整部署)

### 4.2. 安装与配置

1.  **克隆项目**
    ```bash
    git clone <your-repo-url>
    cd <project-directory>
    ```

2.  **安装依赖**
    ```bash
    pnpm install
    ```

3.  **配置环境变量**
    复制 `.env.example` 文件为 `.env.local`：
    ```bash
    cp .env.example .env.local
    ```
    编辑 `.env.local` 文件，填入您的智谱AI API Key:
    ```
    ZHIPU_API_KEY="YOUR_ZHIPU_API_KEY"
    ```

### 4.3. 运行项目

- **开发模式**
  ```bash
  pnpm run dev
  ```
  应用将在 `http://localhost:3000` 上运行。您可以访问 `http://localhost:3000/search` 来使用搜索功能。

- **生产模式构建与启动**
  ```bash
  pnpm build
  pnpm start
  ```

## 5. 系统架构与核心实现

### 5.1. 统一搜索接口

通过 `lib/unified-search.ts` 实现，该模块并行请求所有配置的搜索引擎，然后将结果合并和去重。

### 5.2. 信源可信度评级算法

我们设计了一套评分模型来评估每个信息源的可靠性。
*示例代码（Python逻辑）:*
```python
class CredibilityScorer:
    def __init__(self):
        # 加载预定义的域名评级、黑名单和白名单
        self.domain_ratings = self.load_domain_ratings()
        self.blacklist = self.load_blacklist()
        self.whitelist = self.load_whitelist()
    
    def score(self, url: str) -> str:
        domain = self.extract_domain(url)
        
        if domain in self.whitelist['T1']:
            return 'T1'
        if domain in self.blacklist:
            return 'T4'
        
        # 综合域名和内容特征进行评分
        domain_score = self.calculate_domain_score(domain)
        content_score = self.analyze_content_quality(url)
        final_score = (domain_score + content_score) / 2
        
        if final_score >= 0.9: return 'T1'
        elif final_score >= 0.75: return 'T2'
        elif final_score >= 0.6: return 'T3'
        else: return 'T4'
```

### 5.3. API 安全与认证

API路由通过JWT进行保护，确保只有授权用户可以访问。
*示例代码（Python逻辑）:*
```python
class AuthManager:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.algorithm = "HS256"
    
    def create_access_token(self, user_id: int):
        to_encode = {"user_id": user_id, "exp": datetime.utcnow() + timedelta(hours=24)}
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str):
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload.get("user_id")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
```

## 6. 部署方案

项目采用 Docker 进行容器化部署，方便环境隔离和快速迁移。

### Dockerfile
```dockerfile
# 使用官方Node.js镜像作为基础
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lockfile
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装pnpm并安装依赖
RUN npm install -g pnpm
RUN pnpm install

# 复制项目源代码
COPY . .

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]
```

### Docker Compose
使用 `docker-compose.yml` 可一键启动应用及所有依赖服务（如PostgreSQL, Redis）。
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ZHIPU_API_KEY=${ZHIPU_API_KEY}
      # - DATABASE_URL=postgresql://user:password@db:5432/beacon_fire
      # - REDIS_URL=redis://redis:6379
    # depends_on:
    #   - db
    #   - redis

  # db:
  #   image: postgres:14
  #   # ...
  
  # redis:
  #   image: redis:7-alpine
  #   # ...
```

## 7. 测试策略

项目包含单元测试、集成测试和性能测试，以确保代码质量和系统稳定性。

*单元测试示例 (Jest):*
```javascript
// __tests__/unified-search.test.js
import { search } from '../lib/unified-search';
import { zhipuSearch } from '../lib/search-engines/zhipu';

jest.mock('../lib/search-engines/zhipu');

describe('Unified Search', () => {
  it('should call Zhipu engine when selected', async () => {
    zhipuSearch.mockResolvedValue([{ url: 'http://example.com', title: 'Zhipu Result' }]);
    const results = await search('test query', ['zhipu']);
    expect(zhipuSearch).toHaveBeenCalledWith('test query');
    expect(results.length).toBe(1);
  });
});
```

## 8. 项目规划与里程碑

- **第一阶段 (已完成)**:
  - 核心需求与技术选型。
  - 完成多引擎搜索模块和统一搜索接口开发。
  - 搭建前端搜索页面与API路由。

- **第二阶段 (进行中)**:
  - 完善信源评级与质量控制算法。
  - 开发智能报告生成模块。
  - 搭建用户认证与个人中心。

- **第三阶段 (计划中)**:
  - 引入可视化图表分析。
  - 优化报告编辑与分享功能。
  - 启动Beta版本内测。

## 9. 代码结构说明

为了方便您理解和二次开发，以下是项目主要文件和目录的结构说明：

```
.
├── app/                  # Next.js App Router 目录
│   ├── api/              # 后端 API 路由
│   │   └── unified-search/route.ts # 统一搜索的API端点，处理前端请求
│   └── search/           # “/search” 路径对应的页面
│       └── page.tsx      # 搜索页面的前端React组件
├── components/           # UI组件 (基于 shadcn/ui)
├── lib/                  # 核心业务逻辑
│   ├── search-engines/   # 各个搜索引擎的独立实现
│   │   ├── zhipu.ts      # 智谱AI搜索引擎逻辑
│   │   ├── duckduckgo.ts # DuckDuckGo搜索引擎逻辑
│   │   └── searxng.ts    # SearXNG搜索引擎逻辑
│   ├── unified-search.ts # 统一搜索的核心调度器，并行调用上述引擎并整合结果
│   ├── types.ts          # TypeScript类型定义 (如 SearchResult)
│   └── zhipu-client.ts   # 封装智谱AI客户端初始化和JWT鉴权
├── __tests__/            # Jest 测试文件目录
├── public/               # 静态资源 (图片、图标等)
├── .env.local            # 本地环境变量 (包含API Key)
├── next.config.js        # Next.js 配置文件
├── package.json          # 项目依赖与脚本
└── README.md             # 项目说明文档
```

-   **`app/`**: Next.js 13+ 的核心目录，遵循 App Router 模式。`api/` 子目录用于定义后端接口，其他子目录则对应前端页面路由。
-   **`lib/`**: 存放项目的主要业务逻辑，与框架解耦。
    -   **`search-engines/`**: 将每个搜索引擎的实现隔离开，便于独立维护和扩展。
    -   **`unified-search.ts`**: 这是整个搜索功能的中枢，它根据用户的选择动态调用一个或多个搜索引擎，并负责结果的合并与去重。
    -   **`zhipu-client.ts`**: 专门处理与智谱AI服务端的认证逻辑，生成必要的JWT。
-   **`components/`**: 存放可复用的React组件，使UI代码更整洁。
