#!/usr/bin/env node

/**
 * 调试前端连接问题
 * 运行: tsx debug-frontend.js
 */

import 'dotenv/config';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testFrontendConnection() {
  console.log('🔍 调试前端连接问题...\n');
  
  console.log('📋 配置信息:');
  console.log(`   API_BASE_URL: ${API_BASE_URL}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  
  // 测试健康检查
  console.log('\n🏥 测试健康检查...');
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    console.log(`   状态: ${healthResponse.status}`);
    console.log(`   响应: ${await healthResponse.text()}`);
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
  }
  
  // 测试 SSML 生成
  console.log('\n📝 测试 SSML 生成...');
  try {
    const ssmlResponse = await fetch(`${API_BASE_URL}/api/generate-ssml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: '你好，这是一个测试。',
        voice: 'zh-CN-XiaoxiaoNeural',
      }),
    });
    
    console.log(`   状态: ${ssmlResponse.status}`);
    if (ssmlResponse.ok) {
      const data = await ssmlResponse.json();
      console.log(`   SSML 长度: ${data.ssml.length}`);
      console.log(`   SSML 预览: ${data.ssml.slice(0, 100)}...`);
      
      // 测试语音合成
      console.log('\n🔊 测试语音合成...');
      const ttsResponse = await fetch(`${API_BASE_URL}/api/azure-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssml: data.ssml,
          voice: 'zh-CN-XiaoxiaoNeural',
        }),
      });
      
      console.log(`   状态: ${ttsResponse.status}`);
      if (ttsResponse.ok) {
        const blob = await ttsResponse.blob();
        console.log(`   音频大小: ${(blob.size / 1024).toFixed(2)} KB`);
        console.log(`   音频类型: ${blob.type}`);
      } else {
        const errorData = await ttsResponse.json().catch(() => ({}));
        console.error(`   错误: ${errorData.error || ttsResponse.statusText}`);
      }
    } else {
      const errorData = await ssmlResponse.json().catch(() => ({}));
      console.error(`   错误: ${errorData.error || ssmlResponse.statusText}`);
    }
  } catch (error) {
    console.error('❌ SSML 生成失败:', error.message);
  }
  
  // 测试 CORS
  console.log('\n🌐 测试 CORS...');
  try {
    const corsResponse = await fetch(`${API_BASE_URL}/api/generate-ssml`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    
    console.log(`   状态: ${corsResponse.status}`);
    console.log(`   CORS 头:`, Object.fromEntries(corsResponse.headers.entries()));
  } catch (error) {
    console.error('❌ CORS 测试失败:', error.message);
  }
}

async function main() {
  try {
    await testFrontendConnection();
    console.log('\n🎉 调试完成！');
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
    process.exit(1);
  }
}

main(); 
