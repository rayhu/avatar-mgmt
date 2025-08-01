#!/usr/bin/env node

/**
 * Azure TTS Audio Download Script (Direct API)
 * 
 * This script downloads Azure TTS audio files as MP3 by directly calling Azure API.
 * It uses the specified voices (Xiaoxiao, Yunxi, Yunjian) and sample texts from Animate.vue.
 * 
 * Usage:
 *   node download-azure-tts-direct.js
 * 
 * Requirements:
 *   - Azure Speech credentials in environment variables
 *   - VITE_AZURE_SPEECH_KEY and VITE_AZURE_SPEECH_REGION
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../public/audio-samples');
const SPEECH_KEY = process.env.VITE_AZURE_SPEECH_KEY2 || process.env.VITE_AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.VITE_AZURE_SPEECH_REGION;

// Voices to use (matching the user's request)
const TARGET_VOICES = [
  { name: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao' },
  { name: 'zh-CN-YunxiNeural', label: 'Yunxi' },
  { name: 'zh-CN-YunjianNeural', label: 'Yunjian' }
];

// Sample texts from Animate.vue
const SAMPLE_TEXTS = [
  { emotion: 'empathetic', text: '非常抱歉让您有这样的体验' },
  { emotion: 'cheerful', text: '哇，太开心啦～感谢您喜欢我们的服务。' },
  { emotion: 'assistant', text: '别担心，我来啦～我们一起查一下您的情况吧。' },
  { emotion: 'hopeful', text: '今天也要元气满满哦～祝您天天开心，一切顺利！' }
];

/**
 * Generate SSML for the given text and voice
 */
function generateSSML(text, voice) {
  return `<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts">
  <voice name="${voice}">${text}</voice>
</speak>`;
}

/**
 * Download audio directly from Azure TTS API
 */
async function downloadAudio(ssml, voice, filename) {
  try {
    console.log(`🎵 正在生成: ${filename}`);
    console.log(`   📡 直接调用 Azure API`);
    
         if (!SPEECH_KEY || !SPEECH_REGION) {
       throw new Error('Azure Speech credentials not found in environment variables. Please set VITE_AZURE_SPEECH_KEY2 and VITE_AZURE_SPEECH_REGION');
     }

    const url = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-MICROSOFT-OUTPUTFORMAT': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'avatar-mgmt-download-script-v1',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    await fs.writeFile(outputPath, Buffer.from(audioBuffer));
    
    console.log(`✅ 已保存: ${filename} (${(audioBuffer.byteLength / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    console.error(`❌ 下载失败 ${filename}:`, error.message);
    return false;
  }
}

/**
 * Create output directory if it doesn't exist
 */
async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    console.log(`📁 创建输出目录: ${OUTPUT_DIR}`);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  console.log('🔍 检查环境配置...');
  
  if (!SPEECH_KEY) {
    console.error('❌ 未找到 Azure Speech Key 环境变量');
    console.log('💡 请在 .env 文件中设置: VITE_AZURE_SPEECH_KEY2=your_azure_speech_key');
    return false;
  }
  
  if (!SPEECH_REGION) {
    console.error('❌ 未找到 Azure Speech Region 环境变量');
    console.log('💡 请在 .env 文件中设置: VITE_AZURE_SPEECH_REGION=your_azure_region');
    return false;
  }
  
  console.log(`✅ Azure Speech Key: ${SPEECH_KEY.substring(0, 8)}...`);
  console.log(`✅ Azure Speech Region: ${SPEECH_REGION}`);
  return true;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Azure TTS 直接下载脚本开始');
  console.log(`📂 输出目录: ${OUTPUT_DIR}`);
  console.log(`🎤 目标语音: ${TARGET_VOICES.map(v => v.label).join(', ')}`);
  console.log(`📝 样本数量: ${SAMPLE_TEXTS.length}`);
  console.log('');

  // Validate environment
  if (!validateEnvironment()) {
    process.exit(1);
  }

  // Ensure output directory exists
  await ensureOutputDir();

  let successCount = 0;
  let totalCount = 0;

  // Generate audio for each voice and sample text
  for (const voice of TARGET_VOICES) {
    console.log(`🎤 处理语音: ${voice.label} (${voice.name})`);
    
    for (const sample of SAMPLE_TEXTS) {
      totalCount++;
      
      // Create filename: voice_emotion.mp3
      const filename = `${voice.label.toLowerCase()}_${sample.emotion}.mp3`;
      
      // Generate SSML
      const ssml = generateSSML(sample.text, voice.name);
      
      // Download audio
      const success = await downloadAudio(ssml, voice.name, filename);
      if (success) {
        successCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 下载完成统计:');
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`❌ 失败: ${totalCount - successCount}/${totalCount}`);
  console.log(`📂 文件保存在: ${OUTPUT_DIR}`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有音频文件下载成功！');
  } else {
    console.log('⚠️  部分文件下载失败，请检查错误信息');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的 Promise 拒绝:', error);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
}); 
