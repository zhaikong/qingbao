const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'app/osint-solutions/page.tsx',
  'components/DataFusionDashboard.tsx',
  'components/MonitoringDashboard.tsx',
  'components/MonitoringTargets.tsx'
];

// 修复字符串中的转义字符问题
function fixStringLiterals(content) {
  // 替换 \" 为 "
  return content.replace(/\\"/g, '"');
}

// 修复每个文件
filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`修复文件: ${filePath}`);
    
    // 读取文件内容
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 修复字符串字面量
    content = fixStringLiterals(content);
    
    // 写回文件
    fs.writeFileSync(fullPath, content, 'utf8');
    
    console.log(`✓ 已修复: ${filePath}`);
  } else {
    console.log(`✗ 文件不存在: ${filePath}`);
  }
});

console.log('所有文件修复完成！');