import { BaseCollector } from '../base/BaseCollector.ts';
import type { CollectorType, IDataCollector, CollectionOptions, CollectionResult } from '../../core/interfaces/IDataCollector.ts';
import type { SearchResult } from '../../lib/types.ts';

class GNewsAPI {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = process.env.GNEWS_API_TOKEN;
    }

    isConfigured(): boolean {
        return !!this.apiKey;
    }

    async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {
        if (!this.isConfigured()) {
            console.warn('GNews API key is not configured. Skipping search.');
            return [];
        }

        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&token=${this.apiKey}&max=${maxResults}&lang=en`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`GNews API request failed: ${response.status} - ${errorBody.errors.join(', ')}`);
            }

            const data = await response.json();
            return (data.articles || []).map((article: any) => ({
                title: article.title,
                url: article.url,
                snippet: article.description || '',
                content: article.content || '',
                source: article.source?.name || 'GNews',
                publishDate: article.publishedAt,
                relevanceScore: 0.8
            }));
        } catch (error) {
            console.error('GNews API search failed:', error);
            throw error;
        }
    }
}

export class GNewsCollector extends BaseCollector {
    readonly type: CollectorType = 'API';
    readonly name = 'GNews';
    private api = new GNewsAPI();

    constructor() {
        super(9); // Slightly lower priority than NewsAPI
    }

    public async isAvailable(): Promise<boolean> {
        return this.api.isConfigured();
    }

    public async collect(query: string, options?: CollectionOptions): Promise<CollectionResult> {
        if (!await this.isAvailable()) {
            return {
                source: this.name,
                results: [],
                error: 'GNews API is not configured (missing GNEWS_API_TOKEN).',
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
            return false;
        }
    }
}