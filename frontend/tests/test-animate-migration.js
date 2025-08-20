#!/usr/bin/env node

/**
 * 测试 Animate.vue 迁移到配置文件
 * 验证动作和表情数据是否正确从配置文件获取
 */

import fs from 'fs';
import path from 'path';

// 测试配置
const testConfig = {
  animateVuePath: 'src/views/Animate.vue',
  animationsConfigPath: 'src/config/animations.ts',
  localesPath: 'src/locales',
};

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

function testAnimateVueMigration() {
  log('🧪 测试 Animate.vue 迁移到配置文件', 'blue');
  log('='.repeat(50), 'blue');

  let allTestsPassed = true;

  try {
    // 1. 检查 Animate.vue 文件是否存在
    if (!fs.existsSync(testConfig.animateVuePath)) {
      log('❌ Animate.vue 文件不存在', 'red');
      return false;
    }
    log('✅ Animate.vue 文件存在', 'green');

    // 2. 检查配置文件是否存在
    if (!fs.existsSync(testConfig.animationsConfigPath)) {
      log('❌ animations.ts 配置文件不存在', 'red');
      return false;
    }
    log('✅ animations.ts 配置文件存在', 'green');

    // 3. 读取 Animate.vue 内容
    const animateVueContent = fs.readFileSync(testConfig.animateVuePath, 'utf8');

    // 4. 检查是否导入了配置文件
    if (
      !animateVueContent.includes('getActionAnimations') ||
      !animateVueContent.includes('getEmotionAnimations')
    ) {
      log('❌ 未找到配置文件导入', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 配置文件导入正确', 'green');
    }

    // 5. 检查是否移除了硬编码的动作数组
    if (
      animateVueContent.includes("'Idle',") &&
      animateVueContent.includes("'Walking',") &&
      animateVueContent.includes("'Running',")
    ) {
      log('❌ 仍存在硬编码的动作数组', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 硬编码动作数组已移除', 'green');
    }

    // 6. 检查是否移除了硬编码的表情数组
    if (
      animateVueContent.includes("'Angry',") &&
      animateVueContent.includes("'Surprised',") &&
      animateVueContent.includes("'Sad',")
    ) {
      log('❌ 仍存在硬编码的表情数组', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 硬编码表情数组已移除', 'green');
    }

    // 7. 检查是否使用了 computed 属性
    if (
      !animateVueContent.includes('const actions = computed') ||
      !animateVueContent.includes('const emotions = computed')
    ) {
      log('❌ 未使用 computed 属性获取动作和表情', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 使用 computed 属性获取动作和表情', 'green');
    }

    // 8. 检查是否添加了显示名称函数
    if (
      !animateVueContent.includes('getActionDisplayName') ||
      !animateVueContent.includes('getEmotionDisplayName')
    ) {
      log('❌ 未找到显示名称函数', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 显示名称函数已添加', 'green');
    }

    // 9. 检查模板中是否使用了显示名称函数
    if (
      !animateVueContent.includes('getActionDisplayName(action)') ||
      !animateVueContent.includes('getEmotionDisplayName(emotion)')
    ) {
      log('❌ 模板中未使用显示名称函数', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 模板中使用显示名称函数', 'green');
    }

    // 10. 检查时间轴显示是否正确
    if (
      !animateVueContent.includes('getActionDisplayName(keyframe.action') ||
      !animateVueContent.includes('getEmotionDisplayName(keyframe.emotion')
    ) {
      log('❌ 时间轴显示未使用显示名称函数', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 时间轴显示使用显示名称函数', 'green');
    }

    // 11. 检查处理函数是否正确更新
    if (
      !animateVueContent.includes('actions.value.includes(value)') ||
      !animateVueContent.includes('emotions.value.includes(value)')
    ) {
      log('❌ 处理函数未正确更新', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 处理函数已正确更新', 'green');
    }

    // 12. 读取配置文件内容
    const configContent = fs.readFileSync(testConfig.animationsConfigPath, 'utf8');

    // 13. 检查配置文件中的动作数量
    const actionCount = (configContent.match(/actualName: '/g) || []).length;
    const enabledActionCount = (configContent.match(/enabled: true/g) || []).length;

    log(`📊 配置文件统计:`, 'blue');
    log(`   - 总动作数量: ${actionCount}`, 'blue');
    log(`   - 启用动作数量: ${enabledActionCount}`, 'blue');

    // 14. 检查表情配置
    if (
      configContent.includes('Angry') &&
      configContent.includes('Surprised') &&
      configContent.includes('Sad')
    ) {
      log('✅ 表情配置正确 (Angry, Surprised, Sad)', 'green');
    } else {
      log('❌ 表情配置不正确', 'red');
      allTestsPassed = false;
    }

    // 15. 检查是否移除了不存在的表情
    if (configContent.includes('Neutral')) {
      log('❌ 配置文件中仍包含不存在的 Neutral 表情', 'red');
      allTestsPassed = false;
    } else {
      log('✅ 已移除不存在的 Neutral 表情', 'green');
    }
  } catch (error) {
    log(`❌ 测试过程中发生错误: ${error.message}`, 'red');
    allTestsPassed = false;
  }

  log('', 'reset');
  log('='.repeat(50), 'blue');

  if (allTestsPassed) {
    log('🎉 所有测试通过！Animate.vue 迁移成功', 'green');
    log('', 'reset');
    log('✅ 改进总结:', 'green');
    log('   - 从配置文件获取动作和表情数据', 'green');
    log('   - 使用 computed 属性动态过滤启用的动画', 'green');
    log('   - 添加显示名称映射函数', 'green');
    log('   - 更新模板使用配置中的显示名称', 'green');
    log('   - 更新处理函数支持动态数据', 'green');
    log('   - 移除硬编码的动画数组', 'green');
    log('   - 移除不存在的 Neutral 表情', 'green');
  } else {
    log('❌ 部分测试失败，请检查迁移结果', 'red');
  }

  return allTestsPassed;
}

// 运行测试
const success = testAnimateVueMigration();
process.exit(success ? 0 : 1);
