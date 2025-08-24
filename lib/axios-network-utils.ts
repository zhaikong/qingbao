/**
 * 基于Axios的网络请求工具 - 彻底解决undici连接超时问题
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import https from 'https';
import http from 'http';

// 创建自定义axios实例，配置更长的超时时间
const axiosInstance = axios.create({
  timeout: 60000, // 60秒总超时
  httpsAgent: new https.Agent({
    timeout: 60000, // 60秒连接超时
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 50,
    maxFreeSockets: 10,
    rejectUnauthorized: false // 允许自签名证书
  }),
  httpAgent: new http.Agent({
    timeout: 60000, // 60秒连接超时
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 50,
    maxFreeSockets: 10
  }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});

/**
 * 带重试的axios网络请求
 */
export async function axiosWithRetry(
  url: string, 
  options: AxiosRequestConfig = {}, 
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<AxiosResponse> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AxiosNetwork] 尝试请求 (${attempt}/${maxRetries}): ${url}`);
      
      const config: AxiosRequestConfig = {
        ...options,
        url,
        method: options.method || 'GET',
        timeout: 60000,
        validateStatus: (status) => status < 500 // 只有5xx错误才重试
      };
      
      const response = await axiosInstance.request(config);
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`[AxiosNetwork] 请求成功: ${url} (${response.status})`);
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      lastError = error;
      console.error(`[AxiosNetwork] 请求失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        const delay = retryDelay * attempt;
        console.log(`[AxiosNetwork] 等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`[AxiosNetwork] 所有重试都失败: ${url}`);
  throw lastError!;
}

/**
 * 兼容fetch API的包装函数
 */
export async function fetchWithAxios(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const axiosConfig: AxiosRequestConfig = {
      method: (options.method as any) || 'GET',
      headers: options.headers as any,
      data: options.body,
      responseType: 'text'
    };
    
    const axiosResponse = await axiosWithRetry(url, axiosConfig, 2, 2000);
    
    // 创建兼容的Response对象
    const response = new Response(axiosResponse.data, {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: new Headers(axiosResponse.headers as any)
    });
    
    return response;
  } catch (error: any) {
    throw new Error(`Fetch failed: ${error.message}`);
  }
}