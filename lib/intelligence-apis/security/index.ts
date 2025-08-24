/**
 * 网络安全情报API模块
 */

export { AlienVaultOTXProvider } from './alienvault-otx'
export { VirusTotalProvider } from './virustotal'
export { AbuseIPDBProvider } from './abuseipdb'
export { URLVoidProvider } from './urlvoid'

import { AlienVaultOTXProvider } from './alienvault-otx'
import { VirusTotalProvider } from './virustotal'
import { AbuseIPDBProvider } from './abuseipdb'
import { URLVoidProvider } from './urlvoid'
import { APIProvider } from '../types'

/**
 * 创建所有可用的安全情报提供商
 */
export function createSecurityProviders(): APIProvider[] {
  const providers: APIProvider[] = []

  console.log('🔧 检查安全情报API密钥...')

  // AlienVault OTX
  const otxKey = process.env.ALIENVAULT_OTX_API_KEY
  if (otxKey && !otxKey.includes('your_') && otxKey.length > 10) {
    console.log('  ✅ AlienVault OTX: 密钥有效')
    providers.push(new AlienVaultOTXProvider(otxKey))
  } else {
    console.log('  ⚠️  AlienVault OTX: 密钥未配置或无效')
  }

  // VirusTotal
  const vtKey = process.env.VIRUSTOTAL_API_KEY
  if (vtKey && !vtKey.includes('your_') && vtKey.length > 10) {
    console.log('  ✅ VirusTotal: 密钥有效')
    providers.push(new VirusTotalProvider(vtKey))
  } else {
    console.log('  ⚠️  VirusTotal: 密钥未配置或无效')
  }

  // AbuseIPDB
  const abuseKey = process.env.ABUSEIPDB_API_KEY
  if (abuseKey && !abuseKey.includes('your_') && abuseKey.length > 10) {
    console.log('  ✅ AbuseIPDB: 密钥有效')
    providers.push(new AbuseIPDBProvider(abuseKey))
  } else {
    console.log('  ⚠️  AbuseIPDB: 密钥未配置或无效')
  }

  // URLVoid
  const urlvoidKey = process.env.URLVOID_API_KEY
  if (urlvoidKey && !urlvoidKey.includes('your_') && urlvoidKey.length > 10) {
    console.log('  ✅ URLVoid: 密钥有效')
    providers.push(new URLVoidProvider(urlvoidKey))
  } else {
    console.log('  ⚠️  URLVoid: 密钥未配置或无效')
  }

  console.log(`🔒 安全情报提供商: ${providers.length} 个已加载`)
  return providers
}

/**
 * 获取安全情报提供商状态
 */
export async function getSecurityProvidersStatus(): Promise<Record<string, any>> {
  const providers = createSecurityProviders()
  const status: Record<string, any> = {}

  for (const provider of providers) {
    try {
      const providerStatus = await provider.getStatus()
      status[provider.name] = {
        enabled: provider.enabled,
        category: provider.category,
        rateLimit: provider.rateLimit,
        ...providerStatus
      }
    } catch (error: any) {
      status[provider.name] = {
        enabled: false,
        error: error.message
      }
    }
  }

  return status
}

/**
 * 安全情报聚合查询
 */
export async function querySecurityIntelligence(
  query: string,
  options: {
    providers?: string[]
    maxResults?: number
    useCache?: boolean
  } = {}
) {
  const allProviders = createSecurityProviders()
  const selectedProviders = options.providers 
    ? allProviders.filter(p => options.providers!.includes(p.name))
    : allProviders

  const results = await Promise.allSettled(
    selectedProviders.map(provider => 
      provider.query(query, {
        maxResults: options.maxResults,
        useCache: options.useCache
      })
    )
  )

  const successfulResults = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value)
    .filter(response => response.success)

  const allDataPoints = successfulResults
    .flatMap(response => response.data || [])

  return {
    success: true,
    totalProviders: selectedProviders.length,
    successfulProviders: successfulResults.length,
    totalResults: allDataPoints.length,
    data: allDataPoints,
    sources: successfulResults.map(r => r.source)
  }
}