/**
 * CoinGecko API提供商
 * 
 * 功能：
 * - 加密货币价格
 * - 市值数据
 * - 交易量信息
 * - 价格历史
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface CoinGeckoSimplePrice {
  [coinId: string]: {
    [currency: string]: number
    last_updated?: string
    [key: string]: any
  }
}

interface CoinGeckoSearchResult {
  coins: Array<{
    id: string
    name: string
    symbol: string
    market_cap_rank: number | null
    thumb: string
    large: string
  }>
}

interface CoinGeckoCoinData {
  id: string
  symbol: string
  name: string
  description: {
    en: string
  }
  market_cap_rank: number
  market_data: {
    current_price: { [currency: string]: number }
    market_cap: { [currency: string]: number }
    total_volume: { [currency: string]: number }
    price_change_24h: number
    price_change_percentage_24h: number
    price_change_percentage_7d: number
    price_change_percentage_30d: number
    market_cap_change_24h: number
    market_cap_change_percentage_24h: number
    circulating_supply: number
    total_supply: number
    max_supply: number
    ath: { [currency: string]: number }
    ath_change_percentage: { [currency: string]: number }
    ath_date: { [currency: string]: string }
    atl: { [currency: string]: number }
    atl_change_percentage: { [currency: string]: number }
    atl_date: { [currency: string]: string }
  }
  community_data: {
    facebook_likes: number
    twitter_followers: number
    reddit_average_posts_48h: number
    reddit_average_comments_48h: number
    reddit_subscribers: number
    reddit_accounts_active_48h: number
  }
  developer_data: {
    forks: number
    stars: number
    subscribers: number
    total_issues: number
    closed_issues: number
    pull_requests_merged: number
    pull_request_contributors: number
    code_additions_deletions_4_weeks: {
      additions: number
      deletions: number
    }
    commit_count_4_weeks: number
  }
}

interface CoinGeckoTrendingResult {
  coins: Array<{
    item: {
      id: string
      coin_id: number
      name: string
      symbol: string
      market_cap_rank: number
      thumb: string
      small: string
      large: string
      slug: string
      price_btc: number
      score: number
    }
  }>
}

export class CoinGeckoProvider extends BaseAPIProvider {
  name = 'CoinGecko'
  category = 'business' as const
  
  rateLimit = {
    requests: 50,
    period: 'minute' as const,
    remaining: 50
  }

  private baseUrl = 'https://api.coingecko.com/api/v3'

  constructor() {
    super()
    this.enabled = true // 免费API，无需配置
  }

  validateConfig(): boolean {
    return true
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // CoinGecko是权威的加密货币数据提供商
  }

  protected getSourceUrl(): string {
    return 'https://www.coingecko.com/'
  }

  /**
   * 查询加密货币情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `CoinGecko查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 搜索加密货币
      const searchResults = await this.searchCoins(query)
      
      if (searchResults.length > 0) {
        // 获取前几个匹配结果的详细信息
        const topMatches = searchResults.slice(0, Math.min(3, options.maxResults || 3))
        
        for (const coin of topMatches) {
          const coinData = await this.getCoinData(coin.id)
          if (coinData) {
            results.push(coinData)
          }
          
          // 避免过于频繁的请求
          await this.sleep(200)
        }
      } else {
        // 如果搜索没有结果，尝试直接获取（假设query是coin id）
        const directData = await this.getCoinData(query.toLowerCase())
        if (directData) {
          results.push(directData)
        }
      }

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
   * 搜索加密货币
   */
  private async searchCoins(query: string): Promise<Array<{
    id: string
    name: string
    symbol: string
    market_cap_rank: number | null
  }>> {
    try {
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`
      const response = await this.makeRequest(url)
      const data: CoinGeckoSearchResult = await response.json()

      return data.coins.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        market_cap_rank: coin.market_cap_rank
      })).sort((a, b) => {
        // 优先显示市值排名高的币种
        if (a.market_cap_rank === null) return 1
        if (b.market_cap_rank === null) return -1
        return a.market_cap_rank - b.market_cap_rank
      })

    } catch (error: any) {
      this.log('warn', `加密货币搜索失败: ${error.message}`)
      return []
    }
  }

  /**
   * 获取加密货币详细数据
   */
  private async getCoinData(coinId: string): Promise<IntelligenceDataPoint | null> {
    try {
      const url = `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`
      const response = await this.makeRequest(url)
      
      if (response.status === 404) {
        return null
      }
      
      const data: CoinGeckoCoinData = await response.json()

      const currentPrice = data.market_data.current_price.usd || 0
      const priceChange24h = data.market_data.price_change_percentage_24h || 0
      const marketCap = data.market_data.market_cap.usd || 0
      const volume24h = data.market_data.total_volume.usd || 0

      // 根据价格变化确定严重程度
      let severity: 'low' | 'medium' | 'high' | 'critical'
      if (Math.abs(priceChange24h) >= 20) {
        severity = 'critical'
      } else if (Math.abs(priceChange24h) >= 10) {
        severity = 'high'
      } else if (Math.abs(priceChange24h) >= 5) {
        severity = 'medium'
      } else {
        severity = 'low'
      }

      return this.createDataPoint(
        `coingecko-${coinId}`,
        'business',
        'crypto_analysis',
        {
          title: `${data.name} (${data.symbol.toUpperCase()})`,
          description: `价格: $${currentPrice.toLocaleString()} | 24h变化: ${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}% | 市值排名: #${data.market_cap_rank}`,
          indicators: [data.symbol.toUpperCase(), data.name],
          coinId: data.id,
          symbol: data.symbol.toUpperCase(),
          name: data.name,
          currentPrice: currentPrice,
          priceChange24h: priceChange24h,
          priceChange7d: data.market_data.price_change_percentage_7d,
          priceChange30d: data.market_data.price_change_percentage_30d,
          marketCap: marketCap,
          marketCapRank: data.market_cap_rank,
          volume24h: volume24h,
          circulatingSupply: data.market_data.circulating_supply,
          totalSupply: data.market_data.total_supply,
          maxSupply: data.market_data.max_supply,
          ath: data.market_data.ath.usd,
          athChangePercentage: data.market_data.ath_change_percentage.usd,
          atl: data.market_data.atl.usd,
          atlChangePercentage: data.market_data.atl_change_percentage.usd,
          communityData: {
            twitterFollowers: data.community_data.twitter_followers,
            redditSubscribers: data.community_data.reddit_subscribers,
            facebookLikes: data.community_data.facebook_likes
          },
          developerData: {
            stars: data.developer_data.stars,
            forks: data.developer_data.forks,
            commitCount4Weeks: data.developer_data.commit_count_4_weeks
          },
          rawData: data
        },
        severity,
        0.9
      )

    } catch (error: any) {
      this.log('warn', `加密货币数据获取失败: ${error.message}`)
      return null
    }
  }

  /**
   * 获取简单价格数据
   */
  async getSimplePrices(coinIds: string[], currencies: string[] = ['usd']): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const params = new URLSearchParams({
        ids: coinIds.join(','),
        vs_currencies: currencies.join(','),
        include_market_cap: 'true',
        include_24hr_vol: 'true',
        include_24hr_change: 'true'
      })

      const url = `${this.baseUrl}/simple/price?${params}`
      const response = await this.makeRequest(url)
      const data: CoinGeckoSimplePrice = await response.json()

      const results: IntelligenceDataPoint[] = []

      for (const [coinId, priceData] of Object.entries(data)) {
        const price = priceData.usd || 0
        const change24h = priceData.usd_24h_change || 0
        const marketCap = priceData.usd_market_cap || 0
        const volume24h = priceData.usd_24h_vol || 0

        results.push(this.createDataPoint(
          `coingecko-simple-${coinId}`,
          'business',
          'crypto_price',
          {
            title: `${coinId.toUpperCase()} 价格`,
            description: `$${price.toLocaleString()} | 24h: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
            indicators: [coinId],
            coinId: coinId,
            price: price,
            change24h: change24h,
            marketCap: marketCap,
            volume24h: volume24h
          },
          Math.abs(change24h) > 10 ? 'high' : Math.abs(change24h) > 5 ? 'medium' : 'low',
          0.8
        ))
      }

      return this.createResponse(true, results)

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 获取热门加密货币
   */
  async getTrendingCoins(): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const url = `${this.baseUrl}/search/trending`
      const response = await this.makeRequest(url)
      const data: CoinGeckoTrendingResult = await response.json()

      const results: IntelligenceDataPoint[] = []

      for (const trendingCoin of data.coins) {
        const coin = trendingCoin.item
        
        results.push(this.createDataPoint(
          `coingecko-trending-${coin.id}`,
          'business',
          'crypto_trending',
          {
            title: `热门: ${coin.name} (${coin.symbol})`,
            description: `市值排名: #${coin.market_cap_rank} | 热度评分: ${coin.score}`,
            indicators: [coin.symbol, coin.name],
            coinId: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            marketCapRank: coin.market_cap_rank,
            priceBtc: coin.price_btc,
            score: coin.score
          },
          'medium',
          0.7
        ))
      }

      return this.createResponse(true, results)

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 获取市场概览
   */
  async getMarketOverview(): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const url = `${this.baseUrl}/global`
      const response = await this.makeRequest(url)
      const data = await response.json()

      if (!data.data) {
        return this.createResponse(false, undefined, '市场数据不可用')
      }

      const globalData = data.data
      const marketCapChange = globalData.market_cap_change_percentage_24h_usd || 0

      const result = this.createDataPoint(
        'coingecko-global-market',
        'business',
        'crypto_market_overview',
        {
          title: '加密货币市场概览',
          description: `总市值: $${(globalData.total_market_cap.usd / 1e12).toFixed(2)}T | 24h变化: ${marketCapChange >= 0 ? '+' : ''}${marketCapChange.toFixed(2)}%`,
          indicators: ['crypto', 'market'],
          totalMarketCap: globalData.total_market_cap.usd,
          totalVolume24h: globalData.total_volume.usd,
          marketCapChange24h: marketCapChange,
          activeCryptocurrencies: globalData.active_cryptocurrencies,
          markets: globalData.markets,
          btcDominance: globalData.market_cap_percentage.btc,
          ethDominance: globalData.market_cap_percentage.eth,
          rawData: globalData
        },
        Math.abs(marketCapChange) > 5 ? 'high' : Math.abs(marketCapChange) > 2 ? 'medium' : 'low',
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
      // 使用简单的价格查询作为健康检查
      const url = `${this.baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd`
      const response = await this.makeRequest(url)
      const data = await response.json()
      
      return !!data.bitcoin?.usd
    } catch (error) {
      return false
    }
  }
}