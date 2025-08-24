/**
 * 商业情报数据源实现
 * 
 * 支持的服务：
 * 1. Alpha Vantage - 股票和金融数据
 * 2. Polygon.io - 实时金融市场数据
 * 3. OpenCorporates - 全球企业注册信息
 * 4. CoinGecko - 加密货币数据
 * 5. NewsAPI - 商业新闻
 */

import { BaseOSINTProvider, OSINTDataPoint, createOSINTDataPoint, OSINTApiConfig } from './osint-framework'

/**
 * Alpha Vantage提供商（股票数据）
 */
export class AlphaVantageProvider extends BaseOSINTProvider {
  constructor(apiKey: string) {
    const config: OSINTApiConfig = {
      name: 'Alpha Vantage',
      endpoint: 'https://www.alphavantage.co/query',
      apiKey,
      rateLimit: { requests: 1, period: 12000 }, // 每分钟5次
      quota: { daily: 500 },
      category: 'business',
      priority: 10,
      enabled: !!apiKey,
      tier: 'free',
      timeout: 15000
    }
    super(config)
  }

  async query(symbol: string, options?: {
    function?: 'TIME_SERIES_DAILY' | 'TIME_SERIES_INTRADAY' | 'OVERVIEW' | 'INCOME_STATEMENT' | 'BALANCE_SHEET'
    interval?: '1min' | '5min' | '15min' | '30min' | '60min'
    outputsize?: 'compact' | 'full'
  }): Promise<OSINTDataPoint[]> {
    if (!this.checkQuota()) {
      throw new Error('Alpha Vantage daily quota exceeded')
    }

    await this.checkRateLimit()

    const {
      function: func = 'TIME_SERIES_DAILY',
      interval = '60min',
      outputsize = 'compact'
    } = options || {}

    const params = new URLSearchParams({
      function: func,
      symbol: symbol.toUpperCase(),
      apikey: this.config.apiKey!
    })

    if (func === 'TIME_SERIES_INTRADAY') {
      params.append('interval', interval)
    }

    if (func.startsWith('TIME_SERIES')) {
      params.append('outputsize', outputsize)
    }

    try {
      const response = await fetch(`${this.config.endpoint}?${params}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // 检查API错误
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`)
      }

      if (data['Note']) {
        throw new Error('Alpha Vantage rate limit exceeded')
      }

      return this.normalizeData(data, symbol, func)

    } catch (error: any) {
      console.error('Alpha Vantage query failed:', error)
      throw new Error(`Alpha Vantage query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, symbol: string, functionType: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (functionType === 'OVERVIEW') {
      // 公司概览数据
      results.push(createOSINTDataPoint(
        'Alpha Vantage',
        'business',
        'company_overview',
        {
          symbol,
          name: rawData.Name,
          description: rawData.Description,
          exchange: rawData.Exchange,
          currency: rawData.Currency,
          country: rawData.Country,
          sector: rawData.Sector,
          industry: rawData.Industry,
          market_cap: parseFloat(rawData.MarketCapitalization) || null,
          pe_ratio: parseFloat(rawData.PERatio) || null,
          peg_ratio: parseFloat(rawData.PEGRatio) || null,
          book_value: parseFloat(rawData.BookValue) || null,
          dividend_per_share: parseFloat(rawData.DividendPerShare) || null,
          dividend_yield: parseFloat(rawData.DividendYield) || null,
          eps: parseFloat(rawData.EPS) || null,
          revenue_ttm: parseFloat(rawData.RevenueTTM) || null,
          profit_margin: parseFloat(rawData.ProfitMargin) || null,
          operating_margin: parseFloat(rawData.OperatingMarginTTM) || null,
          return_on_assets: parseFloat(rawData.ReturnOnAssetsTTM) || null,
          return_on_equity: parseFloat(rawData.ReturnOnEquityTTM) || null,
          revenue_per_share: parseFloat(rawData.RevenuePerShareTTM) || null,
          quarterly_earnings_growth: parseFloat(rawData.QuarterlyEarningsGrowthYOY) || null,
          quarterly_revenue_growth: parseFloat(rawData.QuarterlyRevenueGrowthYOY) || null,
          analyst_target_price: parseFloat(rawData.AnalystTargetPrice) || null,
          fifty_two_week_high: parseFloat(rawData['52WeekHigh']) || null,
          fifty_two_week_low: parseFloat(rawData['52WeekLow']) || null,
          fifty_day_moving_average: parseFloat(rawData['50DayMovingAverage']) || null,
          two_hundred_day_moving_average: parseFloat(rawData['200DayMovingAverage']) || null
        },
        0.9
      ))
    } else if (functionType.startsWith('TIME_SERIES')) {
      // 时间序列数据
      const timeSeriesKey = Object.keys(rawData).find(key => key.includes('Time Series'))
      if (timeSeriesKey && rawData[timeSeriesKey]) {
        const timeSeries = rawData[timeSeriesKey]
        const dates = Object.keys(timeSeries).slice(0, 10) // 最近10个交易日

        dates.forEach(date => {
          const dayData = timeSeries[date]
          results.push(createOSINTDataPoint(
            'Alpha Vantage',
            'business',
            'stock_price',
            {
              symbol,
              date,
              open: parseFloat(dayData['1. open']),
              high: parseFloat(dayData['2. high']),
              low: parseFloat(dayData['3. low']),
              close: parseFloat(dayData['4. close']),
              volume: parseInt(dayData['5. volume'])
            },
            0.95
          ))
        })
      }
    } else if (functionType === 'INCOME_STATEMENT' || functionType === 'BALANCE_SHEET') {
      // 财务报表数据
      const reports = rawData.annualReports || rawData.quarterlyReports || []
      reports.slice(0, 5).forEach((report: any) => {
        results.push(createOSINTDataPoint(
          'Alpha Vantage',
          'business',
          functionType.toLowerCase(),
          {
            symbol,
            fiscal_date_ending: report.fiscalDateEnding,
            reported_currency: report.reportedCurrency,
            ...report
          },
          0.9
        ))
      })
    }

    return results
  }
}

/**
 * Polygon.io提供商
 */
export class PolygonProvider extends BaseOSINTProvider {
  constructor(apiKey: string) {
    const config: OSINTApiConfig = {
      name: 'Polygon.io',
      endpoint: 'https://api.polygon.io',
      apiKey,
      rateLimit: { requests: 1, period: 60000 }, // 免费版限制严格
      quota: { monthly: 5 },
      category: 'business',
      priority: 7,
      enabled: !!apiKey,
      tier: 'free',
      timeout: 10000
    }
    super(config)
  }

  async query(ticker: string, options?: {
    timespan?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
    from?: string
    to?: string
  }): Promise<OSINTDataPoint[]> {
    if (!this.checkQuota()) {
      throw new Error('Polygon.io monthly quota exceeded')
    }

    await this.checkRateLimit()

    const {
      timespan = 'day',
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to = new Date().toISOString().split('T')[0]
    } = options || {}

    try {
      const response = await fetch(
        `${this.config.endpoint}/v2/aggs/ticker/${ticker.toUpperCase()}/range/1/${timespan}/${from}/${to}?apikey=${this.config.apiKey}`,
        {
          signal: AbortSignal.timeout(this.config.timeout)
        }
      )

      if (!response.ok) {
        throw new Error(`Polygon.io API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, ticker)

    } catch (error: any) {
      console.error('Polygon.io query failed:', error)
      throw new Error(`Polygon.io query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, ticker: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.status === 'OK' && rawData.results) {
      rawData.results.forEach((bar: any) => {
        results.push(createOSINTDataPoint(
          'Polygon.io',
          'business',
          'market_data',
          {
            ticker,
            timestamp: new Date(bar.t).toISOString(),
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v,
            vwap: bar.vw,
            transactions: bar.n
          },
          0.95
        ))
      })
    }

    return results
  }
}

/**
 * OpenCorporates提供商
 */
export class OpenCorporatesProvider extends BaseOSINTProvider {
  constructor(apiToken: string) {
    const config: OSINTApiConfig = {
      name: 'OpenCorporates',
      endpoint: 'https://api.opencorporates.com',
      apiKey: apiToken,
      rateLimit: { requests: 1, period: 2000 },
      quota: { monthly: 500 },
      category: 'business',
      priority: 8,
      enabled: !!apiToken,
      tier: 'free',
      timeout: 15000
    }
    super(config)
  }

  async query(companyName: string, options?: {
    jurisdiction?: string
    current_status?: string
    order?: 'score' | 'name'
  }): Promise<OSINTDataPoint[]> {
    if (!this.checkQuota()) {
      throw new Error('OpenCorporates monthly quota exceeded')
    }

    await this.checkRateLimit()

    const { jurisdiction, current_status, order = 'score' } = options || {}

    const params = new URLSearchParams({
      q: companyName,
      api_token: this.config.apiKey!,
      order,
      per_page: '10'
    })

    if (jurisdiction) params.append('jurisdiction_code', jurisdiction)
    if (current_status) params.append('current_status', current_status)

    try {
      const response = await fetch(`${this.config.endpoint}/companies/search?${params}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`OpenCorporates API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, companyName)

    } catch (error: any) {
      console.error('OpenCorporates query failed:', error)
      throw new Error(`OpenCorporates query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, companyName: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.results && rawData.results.companies) {
      rawData.results.companies.forEach((companyData: any) => {
        const company = companyData.company
        
        results.push(createOSINTDataPoint(
          'OpenCorporates',
          'business',
          'company_registration',
          {
            search_query: companyName,
            company_number: company.company_number,
            name: company.name,
            normalized_name: company.normalized_name,
            company_type: company.company_type,
            jurisdiction_code: company.jurisdiction_code,
            incorporation_date: company.incorporation_date,
            dissolution_date: company.dissolution_date,
            current_status: company.current_status,
            registered_address: company.registered_address_in_full,
            officers_count: company.officers_count,
            registry_url: company.registry_url,
            opencorporates_url: company.opencorporates_url,
            created_at: company.created_at,
            updated_at: company.updated_at
          },
          0.8
        ))
      })
    }

    return results
  }
}

/**
 * CoinGecko提供商
 */
export class CoinGeckoProvider extends BaseOSINTProvider {
  constructor() {
    const config: OSINTApiConfig = {
      name: 'CoinGecko',
      endpoint: 'https://api.coingecko.com/api/v3',
      rateLimit: { requests: 1, period: 1200 }, // 每分钟50次
      quota: { daily: 10000 },
      category: 'business',
      priority: 6,
      enabled: true,
      tier: 'free',
      timeout: 10000
    }
    super(config)
  }

  async query(coinId: string, options?: {
    vs_currencies?: string
    include_market_cap?: boolean
    include_24hr_vol?: boolean
    include_24hr_change?: boolean
  }): Promise<OSINTDataPoint[]> {
    await this.checkRateLimit()

    const {
      vs_currencies = 'usd',
      include_market_cap = true,
      include_24hr_vol = true,
      include_24hr_change = true
    } = options || {}

    const params = new URLSearchParams({
      ids: coinId,
      vs_currencies,
      include_market_cap: include_market_cap.toString(),
      include_24hr_vol: include_24hr_vol.toString(),
      include_24hr_change: include_24hr_change.toString()
    })

    try {
      // 获取价格数据
      const priceResponse = await fetch(`${this.config.endpoint}/simple/price?${params}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!priceResponse.ok) {
        throw new Error(`CoinGecko API error: ${priceResponse.status} ${priceResponse.statusText}`)
      }

      const priceData = await priceResponse.json()

      // 获取详细信息
      const detailResponse = await fetch(`${this.config.endpoint}/coins/${coinId}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      let detailData = null
      if (detailResponse.ok) {
        detailData = await detailResponse.json()
      }

      return this.normalizeData({ price: priceData, detail: detailData }, coinId)

    } catch (error: any) {
      console.error('CoinGecko query failed:', error)
      throw new Error(`CoinGecko query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, coinId: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    // 价格数据
    if (rawData.price && rawData.price[coinId]) {
      const priceInfo = rawData.price[coinId]
      
      results.push(createOSINTDataPoint(
        'CoinGecko',
        'business',
        'crypto_price',
        {
          coin_id: coinId,
          price_usd: priceInfo.usd,
          market_cap_usd: priceInfo.usd_market_cap,
          volume_24h_usd: priceInfo.usd_24h_vol,
          change_24h: priceInfo.usd_24h_change,
          last_updated: new Date().toISOString()
        },
        0.95
      ))
    }

    // 详细信息
    if (rawData.detail) {
      const detail = rawData.detail
      
      results.push(createOSINTDataPoint(
        'CoinGecko',
        'business',
        'crypto_profile',
        {
          coin_id: coinId,
          name: detail.name,
          symbol: detail.symbol?.toUpperCase(),
          description: detail.description?.en,
          homepage: detail.links?.homepage?.[0],
          blockchain_site: detail.links?.blockchain_site?.filter((site: string) => site),
          official_forum_url: detail.links?.official_forum_url?.filter((url: string) => url),
          chat_url: detail.links?.chat_url?.filter((url: string) => url),
          announcement_url: detail.links?.announcement_url?.filter((url: string) => url),
          twitter_screen_name: detail.links?.twitter_screen_name,
          facebook_username: detail.links?.facebook_username,
          telegram_channel_identifier: detail.links?.telegram_channel_identifier,
          subreddit_url: detail.links?.subreddit_url,
          repos_url: detail.links?.repos_url,
          market_cap_rank: detail.market_cap_rank,
          coingecko_rank: detail.coingecko_rank,
          coingecko_score: detail.coingecko_score,
          developer_score: detail.developer_score,
          community_score: detail.community_score,
          liquidity_score: detail.liquidity_score,
          public_interest_score: detail.public_interest_score,
          market_data: {
            current_price: detail.market_data?.current_price?.usd,
            market_cap: detail.market_data?.market_cap?.usd,
            total_volume: detail.market_data?.total_volume?.usd,
            high_24h: detail.market_data?.high_24h?.usd,
            low_24h: detail.market_data?.low_24h?.usd,
            price_change_24h: detail.market_data?.price_change_24h,
            price_change_percentage_24h: detail.market_data?.price_change_percentage_24h,
            market_cap_change_24h: detail.market_data?.market_cap_change_24h,
            market_cap_change_percentage_24h: detail.market_data?.market_cap_change_percentage_24h,
            circulating_supply: detail.market_data?.circulating_supply,
            total_supply: detail.market_data?.total_supply,
            max_supply: detail.market_data?.max_supply,
            ath: detail.market_data?.ath?.usd,
            ath_change_percentage: detail.market_data?.ath_change_percentage?.usd,
            ath_date: detail.market_data?.ath_date?.usd,
            atl: detail.market_data?.atl?.usd,
            atl_change_percentage: detail.market_data?.atl_change_percentage?.usd,
            atl_date: detail.market_data?.atl_date?.usd
          }
        },
        0.9
      ))
    }

    return results
  }

  /**
   * 查询热门加密货币
   */
  async queryTrendingCryptos(): Promise<OSINTDataPoint[]> {
    await this.checkRateLimit()

    try {
      const response = await fetch(`${this.config.endpoint}/search/trending`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`CoinGecko trending API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const results: OSINTDataPoint[] = []

      if (data.coins) {
        data.coins.forEach((coinData: any, index: number) => {
          const coin = coinData.item
          
          results.push(createOSINTDataPoint(
            'CoinGecko',
            'business',
            'crypto_trending',
            {
              rank: index + 1,
              coin_id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              market_cap_rank: coin.market_cap_rank,
              thumb: coin.thumb,
              small: coin.small,
              large: coin.large,
              slug: coin.slug,
              price_btc: coin.price_btc,
              score: coin.score
            },
            0.8
          ))
        })
      }

      return results

    } catch (error: any) {
      console.error('CoinGecko trending query failed:', error)
      throw new Error(`CoinGecko trending query failed: ${error.message}`)
    }
  }
}

/**
 * 商业新闻聚合器（基于NewsAPI）
 */
export class BusinessNewsProvider extends BaseOSINTProvider {
  constructor(apiKey: string) {
    const config: OSINTApiConfig = {
      name: 'Business News API',
      endpoint: 'https://newsapi.org/v2',
      apiKey,
      rateLimit: { requests: 1, period: 1000 },
      quota: { daily: 1000 },
      category: 'business',
      priority: 5,
      enabled: !!apiKey,
      tier: 'free',
      timeout: 10000
    }
    super(config)
  }

  async query(query: string, options?: {
    category?: 'business' | 'technology'
    language?: string
    country?: string
    from?: string
    to?: string
  }): Promise<OSINTDataPoint[]> {
    if (!this.checkQuota()) {
      throw new Error('Business News API daily quota exceeded')
    }

    await this.checkRateLimit()

    const {
      category = 'business',
      language = 'en',
      from,
      to
    } = options || {}

    const params = new URLSearchParams({
      q: query,
      category,
      language,
      sortBy: 'publishedAt',
      pageSize: '20',
      apiKey: this.config.apiKey!
    })

    if (from) params.append('from', from)
    if (to) params.append('to', to)

    try {
      const response = await fetch(`${this.config.endpoint}/everything?${params}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Business News API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeData(data, query)

    } catch (error: any) {
      console.error('Business News API query failed:', error)
      throw new Error(`Business News API query failed: ${error.message}`)
    }
  }

  protected normalizeData(rawData: any, query: string): OSINTDataPoint[] {
    const results: OSINTDataPoint[] = []

    if (rawData.status === 'ok' && rawData.articles) {
      rawData.articles.forEach((article: any) => {
        if (article.title && article.url) {
          results.push(createOSINTDataPoint(
            'Business News API',
            'business',
            'business_news',
            {
              query,
              title: article.title,
              description: article.description,
              url: article.url,
              url_to_image: article.urlToImage,
              published_at: article.publishedAt,
              source_name: article.source?.name,
              source_id: article.source?.id,
              author: article.author,
              content: article.content
            },
            0.7
          ))
        }
      })
    }

    return results
  }
}

/**
 * 商业情报聚合器
 */
export class BusinessIntelligenceAggregator {
  private providers: BaseOSINTProvider[] = []

  constructor() {
    // 根据环境变量初始化提供商
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      this.providers.push(new AlphaVantageProvider(process.env.ALPHA_VANTAGE_API_KEY))
    }
    
    if (process.env.POLYGON_API_KEY) {
      this.providers.push(new PolygonProvider(process.env.POLYGON_API_KEY))
    }
    
    if (process.env.OPENCORPORATES_API_TOKEN) {
      this.providers.push(new OpenCorporatesProvider(process.env.OPENCORPORATES_API_TOKEN))
    }
    
    this.providers.push(new CoinGeckoProvider()) // 无需API密钥
    
    if (process.env.NEWSAPI_KEY) {
      this.providers.push(new BusinessNewsProvider(process.env.NEWSAPI_KEY))
    }
  }

  /**
   * 综合企业分析
   */
  async analyzeCompany(companyIdentifier: string, options?: {
    includeStock?: boolean
    includeNews?: boolean
    includeCrypto?: boolean
  }): Promise<OSINTDataPoint[]> {
    console.log(`🏢 分析企业: ${companyIdentifier}`)
    
    const { includeStock = true, includeNews = true, includeCrypto = false } = options || {}
    const results: OSINTDataPoint[] = []

    const promises = this.providers.map(async provider => {
      try {
        const providerName = provider.getStatus().name
        
        if (providerName === 'Alpha Vantage' && includeStock) {
          // 先尝试获取公司概览
          const overview = await (provider as AlphaVantageProvider).query(companyIdentifier, {
            function: 'OVERVIEW'
          })
          results.push(...overview)
          
          // 然后获取股价数据
          const prices = await (provider as AlphaVantageProvider).query(companyIdentifier, {
            function: 'TIME_SERIES_DAILY',
            outputsize: 'compact'
          })
          results.push(...prices)
          
        } else if (providerName === 'OpenCorporates') {
          const corporateData = await provider.query(companyIdentifier)
          results.push(...corporateData)
          
        } else if (providerName === 'Business News API' && includeNews) {
          const newsData = await provider.query(companyIdentifier, {
            category: 'business'
          })
          results.push(...newsData)
          
        } else if (providerName === 'CoinGecko' && includeCrypto) {
          // 如果是加密货币相关的查询
          const cryptoData = await provider.query(companyIdentifier.toLowerCase())
          results.push(...cryptoData)
        }
        
        return []
      } catch (error) {
        console.error(`${provider.getStatus().name} query failed:`, error)
        return []
      }
    })

    await Promise.all(promises)

    console.log(`✅ 企业分析完成: ${results.length} 条结果`)
    return results
  }

  /**
   * 市场趋势分析
   */
  async analyzeMarketTrends(): Promise<OSINTDataPoint[]> {
    console.log(`📈 分析市场趋势`)
    
    const results: OSINTDataPoint[] = []

    // 获取热门加密货币
    const coinGeckoProvider = this.providers.find(p => p.getStatus().name === 'CoinGecko') as CoinGeckoProvider
    if (coinGeckoProvider) {
      try {
        const trendingCryptos = await coinGeckoProvider.queryTrendingCryptos()
        results.push(...trendingCryptos)
      } catch (error) {
        console.error('获取热门加密货币失败:', error)
      }
    }

    // 获取商业新闻
    const newsProvider = this.providers.find(p => p.getStatus().name === 'Business News API') as BusinessNewsProvider
    if (newsProvider) {
      try {
        const marketNews = await newsProvider.query('market trends', {
          category: 'business'
        })
        results.push(...marketNews)
      } catch (error) {
        console.error('获取市场新闻失败:', error)
      }
    }

    console.log(`✅ 市场趋势分析完成: ${results.length} 条结果`)
    return results
  }

  /**
   * 获取所有提供商状态
   */
  getProvidersStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    this.providers.forEach(provider => {
      const providerStatus = provider.getStatus()
      status[providerStatus.name] = providerStatus
    })
    return status
  }
}

// 导出实例
export const businessIntelligence = new BusinessIntelligenceAggregator()