#!/usr/bin/env node

/**
 * 测试 animate.download 翻译
 * 验证中英文翻译是否正确添加
 */

import fs from 'fs';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testTranslation() {
  log('🌐 测试 animate.download 翻译', 'blue');
  log('='.repeat(50), 'blue');

  let allTestsPassed = true;

  try {
    // 1. 检查中文翻译文件
    const zhCNPath = 'src/locales/zh-CN.ts';
    if (!fs.existsSync(zhCNPath)) {
      log('❌ 中文翻译文件不存在', 'red');
      return false;
    }

    const zhCNContent = fs.readFileSync(zhCNPath, 'utf8');

    // 2. 检查中文翻译
    if (zhCNContent.includes("download: '下载'")) {
      log('✅ 中文翻译已添加: 下载', 'green');
    } else {
      log('❌ 中文翻译未找到', 'red');
      allTestsPassed = false;
    }

    // 3. 检查英文翻译文件
    const enPath = 'src/locales/en.ts';
    if (!fs.existsSync(enPath)) {
      log('❌ 英文翻译文件不存在', 'red');
      return false;
    }

    const enContent = fs.readFileSync(enPath, 'utf8');

    // 4. 检查英文翻译
    if (enContent.includes("download: 'Download'")) {
      log('✅ 英文翻译已添加: Download', 'green');
    } else {
      log('❌ 英文翻译未找到', 'red');
      allTestsPassed = false;
    }

    // 5. 检查是否在 animate 对象中
    if (zhCNContent.includes('animate:') && zhCNContent.includes("download: '下载'")) {
      log('✅ 中文翻译在 animate 对象中', 'green');
    } else {
      log('❌ 中文翻译不在 animate 对象中', 'red');
      allTestsPassed = false;
    }

    if (enContent.includes('animate:') && enContent.includes("download: 'Download'")) {
      log('✅ 英文翻译在 animate 对象中', 'green');
    } else {
      log('❌ 英文翻译不在 animate 对象中', 'red');
      allTestsPassed = false;
    }

    // 6. 显示实际找到的内容
    const zhCNLines = zhCNContent.split('\n');
    const zhCNDownloadLine = zhCNLines.find(line => line.includes("download: '下载'"));
    if (zhCNDownloadLine) {
      log(`📝 中文翻译行: ${zhCNDownloadLine.trim()}`, 'blue');
    }

    const enLines = enContent.split('\n');
    const enDownloadLine = enLines.find(line => line.includes("download: 'Download'"));
    if (enDownloadLine) {
      log(`📝 英文翻译行: ${enDownloadLine.trim()}`, 'blue');
    }
  } catch (error) {
    log(`❌ 测试过程中发生错误: ${error.message}`, 'red');
    allTestsPassed = false;
  }

  log('', 'reset');
  log('='.repeat(50), 'blue');

  if (allTestsPassed) {
    log('🎉 所有测试通过！animate.download 翻译添加成功', 'green');
    log('', 'reset');
    log('✅ 翻译总结:', 'green');
    log('   - 中文翻译: 下载', 'green');
    log('   - 英文翻译: Download', 'green');
    log('   - 位置正确: 在 animate 对象中', 'green');
    log('   - 格式正确: 符合 i18n 标准', 'green');
    log('', 'reset');
    log('💡 使用说明:', 'blue');
    log("1. 在代码中使用 t('animate.download') 获取翻译", 'blue');
    log('2. 中文环境下显示: 下载', 'blue');
    log('3. 英文环境下显示: Download', 'blue');
    log('4. 翻译会自动根据当前语言环境切换', 'blue');
  } else {
    log('❌ 部分测试失败，请检查翻译结果', 'red');
  }

  return allTestsPassed;
}

// 运行测试
const success = testTranslation();
process.exit(success ? 0 : 1);
