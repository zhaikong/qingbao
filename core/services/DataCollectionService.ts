// 核心服务层 (NEW)
// 数据采集服务

import { CollectorFactory } from '../../collectors/base/CollectorFactory.ts';
import type { SearchResult } from '../../lib/types.ts';

class DataCollectionService {
  /**
   * Collects data from a specified list of sources.
   * @param query The search query.
   * @param sources An array of collector names to use.
   * @returns A promise that resolves to an array of search results.
   */
  async collectData(query: string, sources: string[]): Promise<SearchResult[]> {
    console.log(`🚀 Starting data collection for query: "${query}" from sources: ${sources.join(', ')}`);
    
    const allResults: SearchResult[] = [];
    
    for (const sourceName of sources) {
      const collector = CollectorFactory.createCollector(sourceName);
      if (!collector) {
        console.warn(`⚠️ Collector "${sourceName}" not found, skipping.`);
        continue;
      }

      try {
        if (await collector.isAvailable()) {
          console.log(`🔍 Collecting from ${sourceName}...`);
          const collectionResponse = await collector.collect(query);
          if (collectionResponse.results) {
            allResults.push(...collectionResponse.results);
            console.log(`✅ Collected ${collectionResponse.results.length} results from ${sourceName}.`);
          } else if (collectionResponse.error) {
             console.error(`❌ Error from ${sourceName}: ${collectionResponse.error}`);
          }
        } else {
          console.warn(`⚠️ Collector ${sourceName} is not available, skipping.`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ An unexpected error occurred with collector ${sourceName}: ${errorMessage}`);
      }
    }

    console.log(`✅ Total results collected: ${allResults.length}`);
    return allResults;
  }

  /**
   * Gets a list of all available data source collectors.
   * @returns A promise that resolves to an array of available source names.
   */
  async getAvailableSources(): Promise<string[]> {
    return CollectorFactory.getAvailableCollectors();
  }

  /**
   * Tests the connection/availability of a single data source.
   * @param sourceId The name of the collector to test.
   * @returns A promise that resolves to true if the source is available, false otherwise.
   */
  async testSourceConnection(sourceId: string): Promise<boolean> {
    const collector = CollectorFactory.createCollector(sourceId);
    if (!collector) {
      return false;
    }
    return collector.isAvailable();
  }
}

export default new DataCollectionService();