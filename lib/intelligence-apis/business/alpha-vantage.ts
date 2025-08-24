/**
 * Alpha Vantage API提供商
 * 
 * 功能：
 * - 股票价格数据
 * - 财务指标
 * - 外汇汇率
 * - 加密货币价格
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface AlphaVantageTimeSeriesData {
  'Meta Data': {
    '1. Information': string
    '2. Symbol': string
    '3. Last Refreshed': string
    '4. Output Size': string
    '5. Time Zone': string
  }
  'Time Series (Daily)': Record<string, {
    '1. open': string
    '2. high': string
    '3. low': string
    '4. close': string
    '5. volume': string
  }>
}

interface AlphaVantageQuoteData {
  'Global Quote': {
    '01. symbol': string
    '02. open': string
    '03. high': string
    '04. low': string
    '05. price': string
    '06. volume': string
    '07. latest trading day': string
    '08. previous close': string
    '09. change': string
    '10. change percent': string
  }
}

interface AlphaVantageSearchResult {
  bestMatches: Array<{
    '1. symbol': string
    '2. name': string
    '3. type': string
    '4. region': string
    '5. marketOpen': string
    '6. marketClose': string
    '7. timezone': string
    '8. currency': string
    '9. matchScore': string
  }>
}

export class AlphaVantageProvider extends BaseAPIProvider {
  name = 'Alpha Vantage'
  category = 'business' as const
  
  rateLimit = {
    requests: 500,
    period: 'day' as const,
    remaining: 500
  }

  private apiKey: string
  private baseUrl = 'https://www.alphavantage.co/query'

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
    this.enabled = !!apiKey
  }

  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // Alpha Vantage是权威的金融数据提供商
  }

  protected getSourceUrl(): string {
    return 'https://www.alphavantage.co/'
  }

  /**
   * 查询商业情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `Alpha Vantage查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 首先尝试搜索股票代码
      const searchResults = await this.searchSymbol(query)
      
      if (searchResults.length > 0) {
        // 获取匹配度最高的股票信息
        const bestMatch = searchResults[0]
        const stockData = await this.getStockQuote(bestMatch.symbol)
        
        if (stockData) {
          results.push(stockData)
        }

        // 获取历史数据
        const historicalData = await this.getHistoricalData(bestMatch.symbol, options)
        results.push(...historicalData)

      } else {
        // 如果没有找到匹配的股票，尝试直接查询
        const directQuote = await this.getStockQuote(query.toUpperCase())
        if (directQuote) {
          results.push(directQuote)
        }
      }

      // 缓存结果
      this.setCached(cacheKey, results, 300000) // 5分钟缓存

      this.log('info', `查询完成，返回 ${results.length} 条结果`)
      return this.createResponse(true, results)

    } catch (error: any) {
      this.log('error', '查询失败', error.message)
      return this.createResponse(false, [], error.message)
    }
  }

  /**
   * 搜索股票代码
   */
  private async searchSymbol(query: string): Promise<Array<{
    symbol: string
    name: string
    type: string
    region: string
    currency: string
    matchScore: number
  }>> {
    try {
      const params = new URLSearchParams({
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey: this.apiKey
      })

      const response = await this.makeRequest(`${this.baseUrl}?${params}`)
      const data: AlphaVantageSearchResult = await response.json()

      if (data.bestMatches) {
        return data.bestMatches.map(match => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          currency: match['8. currency'],
          matchScore: parseFloat(match['9. matchScore'])
        })).sort((a, b) => b.matchScore - a.matchScore)
      }

      return []

    } catch (error: any) {
      this.log('warn', `股票搜索失败: ${error.message}`)
      return []
    }
  }

  /**
   * 获取股票报价
   */
  private async getStockQuote(symbol: string): Promise<IntelligenceDataPoint | null> {
    try {
      const params = new URLSearchParams({
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: this.apiKey
      })

      const response = await this.makeRequest(`${this.baseUrl}?${params}`)
      const data: AlphaVantageQuoteData = await response.json()

      if (!data['Global Quote'] || !data['Global Quote']['01. symbol']) {
        return null
      }

      const quote = data['Global Quote']
      const price = parseFloat(quote['05. price'])
      const change = parseFloat(quote['09. change'])
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''))

      // 根据价格变化确定严重程度
      let severity: 'low' | 'medium' | 'high' | 'critical'
      if (Math.abs(changePercent) >= 10) {
        severity = 'critical'
      } else if (Math.abs(changePercent) >= 5) {
        severity = 'high'
      } else if (Math.abs(changePercent) >= 2) {
        severity = 'medium'
      } else {
        severity = 'low'
      }

      return this.createDataPoint(
        `alphavantage-quote-${symbol}`,
        'business',
        'stock_quote',
        {
          title: `股票报价: ${symbol}`,
          description: `价格: $${price} | 变化: ${change >= 0 ? '+' : ''}${change} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`,
          indicators: [symbol],
          symbol: symbol,
          price: price,
          change: change,
          changePercent: changePercent,
          volume: parseInt(quote['06. volume']),
          previousClose: parseFloat(quote['08. previous close']),
          tradingDay: quote['07. latest trading day'],
          rawData: quote
        },
        severity,
        0.9
      )

    } catch (error: any) {
      this.log('warn', `股票报价获取失败: ${error.message}`)
      return null
    }
  }

  /**
   * 获取历史数据
   */
  private async getHistoricalData(symbol: string, options: QueryOptions): Promise<IntelligenceDataPoint[]> {
    try {
      const params = new URLSearchParams({
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        outputsize: 'compact', // 最近100个交易日
        apikey: this.apiKey
      })

      const response = await this.makeRequest(`${this.baseUrl}?${params}`)
      const data: AlphaVantageTimeSeriesData = await response.json()

      if (!data['Time Series (Daily)']) {
        return []
      }

      const results: IntelligenceDataPoint[] = []
      const timeSeries = data['Time Series (Daily)']
      const dates = Object.keys(timeSeries).sort().reverse().slice(0, 5) // 最近5个交易日

      for (const date of dates) {
        const dayData = timeSeries[date]
        const open = parseFloat(dayData['1. open'])
        const close = parseFloat(dayData['4. close'])
        const change = ((close - open) / open) * 100

        results.push(this.createDataPoint(
          `alphavantage-daily-${symbol}-${date}`,
          'business',
          'stock_historical',
          {
            title: `${symbol} 历史数据 - ${date}`,
            description: `开盘: $${open} | 收盘: $${close} | 变化: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            indicators: [symbol],
            symbol: symbol,
            date: date,
            open: open,
            high: parseFloat(dayData['2. high']),
            low: parseFloat(dayData['3. low']),
            close: close,
            volume: parseInt(dayData['5. volume']),
            change: change
          },
          Math.abs(change) > 5 ? 'high' : Math.abs(change) > 2 ? 'medium' : 'low',
          0.8
        ))
      }

      return results

    } catch (error: any) {
      this.log('warn', `历史数据获取失败: ${error.message}`)
      return []
    }
  }

  /**
   * 获取外汇汇率
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const params = new URLSearchParams({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: fromCurrency,
        to_currency: toCurrency,
        apikey: this.apiKey
      })

      const response = await this.makeRequest(`${this.baseUrl}?${params}`)
      const data = await response.json()

      if (!data['Realtime Currency Exchange Rate']) {
        return this.createResponse(false, [], '汇率数据不可用')
      }

      const exchangeData = data['Realtime Currency Exchange Rate']
      const rate = parseFloat(exchangeData['5. Exchange Rate'])

      const result = this.createDataPoint(
        `alphavantage-fx-${fromCurrency}-${toCurrency}`,
        'business',
        'exchange_rate',
        {
          title: `汇率: ${fromCurrency}/${toCurrency}`,
          description: `汇率: ${rate} | 更新时间: ${exchangeData['6. Last Refreshed']}`,
          indicators: [fromCurrency, toCurrency],
          fromCurrency: fromCurrency,
          toCurrency: toCurrency,
          rate: rate,
          lastRefreshed: exchangeData['6. Last Refreshed'],
          rawData: exchangeData
        },
        'low',
        0.9
      )

      return this.createResponse(true, [result])

    } catch (error: any) {
      return this.createResponse(false, [], error.message)
    }
  }

  /**
   * 获取加密货币价格
   */
  async getCryptoPrice(symbol: string, market: string = 'USD'): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const params = new URLSearchParams({
        function: 'DIGITAL_CURRENCY_DAILY',
        symbol: symbol,
        market: market,
        apikey: this.apiKey
      })

      const response = await this.makeRequest(`${this.baseUrl}?${params}`)
      const data = await response.json()

      const timeSeriesKey = `Time Series (Digital Currency Daily)`
      if (!data[timeSeriesKey]) {
        return this.createResponse(false, [], '加密货币数据不可用')
      }

      const timeSeries = data[timeSeriesKey]
      const latestDate = Object.keys(timeSeries).sort().reverse()[0]
      const latestData = timeSeries[latestDate]

      const price = parseFloat(latestData[`4a. close (${market})`])
      const volume = parseFloat(latestData['5. volume'])

      const result = this.createDataPoint(
        `alphavantage-crypto-${symbol}-${market}`,
        'business',
        'crypto_price',
        {
          title: `加密货币: ${symbol}/${market}`,
          description: `价格: ${price} ${market} | 交易量: ${volume.toLocaleString()}`,
          indicators: [symbol, market],
          symbol: symbol,
          market: market,
          price: price,
          volume: volume,
          date: latestDate,
          rawData: latestData
        },
        'medium',
        0.8
      )

      return this.createResponse(true, [result])

    } catch (error: any) {
      return this.createResponse(false, [], error.message)
    }
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        function: 'GLOBAL_QUOTE',
        symbol: 'AAPL',
        apikey: this.apiKey
      })

      const response = await this.makeRequest(`${this.baseUrl}?${params}`)
      const data = await response.json()
      
      return !!data['Global Quote']
    } catch (error) {
      return false
    }
  }
}