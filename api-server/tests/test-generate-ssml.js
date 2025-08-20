#!/usr/bin/env node

/**
 * 测试 SSML 生成功能
 * 运行: tsx test-generate-ssml.js
 */

import 'dotenv/config';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testGenerateSSML() {
  console.log('🧪 测试 SSML 生成功能...\n');

  const testCases = [
    {
      text: '你好，这是一个测试。',
      voice: 'zh-CN-XiaoxiaoNeural',
      description: '简单问候',
    },
    {
      text: '今天天气真好，我很开心！但是昨天的事情让我有点难过。',
      voice: 'zh-CN-XiaoxiaoNeural',
      description: '情绪变化文本',
    },
    {
      text: '欢迎使用我们的语音合成系统。',
      voice: 'zh-CN-YunxiNeural',
      description: '不同语音',
    },
  ];

  for (const testCase of testCases) {
    console.log(`📝 测试: ${testCase.description}`);
    console.log(`   文本: ${testCase.text}`);
    console.log(`   语音: ${testCase.voice}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-ssml`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testCase.text,
          voice: testCase.voice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ 测试失败: ${errorData.error || response.statusText}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ 生成成功!`);
      console.log(`   SSML: ${data.ssml.slice(0, 200)}...`);

      // 测试语音合成
      console.log(`🔊 测试语音合成...`);
      const ttsResponse = await fetch(`${API_BASE_URL}/api/azure-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssml: data.ssml.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
          voice: testCase.voice,
        }),
      });

      if (ttsResponse.ok) {
        const audioBlob = await ttsResponse.blob();
        console.log(`✅ 语音合成成功! 文件大小: ${(audioBlob.size / 1024).toFixed(2)} KB`);
      } else {
        const errorData = await ttsResponse.json().catch(() => ({}));
        console.error(`❌ 语音合成失败: ${errorData.error || ttsResponse.statusText}`);
      }
    } catch (error) {
      console.error(`❌ 测试失败:`, error.message);
    }

    console.log(''); // 空行分隔
  }
}

async function main() {
  console.log('🚀 开始 SSML 生成功能测试\n');

  try {
    await testGenerateSSML();
    console.log('🎉 测试完成！');
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

main();
