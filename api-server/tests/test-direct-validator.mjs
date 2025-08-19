import { ssmlValidator } from '../utils/ssml-validator.js';

console.log('🧪 测试直接使用 SSML 验证器...\n');

// 测试用例
const testSSML =
  '<speak><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="0st">测试内容</prosody></voice></speak>';

console.log('📝 测试 SSML:', testSSML);
console.log('---');

try {
  const result = ssmlValidator.validate(testSSML);

  console.log('✅ 验证结果:', result.isValid ? '通过' : '失败');
  console.log('⚠️  警告数量:', result.warnings.length);
  console.log('❌ 错误数量:', result.errors.length);

  if (result.warnings.length > 0) {
    console.log('\n⚠️  警告详情:');
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    result.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (result.fixedSSML) {
    console.log('\n🔧 修复后的 SSML:');
    console.log(`   ${result.fixedSSML}`);
  }

  console.log('\n🎉 测试完成！');
} catch (error) {
  console.error('❌ 测试失败:', error.message);
}
