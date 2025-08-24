# 替代新闻API服务

## 免费新闻API推荐

### 1. **NewsData.io**
- 网站: https://newsdata.io/
- 免费额度: 每天200次请求
- 特点: 支持多语言，包括中文
- 示例: `https://newsdata.io/api/1/news?apikey=YOUR_API_KEY&language=en`

### 2. **Currents API**
- 网站: https://currentsapi.services/
- 免费额度: 每月600次请求
- 特点: 实时新闻，支持分类
- 示例: `https://api.currentsapi.services/v1/latest-news?apiKey=YOUR_API_KEY`

### 3. **MediaStack**
- 网站: https://mediastack.com/
- 免费额度: 每月500次请求
- 特点: 历史新闻数据
- 示例: `http://api.mediastack.com/v1/news?access_key=YOUR_API_KEY`

### 4. **国内新闻API**
- **聚合数据**: https://www.juhe.cn/
- **阿里云数据API**: https://market.aliyun.com/
- **腾讯云API**: https://cloud.tencent.com/

## 建议配置顺序
1. 先修复 GNews API 密钥
2. 如果 NewsAPI 持续超时，注册 NewsData.io 作为替代
3. 配置多个API源实现容错机制