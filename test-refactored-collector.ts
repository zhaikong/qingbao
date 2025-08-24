import { CollectorFactory } from './collectors/base/CollectorFactory.ts';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testSingleCollector(collectorName: string, query: string) {
  console.log(`\n--- 🚀 Testing Collector: ${collectorName} ---`);

  const collector = CollectorFactory.createCollector(collectorName);

  if (!collector) {
    console.error(`❌ Failed to create ${collectorName} collector from the factory.`);
    return;
  }

  console.log(`✅ Successfully created collector: ${collector.name}`);
  
  const isAvailable = await collector.isAvailable();
  console.log(`📡 Availability: ${isAvailable ? 'Available' : 'Not Available'}`);

  if (!isAvailable) {
    console.warn(`⚠️ Collector ${collectorName} is not available, skipping collection test.`);
    return;
  }

  console.log('🔍 Performing a test collection...');

  try {
    const results = await collector.collect(query, { maxResults: 1 } as any);

    if (results.error) {
      console.error(`❌ Collection failed with error: ${results.error}`);
    } else if (results.results && results.results.length > 0) {
      console.log(`✅ Collection successful! Received ${results.results.length} results.`);
      console.log('--- Sample Result ---');
      console.log(JSON.stringify(results.results[0], null, 2));
      console.log('---------------------');
    } else {
      console.warn('⚠️ Collection completed, but no results were returned.');
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`❌ An unexpected error occurred during collection: ${error}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting all collector tests...');
  const collectorsToTest = CollectorFactory.getAvailableCollectors();
  console.log(`Found collectors to test: ${collectorsToTest.join(', ')}`);

  for (const collectorName of collectorsToTest) {
    await testSingleCollector(collectorName, `test query for ${collectorName}`);
  }

  console.log('\n✅ All collector tests completed.');
}

runAllTests();
