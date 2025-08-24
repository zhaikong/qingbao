// Enhanced Intelligence Data Collection System
// 集成多个权威情报源的实时数据采集系统

import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';

// 情报数据类型定义
export interface IntelligenceData {
  id: string;
  source: string;
  type: 'threat' | 'geopolitical' | 'business' | 'security' | 'news';
  title: string;
  content: string;
  url?: string;
  timestamp: Date;
  credibility: number; // 0-1 评分
  tags: string[];
  metadata: Record<string, any>;
  extractedEntities?: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    keywords: string[];
  };
}

// 情报源配置
export interface IntelligenceSource {
  id: string;
  name: string;
  type: 'api' | 'rss' | 'web';
  category: 'threat' | 'geopolitical' | 'business' | 'security' | 'news';
  baseUrl: string;
  apiKey?: string;
  rateLimit: number; // 请求间隔(毫秒)
  credibility: number; // 0-1 评分
  enabled: boolean;
  lastSync?: Date;
  lastError?: string;
  config: Record<string, any>;
}

// 增强型情报采集系统
export class EnhancedIntelligenceCollector extends EventEmitter {
  private sources: Map<string, IntelligenceSource> = new Map();
  private cache: NodeCache;
  private apiClients: Map<string, AxiosInstance> = new Map();
  private isRunning = false;
  private syncInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1小时缓存
    this.initializeDefaultSources();
  }

  // 初始化默认情报源
  private initializeDefaultSources(): void {
    const defaultSources: IntelligenceSource[] = [
      // 威胁情报源
      {
        id: 'virustotal',
        name: 'VirusTotal',
        type: 'api',
        category: 'threat',
        baseUrl: 'https://www.virustotal.com/vtapi/v2',
        credibility: 0.95,
        rateLimit: 60000, // 1分钟
        enabled: true,
        config: { maxResults: 100 }
      },
      {
        id: 'alienvault-otx',
        name: 'AlienVault OTX',
        type: 'api',
        category: 'threat',
        baseUrl: 'https://otx.alienvault.com/api/v1',
        credibility: 0.90,
        rateLimit: 30000, // 30秒
        enabled: true,
        config: { limit: 50 }
      },
      {
        id: 'abuse-ch',
        name: 'Abuse.ch',
        type: 'rss',
        category: 'threat',
        baseUrl: 'https://feed.abuse.ch/rss/',
        credibility: 0.88,
        rateLimit: 300000, // 5分钟
        enabled: true,
        config: {}
      },

      // 地缘政治情报源
      {
        id: 'gdelt',
        name: 'GDELT Project',
        type: 'api',
        category: 'geopolitical',
        baseUrl: 'https://api.gdeltproject.org/api/v2',
        credibility: 0.92,
        rateLimit: 60000, // 1分钟
        enabled: true,
        config: { maxRecords: 250 }
      },
      {
        id: 'acled',
        name: 'ACLED',
        type: 'api',
        category: 'geopolitical',
        baseUrl: 'https://api.acleddata.com',
        credibility: 0.90,
        rateLimit: 120000, // 2分钟
        enabled: true,
        config: {}
      },

      // 商业情报源
      {
        id: 'alpha-vantage',
        name: 'Alpha Vantage',
        type: 'api',
        category: 'business',
        baseUrl: 'https://www.alphavantage.co/query',
        credibility: 0.85,
        rateLimit: 12000, // 12秒
        enabled: true,
        config: { outputsize: 'compact' }
      },
      {
        id: 'world-bank',
        name: 'World Bank',
        type: 'api',
        category: 'business',
        baseUrl: 'https://api.worldbank.org/v2',
        credibility: 0.98,
        rateLimit: 3600000, // 1小时
        enabled: true,
        config: { format: 'json' }
      },

      // 新闻情报源
      {
        id: 'news-api',
        name: 'News API',
        type: 'api',
        category: 'news',
        baseUrl: 'https://newsapi.org/v2',
        credibility: 0.82,
        rateLimit: 60000, // 1分钟
        enabled: false, // 禁用以避免卡顿（无key或网络不稳定时跳过）
        config: { pageSize: 100 }
      },
      {
        id: 'reuters',
        name: 'Reuters',
        type: 'rss',
        category: 'news',
        baseUrl: 'https://feeds.reuters.com/reuters/topNews',
        credibility: 0.94,
        rateLimit: 300000, // 5分钟
        enabled: true,
        config: {}
      }
    ];

    defaultSources.forEach(source => {
      this.sources.set(source.id, source);
      this.createApiClient(source);
    });
  }

  // 创建API客户端
  private createApiClient(source: IntelligenceSource): void {
    if (source.type === 'api') {
      const client = axios.create({
        baseURL: source.baseUrl,
        timeout: 10000, // 减少超时时间到10秒，避免长时间阻塞
        headers: {
          'User-Agent': 'Fenghuo-Intelligence-Platform/1.0',
          'Accept': 'application/json'
        }
      });

      // 添加API密钥（如果配置了环境变量）
      if (source.apiKey) {
        client.defaults.headers.common['Authorization'] = `Bearer ${source.apiKey}`;
      }

      // 添加请求和响应拦截器用于错误处理
      client.interceptors.request.use(
        (config) => {
          console.log(`🔄 API请求: ${source.id} - ${config.url}`);
          return config;
        },
        (error) => {
          console.error(`❌ API请求错误: ${source.id}`, error);
          return Promise.reject(error);
        }
      );

      client.interceptors.response.use(
        (response) => {
          console.log(`✅ API响应成功: ${source.id} - ${response.status}`);
          return response;
        },
        (error) => {
          if (error.code === 'ECONNABORTED') {
            console.warn(`⏰ API超时: ${source.id} - 跳过此数据源`);
          } else {
            console.error(`❌ API响应错误: ${source.id}`, error.message);
          }
          return Promise.reject(error);
        }
      );

      this.apiClients.set(source.id, client);
    }
  }

  // 添加自定义情报源
  public addSource(source: IntelligenceSource): void {
    this.sources.set(source.id, source);
    if (source.type === 'api') {
      this.createApiClient(source);
    }
    this.emit('sourceAdded', source);
  }

  // 启动实时采集
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.emit('started');

    // 立即执行一次采集
    await this.collectFromAllSources();

    // 设置定时采集
    this.syncInterval = setInterval(async () => {
      await this.collectFromAllSources();
    }, 300000); // 5分钟采集一次
  }

  // 停止采集
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    this.emit('stopped');
  }

  // 从所有源采集数据
  private async collectFromAllSources(): Promise<void> {
    const enabledSources = Array.from(this.sources.values()).filter(
      source => source.enabled && !source.baseUrl.includes('newsapi.org')
    );
    const promises: Promise<IntelligenceData[]>[] = [];
    let completedSources = 0;

    console.log(`🚀 开始从 ${enabledSources.length} 个数据源采集信息`);

    for (const source of enabledSources) {
      const promise = this.collectFromSource(source).then(data => {
        completedSources++;
        const progress = (completedSources / enabledSources.length) * 100;
        console.log(`📊 数据源进度: ${progress.toFixed(1)}% (${completedSources}/${enabledSources.length})`);
        return data;
      }).catch(error => {
        completedSources++;
        const progress = (completedSources / enabledSources.length) * 100;
        console.warn(`⚠️ 数据源 ${source.name} 失败，继续下一个... 进度: ${progress.toFixed(1)}%`);
        return []; // 返回空数组而不是抛出错误
      });
      
      promises.push(promise);
    }

    try {
      const results = await Promise.allSettled(promises);
      let totalCollected = 0;
      let successfulSources = 0;
      let failedSources = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalCollected += result.value.length;
          if (result.value.length > 0) {
            successfulSources++;
          }
          result.value.forEach(data => this.emit('dataCollected', data));
        } else {
          failedSources++;
          console.error(`❌ 数据源失败: ${enabledSources[index].name}`, result.reason);
          this.emit('error', result.reason);
        }
      });

      console.log(`✅ 数据采集完成! 成功: ${successfulSources}, 失败: ${failedSources}, 总数据: ${totalCollected}`);
      this.emit('collectionComplete', { 
        totalCollected, 
        sourcesCount: enabledSources.length,
        successful: successfulSources, 
        failed: failedSources 
      });
    } catch (error) {
      console.error('❌ 数据采集过程中发生严重错误:', error);
      this.emit('error', error);
    }
  }

  // 从单个源采集数据
  private async collectFromSource(source: IntelligenceSource): Promise<IntelligenceData[]> {
    // 修复缓存键：使用查询内容而不是时间戳，避免重复请求
    const queryHash = Buffer.from(JSON.stringify(source.config || {})).toString('base64').substring(0, 8)
    const cacheKey = `source_${source.id}_${queryHash}`;
    
    // 检查缓存（5分钟内有效）
    const cached = this.cache.get<IntelligenceData[]>(cacheKey);
    if (cached) {
      console.log(`💾 使用缓存数据: ${source.name} (避免重复请求)`);
      return cached;
    }

    const startTime = Date.now();
    console.log(`🔄 开始采集: ${source.name} (${source.type})`);

    // 无密钥则直接跳过（按用户要求）
    if (source.id === 'news-api' && !(source.apiKey || process.env.NEWSAPI_KEY)) {
      console.warn('⏭️ News API未配置密钥，已跳过');
      return [];
    }

    try {
      let data: IntelligenceData[] = [];

      switch (source.type) {
        case 'api':
          data = await this.collectFromApi(source);
          break;
        case 'rss':
          data = await this.collectFromRss(source);
          break;
        case 'web':
          data = await this.collectFromWeb(source);
          break;
        default:
          console.warn(`⚠️ 未知的数据源类型: ${source.type}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ 采集完成: ${source.name} - ${data.length}条数据 (${duration}ms)`);

      // 更新源状态
      source.lastSync = new Date();
      this.sources.set(source.id, source);

      // 缓存结果
      this.cache.set(cacheKey, data, source.rateLimit / 1000);

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as any;
      const code = err?.code as string | undefined;
      const message = typeof err?.message === 'string' ? err.message : String(err);

      if (code === 'ECONNABORTED') {
        console.warn(`⏰ 数据源超时: ${source.name} (${duration}ms) - 跳过`);
      } else {
        console.error(`❌ 数据源采集失败: ${source.name} (${duration}ms)`, message);
      }
      
      // 标记源为有问题但不抛出错误
      source.lastError = message;
      source.lastSync = new Date();
      this.sources.set(source.id, source);
      
      return []; // 返回空数组而不是抛出错误
    }
  }

  // 从API采集数据
  private async collectFromApi(source: IntelligenceSource): Promise<IntelligenceData[]> {
    const client = this.apiClients.get(source.id);
    if (!client) {
      return [];
    }

    try {
      if (source.id === 'news-api') {
        const apiKey = source.apiKey || process.env.NEWSAPI_KEY;
        if (!apiKey) {
          console.warn('⏭️ News API未配置密钥，跳过此源');
          return [];
        }
        const response = await client.get('/everything', {
          headers: { 'X-Api-Key': apiKey },
          params: {
            q: (source.config && source.config.q) ? source.config.q : 'latest',
            pageSize: Math.min((source.config && source.config.pageSize) ? source.config.pageSize : 50, 100),
            language: (source.config && source.config.language) ? source.config.language : 'en'
          },
          timeout: 8000
        });
        return this.processApiResponse(response.data, source);
      }

      const response = await client.get('', {
        params: source.config,
        timeout: 8000
      });

      return this.processApiResponse(response.data, source);
    } catch (error) {
      console.error(`API error for ${source.name}:`, error);
      return [];
    }
  }

  // 从RSS采集数据
  private async collectFromRss(source: IntelligenceSource): Promise<IntelligenceData[]> {
    try {
      const response = await axios.get(source.baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Fenghuo-Intelligence-Platform/1.0'
        }
      });

      return this.processRssResponse(response.data, source);
    } catch (error) {
      console.error(`RSS error for ${source.name}:`, error);
      return [];
    }
  }

  // 从网页采集数据
  private async collectFromWeb(source: IntelligenceSource): Promise<IntelligenceData[]> {
    // 实现网页数据采集逻辑
    // 这里可以集成puppeteer或cheerio进行网页解析
    return [];
  }

  // 处理API响应
  private processApiResponse(data: any, source: IntelligenceSource): IntelligenceData[] {
    const results: IntelligenceData[] = [];

    // 根据不同的源处理不同的响应格式
    switch (source.id) {
      case 'virustotal':
        return this.processVirusTotalResponse(data, source);
      case 'alienvault-otx':
        return this.processAlienVaultResponse(data, source);
      case 'news-api':
        return this.processNewsApiResponse(data, source);
      case 'alpha-vantage':
        return this.processAlphaVantageResponse(data, source);
      default:
        return this.processGenericApiResponse(data, source);
    }
  }

  // 处理VirusTotal响应
  private processVirusTotalResponse(data: any, source: IntelligenceSource): IntelligenceData[] {
    const results: IntelligenceData[] = [];

    if (data.detected_urls) {
      data.detected_urls.forEach((item: any) => {
        results.push({
          id: `vt_${item.positives}_${item.scan_date}`,
          source: source.name,
          type: 'threat',
          title: `Malicious URL detected: ${item.url}`,
          content: `URL: ${item.url}\nPositives: ${item.positives}/${item.total}\nScan Date: ${item.scan_date}`,
          url: item.url,
          timestamp: new Date(item.scan_date),
          credibility: source.credibility,
          tags: ['malware', 'url', 'threat'],
          metadata: {
            positives: item.positives,
            total: item.total,
            scan_date: item.scan_date
          }
        });
      });
    }

    return results;
  }

  // 处理AlienVault OTX响应
  private processAlienVaultResponse(data: any, source: IntelligenceSource): IntelligenceData[] {
    const results: IntelligenceData[] = [];

    if (data.results) {
      data.results.forEach((item: any) => {
        results.push({
          id: `otx_${item.id}`,
          source: source.name,
          type: 'threat',
          title: item.name || 'Threat Intelligence',
          content: item.description || 'No description available',
          url: item.url,
          timestamp: new Date(item.created),
          credibility: source.credibility,
          tags: item.tags || [],
          metadata: {
            author: item.author_name,
            pulses: item.pulses_count,
            votes: item.votes
          }
        });
      });
    }

    return results;
  }

  // 处理News API响应
  private processNewsApiResponse(data: any, source: IntelligenceSource): IntelligenceData[] {
    const results: IntelligenceData[] = [];

    if (data.articles) {
      data.articles.forEach((article: any) => {
        results.push({
          id: `news_${article.publishedAt}_${article.source.id}`,
          source: source.name,
          type: 'news',
          title: article.title,
          content: article.description || article.content,
          url: article.url,
          timestamp: new Date(article.publishedAt),
          credibility: source.credibility,
          tags: [article.source.name, 'news'],
          metadata: {
            author: article.author,
            source: article.source.name,
            imageUrl: article.urlToImage
          }
        });
      });
    }

    return results;
  }

  // 处理Alpha Vantage响应
  private processAlphaVantageResponse(data: any, source: IntelligenceSource): IntelligenceData[] {
    const results: IntelligenceData[] = [];

    // 处理股票数据
    if (data['Time Series (Daily)']) {
      const timeSeries = data['Time Series (Daily)'];
      const symbol = data['Meta Data']['2. Symbol'];
      
      Object.entries(timeSeries).forEach(([date, values]: [string, any]) => {
        results.push({
          id: `av_${symbol}_${date}`,
          source: source.name,
          type: 'business',
          title: `Market Data: ${symbol}`,
          content: `Symbol: ${symbol}\nDate: ${date}\nOpen: ${values['1. open']}\nHigh: ${values['2. high']}\nLow: ${values['3. low']}\nClose: ${values['4. close']}\nVolume: ${values['5. volume']}`,
          timestamp: new Date(date),
          credibility: source.credibility,
          tags: [symbol, 'market', 'business'],
          metadata: {
            symbol,
            open: values['1. open'],
            high: values['2. high'],
            low: values['3. low'],
            close: values['4. close'],
            volume: values['5. volume']
          }
        });
      });
    }

    return results;
  }

  // 处理通用API响应
  private processGenericApiResponse(data: any, source: IntelligenceSource): IntelligenceData[] {
    // 通用处理逻辑
    return [];
  }

  // 处理RSS响应
  private processRssResponse(data: string, source: IntelligenceSource): IntelligenceData[] {
    // 简化的RSS处理（实际项目中应该使用专门的RSS解析器）
    const results: IntelligenceData[] = [];

    try {
      // 这里应该使用RSS解析器如rss-parser
      // 简化实现，假设data是JSON格式
      if (typeof data === 'string') {
        // 尝试解析JSON
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.items) {
            jsonData.items.forEach((item: any) => {
              results.push({
                id: `rss_${source.id}_${item.id || Date.now()}`,
                source: source.name,
                type: source.category,
                title: item.title,
                content: item.description || item.summary,
                url: item.link,
                timestamp: new Date(item.pubDate || item.published),
                credibility: source.credibility,
                tags: [source.category],
                metadata: {
                  author: item.author,
                  categories: item.categories
                }
              });
            });
          }
        } catch {
          // 如果不是JSON，可能是XML格式
          console.log('RSS data is XML format, need XML parser');
        }
      }
    } catch (error) {
      console.error('RSS processing error:', error);
    }

    return results;
  }

  // 获取所有源状态
  public getSourceStatus(): Array<{
    id: string;
    name: string;
    enabled: boolean;
    lastSync?: Date;
    credibility: number;
    category: string;
  }> {
    return Array.from(this.sources.values()).map(source => ({
      id: source.id,
      name: source.name,
      enabled: source.enabled,
      lastSync: source.lastSync,
      credibility: source.credibility,
      category: source.category
    }));
  }

  // 获取统计信息
  public getStatistics(): {
    totalSources: number;
    enabledSources: number;
    totalCollections: number;
    averageCredibility: number;
    lastCollection?: Date;
  } {
    const sources = Array.from(this.sources.values());
    const enabledSources = sources.filter(s => s.enabled);
    const lastSyncDates = enabledSources.map(s => s.lastSync).filter(Boolean) as Date[];
    
    return {
      totalSources: sources.length,
      enabledSources: enabledSources.length,
      totalCollections: this.cache.getStats().keys,
      averageCredibility: enabledSources.reduce((sum, s) => sum + s.credibility, 0) / enabledSources.length || 0,
      lastCollection: lastSyncDates.length > 0 ? new Date(Math.max(...lastSyncDates.map(d => d.getTime()))) : undefined
    };
  }
}

// 创建单例实例
export const intelligenceCollector = new EnhancedIntelligenceCollector();

// 导出单例实例