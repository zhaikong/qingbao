/**
 * OpenCorporates API提供商
 * 
 * 功能：
 * - 全球企业注册信息
 * - 公司基础数据
 * - 董事和股东信息
 * - 企业关联关系
 */

import { BaseAPIProvider } from '../base-provider'
import { APIResponse, IntelligenceDataPoint, QueryOptions } from '../types'

interface OpenCorporatesSearchResult {
  results: {
    companies: Array<{
      company: {
        name: string
        company_number: string
        jurisdiction_code: string
        incorporation_date: string | null
        dissolution_date: string | null
        company_type: string
        registry_url: string | null
        branch: string | null
        business_number: string | null
        current_status: string
        created_at: string
        updated_at: string
        retrieved_at: string
        opencorporates_url: string
        previous_names: Array<{
          company_name: string
          con_date: string | null
          type: string
        }>
        source: {
          publisher: string
          url: string
          retrieved_at: string
        }
      }
    }>
    total_count: number
    page: number
    per_page: number
    total_pages: number
  }
}

interface OpenCorporatesCompanyDetail {
  results: {
    company: {
      name: string
      company_number: string
      jurisdiction_code: string
      incorporation_date: string | null
      dissolution_date: string | null
      company_type: string
      registry_url: string | null
      branch: string | null
      business_number: string | null
      current_status: string
      created_at: string
      updated_at: string
      retrieved_at: string
      opencorporates_url: string
      registered_address_in_full: string | null
      corporate_groupings: any[]
      previous_names: Array<{
        company_name: string
        con_date: string | null
        type: string
      }>
      filings: Array<{
        title: string
        date: string
        description: string
        opencorporates_url: string
      }>
      officers: Array<{
        officer: {
          id: number
          uid: string
          name: string
          jurisdiction_code: string
          position: string
          retrieved_at: string
          opencorporates_url: string
          current_status: string
          inactive: boolean
          start_date: string | null
          end_date: string | null
        }
      }>
      source: {
        publisher: string
        url: string
        retrieved_at: string
      }
    }
  }
}

export class OpenCorporatesProvider extends BaseAPIProvider {
  name = 'OpenCorporates'
  category = 'business' as const
  
  rateLimit = {
    requests: 500,
    period: 'day' as const,
    remaining: 500
  }

  private apiToken: string
  private baseUrl = 'https://api.opencorporates.com/v0.4'

  constructor(apiToken: string) {
    super()
    this.apiToken = apiToken
    this.enabled = !!apiToken
  }

  validateConfig(): boolean {
    return !!this.apiToken && this.apiToken.length > 0
  }

  protected getSourceReliability(): 'A' | 'B' | 'C' | 'D' | 'E' {
    return 'A' // OpenCorporates是权威的企业数据库
  }

  protected getSourceUrl(): string {
    return 'https://opencorporates.com/'
  }

  /**
   * 查询企业情报
   */
  async query(query: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      this.log('info', `OpenCorporates查询: ${query}`)

      // 检查缓存
      const cacheKey = this.generateCacheKey(query, options)
      const cached = this.getCached<IntelligenceDataPoint[]>(cacheKey)
      if (cached && options.useCache !== false) {
        this.log('info', '使用缓存数据')
        return this.createResponse(true, cached)
      }

      const results: IntelligenceDataPoint[] = []

      // 搜索公司
      const searchResults = await this.searchCompanies(query, options)
      
      for (const company of searchResults.slice(0, options.maxResults || 5)) {
        // 获取公司详细信息
        const companyDetail = await this.getCompanyDetail(
          company.jurisdiction_code, 
          company.company_number
        )
        
        if (companyDetail) {
          results.push(companyDetail)
        }
        
        // 避免过于频繁的请求
        await this.sleep(500)
      }

      // 缓存结果
      this.setCached(cacheKey, results, 3600000) // 1小时缓存

      this.log('info', `查询完成，返回 ${results.length} 条结果`)
      return this.createResponse(true, results)

    } catch (error: any) {
      this.log('error', '查询失败', error.message)
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 搜索公司
   */
  private async searchCompanies(query: string, options: QueryOptions): Promise<Array<{
    name: string
    company_number: string
    jurisdiction_code: string
    incorporation_date: string | null
    current_status: string
    company_type: string
  }>> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        api_token: this.apiToken,
        per_page: Math.min(options.maxResults || 10, 30).toString()
      })

      // 添加地理过滤
      if (options.geoFilter && options.geoFilter.length > 0) {
        params.append('jurisdiction_code', options.geoFilter[0])
      }

      const url = `${this.baseUrl}/companies/search?${params}`
      const response = await this.makeRequest(url)
      const data: OpenCorporatesSearchResult = await response.json()

      if (!data.results || !data.results.companies) {
        return []
      }

      return data.results.companies.map(item => ({
        name: item.company.name,
        company_number: item.company.company_number,
        jurisdiction_code: item.company.jurisdiction_code,
        incorporation_date: item.company.incorporation_date,
        current_status: item.company.current_status,
        company_type: item.company.company_type
      }))

    } catch (error: any) {
      this.log('warn', `公司搜索失败: ${error.message}`)
      return []
    }
  }

  /**
   * 获取公司详细信息
   */
  private async getCompanyDetail(jurisdictionCode: string, companyNumber: string): Promise<IntelligenceDataPoint | null> {
    try {
      const params = new URLSearchParams({
        format: 'json',
        api_token: this.apiToken
      })

      const url = `${this.baseUrl}/companies/${jurisdictionCode}/${companyNumber}?${params}`
      const response = await this.makeRequest(url)
      
      if (response.status === 404) {
        return null
      }
      
      const data: OpenCorporatesCompanyDetail = await response.json()

      if (!data.results || !data.results.company) {
        return null
      }

      const company = data.results.company

      // 评估公司风险等级
      const riskAssessment = this.assessCompanyRisk(company)

      return this.createDataPoint(
        `opencorporates-${jurisdictionCode}-${companyNumber}`,
        'business',
        'company_profile',
        {
          title: `企业档案: ${company.name}`,
          description: `注册号: ${company.company_number} | 状态: ${company.current_status} | 注册地: ${jurisdictionCode}`,
          indicators: [company.name, company.company_number],
          location: jurisdictionCode,
          companyName: company.name,
          companyNumber: company.company_number,
          jurisdictionCode: jurisdictionCode,
          incorporationDate: company.incorporation_date,
          dissolutionDate: company.dissolution_date,
          currentStatus: company.current_status,
          companyType: company.company_type,
          registeredAddress: company.registered_address_in_full,
          registryUrl: company.registry_url,
          opencorporatesUrl: company.opencorporates_url,
          previousNames: company.previous_names,
          officers: company.officers?.map(o => ({
            name: o.officer.name,
            position: o.officer.position,
            startDate: o.officer.start_date,
            endDate: o.officer.end_date,
            currentStatus: o.officer.current_status
          })) || [],
          filings: company.filings?.map(f => ({
            title: f.title,
            date: f.date,
            description: f.description
          })) || [],
          riskFactors: riskAssessment.factors,
          source: company.source,
          rawData: company
        },
        riskAssessment.severity,
        0.9
      )

    } catch (error: any) {
      this.log('warn', `公司详情获取失败: ${error.message}`)
      return null
    }
  }

  /**
   * 评估公司风险
   */
  private assessCompanyRisk(company: any): { severity: 'low' | 'medium' | 'high' | 'critical'; factors: string[] } {
    const riskFactors: string[] = []
    let riskScore = 0

    // 公司状态风险
    if (company.current_status === 'Dissolved' || company.current_status === 'Liquidation') {
      riskFactors.push('公司已解散或清算')
      riskScore += 3
    } else if (company.current_status === 'Inactive') {
      riskFactors.push('公司状态不活跃')
      riskScore += 2
    }

    // 解散日期风险
    if (company.dissolution_date) {
      riskFactors.push('公司已解散')
      riskScore += 3
    }

    // 注册时间风险
    if (company.incorporation_date) {
      const incorporationDate = new Date(company.incorporation_date)
      const now = new Date()
      const ageInYears = (now.getTime() - incorporationDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      
      if (ageInYears < 1) {
        riskFactors.push('新注册公司（不足1年）')
        riskScore += 1
      }
    }

    // 高风险司法管辖区
    const highRiskJurisdictions = ['BZ', 'KY', 'VG', 'SC', 'MU', 'MT']
    if (highRiskJurisdictions.includes(company.jurisdiction_code)) {
      riskFactors.push('注册在高风险司法管辖区')
      riskScore += 2
    }

    // 缺少关键信息
    if (!company.registered_address_in_full) {
      riskFactors.push('缺少注册地址信息')
      riskScore += 1
    }

    if (!company.officers || company.officers.length === 0) {
      riskFactors.push('缺少董事信息')
      riskScore += 1
    }

    // 频繁更名
    if (company.previous_names && company.previous_names.length > 3) {
      riskFactors.push('频繁更名历史')
      riskScore += 1
    }

    // 确定风险等级
    let severity: 'low' | 'medium' | 'high' | 'critical'
    if (riskScore >= 5) {
      severity = 'critical'
    } else if (riskScore >= 3) {
      severity = 'high'
    } else if (riskScore >= 1) {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    return { severity, factors: riskFactors }
  }

  /**
   * 按司法管辖区搜索
   */
  async searchByJurisdiction(jurisdiction: string, options: QueryOptions = {}): Promise<APIResponse<IntelligenceDataPoint[]>> {
    return this.query('*', {
      ...options,
      geoFilter: [jurisdiction]
    })
  }

  /**
   * 获取公司董事信息
   */
  async getCompanyOfficers(jurisdictionCode: string, companyNumber: string): Promise<APIResponse<IntelligenceDataPoint[]>> {
    try {
      const params = new URLSearchParams({
        format: 'json',
        api_token: this.apiToken
      })

      const url = `${this.baseUrl}/companies/${jurisdictionCode}/${companyNumber}/officers?${params}`
      const response = await this.makeRequest(url)
      const data = await response.json()

      if (!data.results || !data.results.officers) {
        return this.createResponse(false, undefined, '董事信息不可用')
      }

      const results: IntelligenceDataPoint[] = []

      for (const officerData of data.results.officers) {
        const officer = officerData.officer
        
        results.push(this.createDataPoint(
          `opencorporates-officer-${officer.id}`,
          'business',
          'company_officer',
          {
            title: `公司董事: ${officer.name}`,
            description: `职位: ${officer.position} | 状态: ${officer.current_status}`,
            indicators: [officer.name, companyNumber],
            officerName: officer.name,
            position: officer.position,
            startDate: officer.start_date,
            endDate: officer.end_date,
            currentStatus: officer.current_status,
            inactive: officer.inactive,
            jurisdictionCode: officer.jurisdiction_code,
            opencorporatesUrl: officer.opencorporates_url
          },
          officer.inactive ? 'medium' : 'low',
          0.8
        ))
      }

      return this.createResponse(true, results)

    } catch (error: any) {
      return this.createResponse(false, undefined, error.message)
    }
  }

  /**
   * 健康检查
   */
  protected async healthCheck(): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        q: 'test',
        format: 'json',
        api_token: this.apiToken,
        per_page: '1'
      })

      const url = `${this.baseUrl}/companies/search?${params}`
      const response = await this.makeRequest(url)
      
      return response.ok
    } catch (error) {
      return false
    }
  }
}