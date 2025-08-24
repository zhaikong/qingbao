import { BaseCollector } from '../base/BaseCollector.ts';
import type { SearchResult, CollectorConfig } from '../../lib/types.ts';
import fetch from 'node-fetch';

// Helper function to call the Chrome MCP Server using JSON-RPC 2.0
// This function is moved from the old chrome-mcp-integration
async function callChromeMcpTool(toolName: string, args: object = {}): Promise<any> {
  const mcpUrl = process.env.CHROME_MCP_URL;
  if (!mcpUrl) {
    throw new Error('Chrome MCP Server URL is not configured in .env.local');
  }

  console.log(`📞 Calling Chrome MCP tool (JSON-RPC): ${toolName} with args:`, args);

  const requestBody = {
    jsonrpc: '2.0',
    method: toolName,
    params: args,
    id: Math.floor(Math.random() * 1000),
  };

  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    timeout: 30000, // 30-second timeout for MCP calls
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chrome MCP Server HTTP error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const jsonResponse = await response.json();
  if (jsonResponse.error) {
    throw new Error(`Chrome MCP Server RPC error: ${jsonResponse.error.message} (Code: ${jsonResponse.error.code})`);
  }

  return jsonResponse.result;
}


export class XSearchCollector extends BaseCollector {
  constructor() {
    super();
    this.name = 'XSearch';
    this.type = 'Browser';
  }

  async isAvailable(): Promise<boolean> {
    // Configuration for this collector is read directly from environment variables
    const isEnabled = process.env.XSEARCH_ENABLED === 'true';
    const mcpUrl = process.env.CHROME_MCP_URL;

    if (!isEnabled) {
      console.log(`⚠️ Collector ${this.name} is disabled via environment variables (XSEARCH_ENABLED).`);
      return false;
    }
    if (!mcpUrl) {
      console.log(`⚠️ Collector ${this.name} is disabled because CHROME_MCP_URL is not set.`);
      return false;
    }
    
    return true;
  }

  async collect(query: string): Promise<SearchResult[]> {
    if (!(await this.isAvailable())) {
      console.log(`Collector ${this.name} is not available, skipping collection.`);
      return [];
    }

    try {
      console.log(`🐦 Starting X Platform (Twitter) search for: "${query}"`);
      
      const baseUrl = process.env.X_PLATFORM_URL || 'https://x.com';
      const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
      
      // Use MCP tool to perform browser automation
      await callChromeMcpTool('navigate_to_url', { url: searchUrl });
      
      // Wait for the page to load. This might need adjustment.
      await new Promise(resolve => setTimeout(resolve, 7000)); // Increased wait time to 7s

      const pageContent = await callChromeMcpTool('get_page_content', { format: 'markdown' });

      if (!pageContent) {
        console.warn(`⚠️ No content returned from X Platform for query: "${query}"`);
        return [];
      }

      const results: SearchResult[] = [
        {
          title: `X platform search results for "${query}"`,
          content: pageContent,
          url: searchUrl,
          source: 'X Platform (via Browser Automation)',
          publishDate: new Date().toISOString(),
          relevanceScore: 0.85, // Score can be refined later
        }
      ];

      console.log(`✅ X Platform search successful, returning 1 consolidated result.`);
      return results;

    } catch (error) {
      this.handleError(error, `Failed to collect data from X Platform for query: "${query}"`);
      return [];
    }
  }
}