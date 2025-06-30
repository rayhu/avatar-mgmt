#!/usr/bin/env node

/**
 * 测试后端 Azure TTS 功能
 * 运行: node test-azure-tts.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
  console.error('❌ 缺少必要的环境变量:');
  console.error('   AZURE_SPEECH_KEY:', AZURE_SPEECH_KEY ? '已设置' : '未设置');
  console.error('   AZURE_SPEECH_REGION:', AZURE_SPEECH_REGION ? '已设置' : '未设置');
  console.error('\n请检查 .env 文件配置');
  process.exit(1);
}

async function testAzureTTS() {
  console.log('🧪 测试 Azure TTS 功能...\n');
  
  // 使用更简单的 SSML 格式
  const testSSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
  <voice name="zh-CN-XiaoxiaoNeural">
    你好，这是一个测试语音合成。
  </voice>
</speak>`;

  try {
    console.log('📡 发送请求到 Azure TTS...');
    console.log('   区域:', AZURE_SPEECH_REGION);
    console.log('   SSML:', testSSML);
    
    const url = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-MICROSOFT-OUTPUTFORMAT': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'avatar-mgmt-test',
      },
      body: testSSML,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Azure TTS 请求失败:');
      console.error('   状态码:', response.status);
      console.error('   错误信息:', errorText);
      console.error('   请求 URL:', url);
      return false;
    }

    const audioBuffer = await response.arrayBuffer();
    const outputPath = path.join(process.cwd(), 'test-output.mp3');
    
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
    
    console.log('✅ Azure TTS 测试成功!');
    console.log(`   音频文件已保存到: ${outputPath}`);
    console.log(`   文件大小: ${(audioBuffer.byteLength / 1024).toFixed(2)} KB`);
    
    return true;
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    return false;
  }
}

async function testBackendAPI() {
  console.log('\n🌐 测试后端 API 端点...\n');
  
  try {
    // 启动一个简单的测试服务器
    const express = (await import('express')).default;
    const app = express();
    app.use(express.json());
    
    // 导入并注册 handler - 使用 TypeScript 文件
    const azureTTSHandler = (await import('./handlers/azure-tts.ts')).default;
    app.post('/api/azure-tts', azureTTSHandler);
    
    const server = app.listen(3001, () => {
      console.log('📡 测试服务器启动在端口 3001');
    });
    
    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📤 发送测试请求...');
    
    const testSSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
  <voice name="zh-CN-XiaoxiaoNeural">
    后端 API 测试成功！
  </voice>
</speak>`;
    
    const response = await fetch('http://localhost:3001/api/azure-tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ssml: testSSML,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ 后端 API 测试失败:');
      console.error('   状态码:', response.status);
      console.error('   错误信息:', errorData);
      return false;
    }
    
    const audioBlob = await response.blob();
    const outputPath = path.join(process.cwd(), 'test-backend-output.mp3');
    
    // 将 blob 转换为 buffer 并保存
    const arrayBuffer = await audioBlob.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    
    console.log('✅ 后端 API 测试成功!');
    console.log(`   音频文件已保存到: ${outputPath}`);
    console.log(`   文件大小: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);
    
    // 关闭测试服务器
    server.close();
    
    return true;
  } catch (error) {
    console.error('❌ 后端 API 测试失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始 Azure TTS 功能测试\n');
  
  const directTest = await testAzureTTS();
  const backendTest = await testBackendAPI();
  
  console.log('\n📊 测试结果汇总:');
  console.log(`   直接 Azure TTS: ${directTest ? '✅ 通过' : '❌ 失败'}`);
  console.log(`   后端 API: ${backendTest ? '✅ 通过' : '❌ 失败'}`);
  
  if (directTest && backendTest) {
    console.log('\n🎉 所有测试通过！后端 Azure TTS 配置正确。');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试失败，请检查配置。');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 测试过程中发生未预期的错误:', error);
  process.exit(1);
}); 
