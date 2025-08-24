import type { IDataCollector } from '../../core/interfaces/IDataCollector';
import { ZhipuSearchCollector } from '../api/ZhipuSearchCollector.ts';
import { NewsAPICollector } from '../api/NewsAPICollector.ts';
import { GNewsCollector } from '../api/GNewsCollector.ts';
import { XSearchCollector } from '../browser/XSearchCollector.ts';

// The registry holds creator functions for each collector.
const collectorRegistry = new Map<string, () => IDataCollector>();

/**
 * Registers all available collectors into the factory.
 * This function should be called once at application startup.
 */
function initializeCollectors() {
  // Register API-based collectors
  collectorRegistry.set('ZhipuSearch', () => new ZhipuSearchCollector());
  collectorRegistry.set('NewsAPI', () => new NewsAPICollector());
  collectorRegistry.set('GNews', () => new GNewsCollector());

  // Register Browser-based collectors
  collectorRegistry.set('XSearch', () => new XSearchCollector());

  // TODO: Register other collectors as they are refactored
}

// Initialize all collectors on module load.
initializeCollectors();

export class CollectorFactory {
  static createCollector(name: string): IDataCollector | undefined {
    const creator = collectorRegistry.get(name);
    if (creator) {
      return creator();
    }
    console.warn(`Collector with name "${name}" not found.`);
    return undefined;
  }

  static registerCollector(name: string, creator: () => IDataCollector) {
    if (collectorRegistry.has(name)) {
      console.warn(`Collector with name "${name}" is already registered. Overwriting.`);
    }
    collectorRegistry.set(name, creator);
  }

  static getAvailableCollectors(): string[] {
    return Array.from(collectorRegistry.keys());
  }
}