#!/usr/bin/env node

/**
 * 简单的 Azure TTS 配置测试
 * 运行: tsx test-simple.js
 */

import 'dotenv/config';

console.log('🔍 检查 Azure TTS 配置...\n');

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

console.log('📋 环境变量检查:');
console.log(`   AZURE_SPEECH_KEY: ${AZURE_SPEECH_KEY ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`   AZURE_SPEECH_REGION: ${AZURE_SPEECH_REGION ? '✅ 已设置' : '❌ 未设置'}`);

if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
  console.error('\n❌ 缺少必要的环境变量！');
  console.error('请在 api-server/.env 文件中设置：');
  console.error('AZURE_SPEECH_KEY=your_key_here');
  console.error('AZURE_SPEECH_REGION=your_region_here');
  process.exit(1);
}

console.log('\n✅ 环境变量配置正确！');
console.log(`   区域: ${AZURE_SPEECH_REGION}`);
console.log(`   密钥: ${AZURE_SPEECH_KEY.substring(0, 8)}...`);

// 测试基本的网络连接
console.log('\n🌐 测试网络连接...');

try {
  const testUrl = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
  console.log(`   测试 URL: ${testUrl}`);

  const response = await fetch(testUrl, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-MICROSOFT-OUTPUTFORMAT': 'audio-24khz-48kbitrate-mono-mp3',
    },
    body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-JennyNeural">
    Hello, this is a test.
  </voice>
</speak>`,
  });

  if (response.ok) {
    console.log('✅ 网络连接和认证成功！');
    console.log(`   响应状态: ${response.status}`);
    console.log(`   内容类型: ${response.headers.get('content-type')}`);
  } else {
    console.error('❌ 网络连接失败:');
    console.error(`   状态码: ${response.status}`);
    console.error(`   状态文本: ${response.statusText}`);
    const errorText = await response.text();
    console.error(`   错误信息: ${errorText}`);
    console.error(`   响应头:`, Object.fromEntries(response.headers.entries()));
  }
} catch (error) {
  console.error('❌ 网络连接错误:', error.message);
}

console.log('\n📝 下一步:');
console.log('1. 如果网络连接成功，运行完整测试: yarn test:azure');
console.log('2. 启动 API 服务器: yarn dev');
console.log('3. 在前端测试语音合成功能');
