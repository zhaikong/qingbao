import type { IDataCollector, CollectionOptions, CollectionResult, CollectorMetadata, CollectorType } from '../../core/interfaces/IDataCollector.ts';

export abstract class BaseCollector implements IDataCollector {
  abstract readonly type: CollectorType;
  abstract readonly name: string;
  readonly priority: number;

  constructor(priority: number = 10) {
    this.priority = priority;
  }

  abstract isAvailable(): Promise<boolean>;
  abstract collect(query: string, options?: CollectionOptions): Promise<CollectionResult>;
  abstract testConnection(): Promise<boolean>;

  getMetadata(): CollectorMetadata {
    return {
      name: this.name,
      type: this.type,
      priority: this.priority,
    };
  }
}