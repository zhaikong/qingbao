/**
 * 网络请求工具 - 解决连接超时问题
 */

// 设置全局undici配置来解决连接超时问题
import { setGlobalDispatcher, Agent } from 'undici';

// 创建自定义undici Agent，设置更长的连接超时
const customAgent = new Agent({
  connect: {
    timeout: 60000, // 60秒连接超时
    keepAlive: true,
    keepAliveTimeout: 30000,
    keepAliveMaxTimeout: 60000
  },
  bodyTimeout: 60000, // 60秒响应超时
  headersTimeout: 60000, // 60秒头部超时
  maxRedirections: 5
});

// 设置为全局dispatcher
setGlobalDispatcher(customAgent);

/**
 * 增强的fetch函数，解决连接超时问题
 */
export async function enhancedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = 60000; // 60秒总超时
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...options.headers
      }
    };

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 带重试的网络请求
 */
export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[NetworkUtils] 尝试请求 (${attempt}/${maxRetries}): ${url}`);
      const response = await enhancedFetch(url, options);
      
      if (response.ok) {
        console.log(`[NetworkUtils] 请求成功: ${url}`);
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`[NetworkUtils] 请求失败 (尝试 ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        const delay = retryDelay * attempt;
        console.log(`[NetworkUtils] 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`[NetworkUtils] 所有重试都失败: ${url}`);
  throw lastError!;
}