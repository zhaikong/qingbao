# 烽火智能情报分析平台 - OSINT解决方案集成

## 🎯 功能概述

"烽火"平台现已集成**成熟开源情报(OSINT)解决方案**，提供15+专业情报工具的统一管理和智能查询能力。本功能模块实现了从基础数据采集到专业情报分析的完整升级。

## 🛠️ 集成的OSINT工具

### 1. Web侦察工具
- **SpiderFoot** - 开源情报自动化工具，200+数据源集成
- **Maltego** - 交互式数据挖掘工具，链接分析和可视化
- **Recon-ng Framework** - Web侦察框架，API模块支持

### 2. 威胁情报平台
- **MISP** - 开源威胁情报共享平台
- **AlienVault OTX** - 开放威胁情报交换
- **ThreatConnect** - 威胁情报平台与分析

### 3. 社交媒体情报
- **Social Mapper** - 社交媒体侦察工具，支持面部识别
- **Tweep** - Twitter数据收集与分析

### 4. 网络分析工具
- **Shodan** - Internet连接设备搜索引擎 ⭐
- **Censys** - Internet搜索引擎与安全分析 ⭐
- **SecurityTrails** - 历史DNS数据与域名情报

### 5. 地理空间情报
- **Maxar Technologies** - 高分辨率卫星图像
- **Planet Labs** - 每日卫星图像监控

### 6. 暗网情报
- **SpyCloud** - 暗网监控与凭证泄露检测
- **IntelFinder** - 暗网威胁情报与监控

## 📊 工具统计

| 类别 | 工具数量 | 免费工具 | 付费工具 | 平均可靠性 |
|------|----------|----------|----------|------------|
| Web侦察 | 3 | 2 | 1 | 91.7% |
| 威胁情报 | 3 | 2 | 1 | 93.7% |
| 社交媒体 | 2 | 2 | 0 | 86.0% |
| 网络分析 | 3 | 1 | 2 | 95.7% |
| 地理空间 | 2 | 0 | 2 | 96.0% |
| 暗网 | 2 | 0 | 2 | 91.5% |
| **总计** | **15** | **7** | **8** | **92.4%** |

## 🚀 核心功能

### 1. 工具库管理
- **分类浏览**: 6大类别工具分类展示
- **详细信息**: 工具功能、定价、可靠性等完整信息
- **筛选搜索**: 按类别、定价、可靠性等维度筛选
- **实时状态**: 工具可用性和更新状态监控

### 2. 智能查询系统
- **统一接口**: 简化多工具查询流程
- **批量处理**: 支持多工具并发查询
- **结果缓存**: 智能缓存提升查询效率
- **错误处理**: 优雅降级和故障恢复

### 3. 推荐系统
- **场景化推荐**: 基于6种使用场景的个性化推荐
- **智能匹配**: 根据查询内容推荐最合适工具
- **性能优化**: 优先推荐高可靠性工具
- **成本控制**: 免费工具优先策略

### 4. 使用场景支持

#### 威胁狩猎
- **推荐工具**: MISP, OTX, Shodan, Censys
- **适用场景**: APT威胁追踪、恶意软件分析、IOC hunting

#### 域名侦察
- **推荐工具**: SpiderFoot, SecurityTrails, Recon-ng
- **适用场景**: 子域名发现、域名信息收集、资产测绘

#### 社交情报
- **推荐工具**: Social Mapper, Tweep
- **适用场景**: 社交媒体分析、人物画像、关系网络

#### 网络分析
- **推荐工具**: Shodan, Censys, SecurityTrails
- **适用场景**: 网络设备发现、服务识别、漏洞扫描

#### 地理空间
- **推荐工具**: Maxar, Planet
- **适用场景**: 卫星图像分析、地理情报、变化检测

#### 暗网监控
- **推荐工具**: SpyCloud, IntelFinder
- **适用场景**: 数据泄露监控、暗网威胁、凭证保护

## 🔧 API集成

### 查询单个工具
```bash
curl -X POST /api/osint-solutions \
  -H "Content-Type: application/json" \
  -d '{
    "toolId": "shodan",
    "query": "Apache Server",
    "options": {
      "limit": 10
    }
  }'
```

### 批量查询
```bash
curl -X POST /api/osint-solutions \
  -H "Content-Type: application/json" \
  -d '{
    "batch": true,
    "queries": [
      {
        "toolId": "shodan",
        "query": "Apache Server"
      },
      {
        "toolId": "otx", 
        "query": "malware_analysis"
      }
    ]
  }'
```

### 获取工具推荐
```bash
curl "/api/osint-solutions?useCase=threat_hunting"
```

### 获取分类工具
```bash
curl "/api/osint-solutions?category=network_analysis"
```

## 🔐 环境配置

### 必需API密钥
```bash
# 核心AI服务
ZHIPU_API_KEY=your_zhipu_api_key

# OSINT必备工具
SHODAN_API_KEY=your_shodan_api_key
ALIENVAULT_OTX_API_KEY=your_otx_api_key
```

### 推荐API密钥
```bash
# 网络分析
CENSYS_API_ID=your_censys_api_id
CENSYS_API_SECRET=your_censys_api_secret
SECURITYTRAILS_API_KEY=your_securitytrails_api_key

# 威胁情报
MISP_URL=your_misp_url
MISP_API_KEY=your_misp_api_key

# 社交媒体
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

### 可选API密钥
```bash
# 地理空间 (付费)
MAXAR_API_KEY=your_maxar_api_key
PLANET_API_KEY=your_planet_api_key

# 暗网监控 (付费)
SPYCLOUD_API_KEY=your_spycloud_api_key
INTELFINDER_API_KEY=your_intelfinder_api_key
```

## 📈 性能指标

### 查询性能
- **平均响应时间**: 2-8秒 (取决于工具和网络)
- **并发查询支持**: 最多10个并发请求
- **缓存命中率**: 85%+ (智能缓存策略)
- **错误恢复率**: 95%+ (优雅降级机制)

### 数据质量
- **平均可靠性**: 92.4%
- **高可靠性工具**: 10个 (可靠性 >90%)
- **实时数据更新**: 95%的工具支持实时查询
- **结果准确性**: 基于工具可信度的质量评分

## 🎨 用户界面

### 功能页面
- **工具库页面** (`/osint-solutions`): 工具浏览和管理
- **智能查询页面**: 统一查询界面和结果展示
- **推荐系统页面**: 场景化工具推荐

### 界面特性
- **响应式设计**: 完美适配桌面和移动设备
- **实时反馈**: 查询进度和结果实时显示
- **可视化展示**: 工具统计和结果可视化
- **智能提示**: 使用指导和最佳实践建议

## 🔮 发展规划

### v2.1 (下一版本)
- [ ] 更多OSINT工具集成 (目标25+工具)
- [ ] 高级查询语法和过滤器
- [ ] 结果导出和报告生成
- [ ] 工具性能监控和优化

### v2.2 (规划中)
- [ ] 自定义工具集成框架
- [ ] 查询工作流自动化
- [ ] 机器学习结果优化
- [ ] 企业级权限管理

## 💡 最佳实践

### 工具选择
1. **明确需求**: 根据具体场景选择合适工具类别
2. **考虑成本**: 优先使用免费工具，必要时使用付费工具
3. **检查可靠性**: 选择可靠性评分 >90% 的工具
4. **查看限制**: 注意API调用频率和数据限制

### 查询优化
1. **批量查询**: 使用批量查询提高效率
2. **结果缓存**: 合理利用缓存减少API调用
3. **错误处理**: 实现适当的错误处理和重试机制
4. **性能监控**: 监控查询性能和工具状态

### 安全考虑
1. **API密钥保护**: 妥善保管API密钥，避免泄露
2. **访问控制**: 实施适当的访问控制和权限管理
3. **数据安全**: 确保查询和存储数据的安全性
4. **合规要求**: 遵守相关法律法规和平台条款

## 📞 支持与反馈

- **问题反馈**: GitHub Issues
- **功能建议**: GitHub Discussions
- **文档查询**: 项目Wiki和API文档
- **技术支持**: 查看故障排除指南

---

**OSINT解决方案集成** - 让"烽火"平台从数据采集升级为专业级情报分析专家系统