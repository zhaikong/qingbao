import { BaseCollector } from '../base/BaseCollector.ts';
import type { CollectorType, IDataCollector, CollectionOptions, CollectionResult } from '../../core/interfaces/IDataCollector.ts';
import type { SearchResult } from '../../lib/types.ts';

// Internal class to handle direct API communication
class NewsAPI {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = process.env.NEWSAPI_KEY;
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }

    async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {
        if (!this.isConfigured()) {
            console.warn('NewsAPI key is not configured. Skipping search.');
            return [];
        }

        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${this.apiKey}&pageSize=${maxResults}&sortBy=relevance`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`NewsAPI request failed: ${response.status} - ${errorBody.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const results: SearchResult[] = (data.articles || []).map((article: any) => ({
                title: article.title,
                url: article.url,
                snippet: article.description || '',
                content: article.content || '',
                source: article.source?.name || 'NewsAPI',
                publishDate: article.publishedAt,
                relevanceScore: 0.85
            }));

            return results;
        } catch (error) {
            console.error('NewsAPI search failed:', error);
            throw error;
        }
    }
}

export class NewsAPICollector extends BaseCollector {
    readonly type: CollectorType = 'API';
    readonly name = 'NewsAPI';
    private api = new NewsAPI();

    constructor() {
        super(10);
    }

    public async isAvailable(): Promise<boolean> {
        return this.api.isConfigured();
    }

    public async collect(query: string, options?: CollectionOptions): Promise<CollectionResult> {
        if (!await this.isAvailable()) {
            return {
                source: this.name,
                results: [],
                error: 'NewsAPI is not configured (missing NEWSAPI_KEY).',
            };
        }

        try {
            const maxResults = (options as any)?.maxResults ?? 10;
            const searchResults = await this.api.search(query, maxResults);

            return {
                source: this.name,
                results: searchResults,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error collecting data from ${this.name}:`, errorMessage);
            return {
                source: this.name,
                results: [],
                error: errorMessage,
            };
        }
    }

    public async testConnection(): Promise<boolean> {
        if (!await this.isAvailable()) {
            return false;
        }
        try {
            await this.api.search('test', 1);
            return true;
        } catch (error) {
            console.error(`Connection test for ${this.name} failed:`, error);
            return false;
        }
    }
}