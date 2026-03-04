// 简单的构建脚本
const fs = require('fs');
const path = require('path');

console.log('🔨 开始构建...');

// 检查必要文件
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'content.js',
  'styles/popup.css',
  'styles/options.css'
];

const missingFiles = [];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ 缺少必要文件:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

// 检查图标
const iconSizes = [16, 48, 128];
const missingIcons = [];

iconSizes.forEach(size => {
  const iconPath = `icons/icon${size}.png`;
  if (!fs.existsSync(iconPath)) {
    missingIcons.push(iconPath);
  }
});

if (missingIcons.length > 0) {
  console.warn('⚠️  缺少图标文件:');
  missingIcons.forEach(icon => console.warn(`   - ${icon}`));
  console.warn('   请使用 generate-icons.html 生成图标');
}

// 验证 manifest.json
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  console.log(`✓ Manifest 验证通过 (v${manifest.version})`);
} catch (error) {
  console.error('❌ Manifest 格式错误:', error.message);
  process.exit(1);
}

console.log('✅ 构建检查完成！');
console.log('\n📦 可以加载到 Chrome 了:');
console.log('   1. 打开 chrome://extensions/');
console.log('   2. 开启"开发者模式"');
console.log('   3. 点击"加载已解压的扩展程序"');
console.log('   4. 选择本项目目录\n');
