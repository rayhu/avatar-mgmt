/**
 * 测试所有 API handlers 的日志输出
 * 用于验证日志格式和内容
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testHandler(name, method, endpoint, data = null) {
  console.log(`\n🧪 测试 ${name} handler...`);
  console.log('='.repeat(50));
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    console.log(`✅ ${name} 测试成功:`);
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应大小: ${JSON.stringify(response.data).length} bytes`);
    
    if (response.data.ssml) {
      console.log(`   SSML 长度: ${response.data.ssml.length}`);
    }
    
    if (Array.isArray(response.data)) {
      console.log(`   数据条数: ${response.data.length}`);
    }
    
  } catch (error) {
    console.log(`❌ ${name} 测试失败:`);
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   错误信息: ${error.response.data.error || error.message}`);
    } else {
      console.log(`   错误: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🚀 开始测试所有 API handlers...');
  console.log('请确保 API 服务器正在运行在 http://localhost:3000');
  console.log('='.repeat(60));

  // 测试 avatars handler
  await testHandler('Avatars', 'GET', '/api/avatars');

  // 测试 azure-tts handler (文本转语音)
  await testHandler('Azure TTS (文本)', 'POST', '/api/azure-tts', {
    text: '你好，这是一个测试。',
    voice: 'zh-CN-XiaoxiaoNeural'
  });

  // 测试 azure-tts handler (SSML)
  await testHandler('Azure TTS (SSML)', 'POST', '/api/azure-tts', {
    ssml: '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="zh-CN-XiaoxiaoNeural">这是一个 SSML 测试。</voice></speak>',
    voice: 'zh-CN-XiaoxiaoNeural'
  });

  // 测试 generate-ssml handler
  await testHandler('Generate SSML', 'POST', '/api/generate-ssml', {
    text: '今天天气很好，我想出去散步。',
    voice: 'zh-CN-XiaoxiaoNeural'
  });

  // 测试 openai-ssml handler
  await testHandler('OpenAI SSML', 'POST', '/api/openai-ssml', {
    text: '我很高兴见到你！',
    voice: 'zh-CN-XiaoxiaoNeural',
    model: 'gpt-4o'
  });

  console.log('\n🎉 所有测试完成！');
  console.log('请检查 API 服务器的控制台输出，查看日志格式是否正确。');
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testHandler }; 
