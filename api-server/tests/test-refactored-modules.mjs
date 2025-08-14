import { voiceStylesManager } from '../utils/voice-styles-manager.js';
import { openaiSSMLGenerator } from '../utils/openai-ssml-generator.js';
import { responseBuilder } from '../utils/response-builder.js';
import { ssmlValidator } from '../utils/ssml-validator.js';

console.log('🧪 测试重构后的模块...\n');

// 测试语音样式管理器
console.log('📋 测试 1: 语音样式管理器');
try {
  await voiceStylesManager.loadFromFile();
  const styles = voiceStylesManager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
  console.log(`✅ 语音样式加载成功，Xiaoxiao 支持 ${styles.length} 种样式`);
  console.log(`   样式列表: ${styles.slice(0, 5).join(', ')}${styles.length > 5 ? '...' : ''}`);
} catch (error) {
  console.error('❌ 语音样式管理器测试失败:', error.message);
}
console.log('---\n');

// 测试 SSML 验证器
console.log('📋 测试 2: SSML 验证器');
try {
  const testSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="0st">测试内容</prosody></voice></speak>';
  const result = ssmlValidator.validate(testSSML);
  console.log(`✅ SSML 验证成功，警告数量: ${result.warnings.length}`);
  if (result.fixedSSML) {
    console.log(`   修复后的 SSML: ${result.fixedSSML}`);
  }
} catch (error) {
  console.error('❌ SSML 验证器测试失败:', error.message);
}
console.log('---\n');

// 测试响应构建器
console.log('📋 测试 3: 响应构建器');
try {
  const mockValidationResult = {
    isValid: true,
    errors: [],
    warnings: ['测试警告'],
    fixedSSML: undefined
  };
  
  const response = responseBuilder.buildSuccessResponse(
    '<speak>测试</speak>',
    mockValidationResult,
    '<speak>原始测试</speak>',
    { total_tokens: 100 },
    'gpt-4o'
  );
  
  console.log(`✅ 响应构建成功，包含 SSML: ${response.ssml}`);
  if (response.debugInfo) {
    console.log(`   调试信息: 验证通过，处理步骤: ${response.debugInfo.processingSteps.markdownRemoved ? '已移除 markdown' : '未移除 markdown'}`);
  }
} catch (error) {
  console.error('❌ 响应构建器测试失败:', error.message);
}
console.log('---\n');

console.log('🎉 所有模块测试完成！');
