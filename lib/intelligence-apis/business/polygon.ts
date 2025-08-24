/**
 * Polygon.io API提供商
 * 
 * 功能：
 * - 实时股票数据
 * - 外汇汇率
 * - 加密货币价格
 * - 市场新闻
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface PolygonTickerDetails {
  results: {
    ticker: string
    name: string
    market: string
    locale: string
    primary_exchange: string
    type: string
    active: boolean
    currency_name: string
    cik: string
    composite_figi: string
    share_class_figi: string
    market_cap: number
    phone_number: string
    address: {
      address1: string
      city: string
      state: string
      postal_code: string
    }
    description: string
    sic_code: string
    sic_description: string
    ticker_root: string
    homepage_url: string
    total_employees: number
    list_date: string
    branding: {
      logo_url: string
      icon_url: string
    }
    share_class_shares_outstanding: number
    weighted_shares_outstanding: number
  }
}

interface PolygonAggregatesResponse {
  ticker: string
  queryCount: number
  resultsCount: number
  adjusted: boolean
  results: Array<{
    v: number // volume
    vw: number // volume weighted average price
    o: number // open
    c: number // close
    h: number // high
    l: number // low
    t: number // timestamp
    n: number // number of transactions
  }>
  status: string
  request_id: string
  count: number
}

interface PolygonNewsResponse {
  results: Array<{
    id: string
    publisher: {
      name: string
      homepage_url: string
      logo_url: string
      favicon_url: string
    }
    title: string
    author: string
    published_utc: string
    article_url: string
    tickers: string[]
    image_url: string
    description: string
    keywords: string[]
  }>
  status: string
  request_id: string
  count: number
  next_url: string
}

export class PolygonProvider extends BaseAPIProvider {
  name = 'Polygon.io'
  category = 'business' as const
  
  rateLimit = {
    requests: 5,
    period: 'minute' as const,
    remaining: 5
  }

  private apiKey: string
  private baseUrl = 'https://api.polygon.io'

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
    this.enabled = !!apiKey
  }

  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // Polygon.io是专业的金融数据提供商
  }

  protected getSourceUrl(): string {
    return 'https://polygon.io/'
  }

  /**
   * 查询金融情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `Polygon.io查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []
      const ticker = query.toUpperCase()

      // 获取股票详情
      const tickerDetails = await this.getTickerDetails(ticker)
      if (tickerDetails) {
        results.push(tickerDetails)
      }

      // 获取价格数据
      const priceData = await this.getAggregates(ticker, options)
      results.push(...priceData)

      // 获取相关新闻
      const newsData = await this.getTickerNews(ticker, options)
      results.push(...newsData)

      // 缓存结果
      this.setCached(cacheKey, results, 300000) // 5分钟缓存

      this.log('info', `查询完成，返回 ${results.length} 条结果`)
      return this.createResponse(true, results)

    } catch (error: any) {
      this.log('error', '查询失败', error.message)
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 获取股票详情
   */
  private async getTickerDetails(ticker: string): Promise<IntelligenceDataPoint | null> {
    try {
      const url = `${this.baseUrl}/v3/reference/tickers/${ticker}?apikey=${this.apiKey}`
      const response = await this.makeRequest(url)
      
      if (response.status === 404) {
        return null
      }
      
      const data: PolygonTickerDetails = await response.json()

      if (!data.results) {
        return null
      }

      const company = data.results

      return this.createDataPoint(
        `polygon-ticker-${ticker}`,
        'business',
        'company_overview',
        {
          title: `${company.name} (${company.ticker})`,
          description: `${company.description?.substring(0, 200)}...`,
          indicators: [company.ticker, company.name],
          ticker: company.ticker,
          companyName: company.name,
          market: company.market,
          primaryExchange: company.primary_exchange,
          marketCap: company.market_cap,
          totalEmployees: company.total_employees,
          sector: company.sic_description,
          address: company.address,
          phoneNumber: company.phone_number,
          homepageUrl: company.homepage_url,
          listDate: company.list_date,
          sharesOutstanding: company.share_class_shares_outstanding,
          active: company.active,
          rawData: company
        },
        company.active ? 'low' : 'medium',
        0.9
      )

    } catch (error: any) {
      this.log('warn', `股票详情获取失败: ${error.message}`)
      return null
    }
  }

  /**
   * 获取聚合价格数据
   */
  private async getAggregates(ticker: string, options: QueryOptions): Promise<IntelligenceDataPoint[]> {
    try {
      // 获取最近5个交易日的数据
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 7) // 7天前

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const url = `${this.baseUrl}/v2/aggs/ticker/${ticker}/range/1/day/${startDateStr}/${endDateStr}?adjusted=true&sort=desc&limit=5&apikey=${this.apiKey}`
      const response = await this.makeRequest(url)
      const data: PolygonAggregatesResponse = await response.json()

      if (!data.results || data.results.length === 0) {
        return []
      }

      const results: IntelligenceDataPoint[] = []

      for (const aggregate of data.results.slice(0, 3)) { // 最近3天
        const date = new Date(aggregate.t).toISOString().split('T')[0]
        const change = ((aggregate.c - aggregate.o) / aggregate.o) * 100

        results.push(this.createDataPoint(
          `polygon-agg-${ticker}-${aggregate.t}`,
          'business',
          'stock_data',
          {
            title: `${ticker} 交易数据 - ${date}`,
            description: `开盘: $${aggregate.o} | 收盘: $${aggregate.c} | 变化: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            indicators: [ticker],
            ticker: ticker,
            date: date,
            open: aggregate.o,
            high: aggregate.h,
            low: aggregate.l,
            close: aggregate.c,
            volume: aggregate.v,
            vwap: aggregate.vw,
            transactions: aggregate.n,
            change: change,
            timestamp: aggregate.t
          },
          Math.abs(change) > 5 ? 'high' : Math.abs(change) > 2 ? 'medium' : 'low',
          0.9
        ))
      }

      return results

    } catch (error: any) {
      this.log('warn', `聚合数据获取失败: ${error.message}`)
      return []
    }
  }

  /**
   * 获取股票新闻
   */
  private async getTickerNews(ticker: string, options: QueryOptions): Promise<IntelligenceDataPoint[]> {
    try {
      const params = new URLSearchParams({
        'ticker': ticker,
        'limit': (options.maxResults || 5).toString(),
        'apikey': this.apiKey
      })

      const url = `${this.baseUrl}/v2/reference/news?${params}`
      const response = await this.makeRequest(url)
      const data: PolygonNewsResponse = await response.json()

      if (!data.results || data.results.length === 0) {
        return []
      }

      const results: IntelligenceDataPoint[] = []

      for (const article of data.results) {
        results.push(this.createDataPoint(
          `polygon-news-${article.id}`,
          'business',
          'financial_news',
          {
            title: article.title,
            description: article.description,
            indicators: article.tickers,
            url: article.article_url,
            author: article.author,
            publisher: article.publisher.name,
            publishedAt: article.published_utc,
            tickers: article.tickers,
            keywords: article.keywords,
            imageUrl: article.image_url
          },
          'medium',
          0.7
        ))
      }

      return results

    } catch (error: any) {
      this.log('warn', `新闻数据获取失败: ${error.message}`)
      return []
    }
  }

  /**
   * 获取外汇汇率
   */
  async getForexRate(from: string, to: string): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const pair = `C:${from}${to}`
      const url = `${this.baseUrl}/v2/last/trade/${pair}?apikey=${this.apiKey}`
      
      const response = await this.makeRequest(url)
      const data = await response.json()

      if (!data.results) {
        return this.createResponse(false, undefined, '外汇数据不可用')
      }

      const result = this.createDataPoint(
        `polygon-forex-${from}-${to}`,
        'business',
        'forex_rate',
        {
          title: `外汇汇率: ${from}/${to}`,
          description: `汇率: ${data.results.p} | 时间: ${new Date(data.results.t).toISOString()}`,
          indicators: [from, to],
          fromCurrency: from,
          toCurrency: to,
          rate: data.results.p,
          timestamp: data.results.t,
          exchange: data.results.x
        },
        'low',
        0.9
      )

      return this.createResponse(true, [result])

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 获取加密货币数据
   */
  async getCryptoData(symbol: string): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const ticker = `X:${symbol}USD`
      const url = `${this.baseUrl}/v2/last/trade/${ticker}?apikey=${this.apiKey}`
      
      const response = await this.makeRequest(url)
      const data = await response.json()

      if (!data.results) {
        return this.createResponse(false, undefined, '加密货币数据不可用')
      }

      const result = this.createDataPoint(
        `polygon-crypto-${symbol}`,
        'business',
        'crypto_price',
        {
          title: `加密货币: ${symbol}/USD`,
          description: `价格: $${data.results.p} | 时间: ${new Date(data.results.t).toISOString()}`,
          indicators: [symbol, 'USD'],
          symbol: symbol,
          price: data.results.p,
          size: data.results.s,
          timestamp: data.results.t,
          exchange: data.results.x
        },
        'medium',
        0.8
      )

      return this.createResponse(true, [result])

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 获取市场状态
   */
  async getMarketStatus(): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const url = `${this.baseUrl}/v1/marketstatus/now?apikey=${this.apiKey}`
      const response = await this.makeRequest(url)
      const data = await response.json()

      if (!data.market) {
        return this.createResponse(false, undefined, '市场状态数据不可用')
      }

      const result = this.createDataPoint(
        'polygon-market-status',
        'business',
        'market_status',
        {
          title: '美股市场状态',
          description: `股市: ${data.market} | 外汇: ${data.exchanges?.forex || 'N/A'} | 加密货币: ${data.exchanges?.crypto || 'N/A'}`,
          indicators: ['market', 'status'],
          market: data.market,
          exchanges: data.exchanges,
          serverTime: data.serverTime
        },
        'low',
        0.9
      )

      return this.createResponse(true, [result])

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/v1/marketstatus/now?apikey=${this.apiKey}`
      const response = await this.makeRequest(url)
      
      return response.ok
    } catch (error) {
      return false
    }
  }
}