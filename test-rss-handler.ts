import { RSSFeedHandler } from './lib/data-sources/feeds/rss';
import { FeedSource } from './lib/data-sources/feeds/types';

// 创建一个测试 RSS 源
const testSource: FeedSource = {
  id: 'test-rss',
  name: '测试 RSS 源',
  type: 'rss',
  url: 'https://news.google.com/rss',  // 使用 Google News RSS 作为测试
  category: '新闻',
  enabled: true,
  reliability: 'high'
};

async function testRSSHandler() {
  console.log('开始测试 RSS 处理器...');
  
  const handler = new RSSFeedHandler();
  
  try {
    console.log(`尝试获取 RSS 源: ${testSource.name} (${testSource.url})`);
    const items = await handler.fetchItems(testSource, undefined, { limit: 5 });
    
    console.log(`成功获取 ${items.length} 条项目:`);
    items.forEach((item, index) => {
      console.log(`\n--- 项目 ${index + 1} ---`);
      console.log(`标题: ${item.title}`);
      console.log(`链接: ${item.url}`);
      console.log(`发布时间: ${item.publishedAt}`);
      console.log(`标签: ${item.tags ? item.tags.join(', ') : '无'}`);
    });
    
    // 测试源状态
    const status = await handler.getStatus(testSource);
    console.log('\n源状态:', status);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testRSSHandler().catch(console.error);