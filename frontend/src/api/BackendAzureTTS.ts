/**
 * 后端 Azure TTS API 客户端
 * 通过后端代理调用 Azure TTS，避免在前端暴露 Azure key
 */

import { logger } from '@/utils/logger';
import apiClient from './axios';

export interface VoiceOption {
  name: string;
  label: string;
  styles?: string[];
}

// 可用的中文语音列表（静态数据，避免频繁请求）
export const availableVoices: VoiceOption[] = [
  { name: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女声)' },
  { name: 'zh-CN-YunxiNeural', label: '云希 (男声)' },
  { name: 'zh-CN-YunyangNeural', label: '云扬 (男声)' },
  { name: 'zh-CN-XiaochenNeural', label: '晓辰 (女声)' },
  { name: 'zh-CN-XiaohanNeural', label: '晓涵 (女声)' },
  { name: 'zh-CN-XiaomoNeural', label: '晓墨 (女声)' },
  { name: 'zh-CN-XiaoxuanNeural', label: '晓萱 (女声)' },
  { name: 'zh-CN-XiaoyanNeural', label: '晓颜 (女声)' },
  { name: 'zh-CN-XiaoyouNeural', label: '晓悠 (女声)' },
  { name: 'zh-CN-YunjianNeural', label: '云健 (男声)' },
  { name: 'zh-CN-YunxiaNeural', label: '云夏 (男声)' },
  { name: 'zh-CN-YunzeNeural', label: '云泽 (男声)' },
];

/**
 * 语音合成（通过后端 Azure TTS API）
 * 参考前端 azureTTS.ts 的实现，支持文本和 SSML 输入
 * @param content 要合成的内容（文本或 SSML）
 * @param voice 语音名称
 * @param isSSML 是否为 SSML 格式
 * @param onViseme 口型回调函数（后端暂不支持，返回空实现）
 * @returns 音频 Blob
 */
export async function synthesizeSpeech(
  content: string,
  voice: string = 'zh-CN-XiaoxiaoNeural',
  isSSML: boolean = false,
  onViseme?: (id: number, timeMs: number, animation?: string) => void,
): Promise<Blob> {
  const startTime = Date.now();
  
  logger.apiCall('Azure TTS', '/api/azure-tts', {
    voice,
    isSSML,
    contentLength: content.length,
    contentPreview: content.slice(0, 100) + (content.length > 100 ? '...' : '')
  });
  
  // 后端暂不支持 viseme，返回空实现
  if (onViseme) {
    logger.warn('Viseme callback is not supported in backend mode', {
      component: 'BackendAzureTTS',
      method: 'synthesizeSpeech'
    });
  }
  
  try {
    // 处理 SSML 格式，参考前端 azureTTS.ts 的逻辑
    let processedContent = content;
    if (isSSML) {
      logger.debug('处理 SSML 格式', {
        component: 'BackendAzureTTS',
        method: 'synthesizeSpeech',
        originalContent: content.slice(0, 200) + (content.length > 200 ? '...' : '')
      });

      // 不可靠的 SSML 直接重构为标准格式
      // 0st 是无效的，需要转换为 +0st
      processedContent = content.replace(/pitch="0st"/g, 'pitch="+0st"');

      const inner = content
        .replace(/<speak[\s\S]*?>/, '')
        .replace(/<\/speak>/, '')
        .trim();

      const hasVoice = /<voice[\s>]/i.test(inner);
      let processed = inner;
      if (hasVoice) {
        const m = inner.match(/<voice[^>]*name=["']([^"']+)["']/i);
        const detected = m?.[1];
        if (detected && detected !== voice) {
          logger.warn(`LLM returned voice "${detected}" which differs from selected "${voice}". Using LLM-specified voice.`, {
            component: 'BackendAzureTTS',
            method: 'synthesizeSpeech',
            selectedVoice: voice,
            detectedVoice: detected
          });
        }
      } else {
        processed = `<voice name="${voice}">${inner}</voice>`;
      }
      const wrapped = processed;
      processedContent = `<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts">${wrapped}</speak>`;
    } else {
      // 纯文本，包装为简单 SSML
      processedContent = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
  <voice name="${voice}">
    ${content}
  </voice>
</speak>`;
    }

    logger.debug('发送请求', {
      component: 'BackendAzureTTS',
      method: 'synthesizeSpeech',
      processedContent: processedContent.slice(0, 200) + (processedContent.length > 200 ? '...' : '')
    });
    
    const response = await apiClient.post('/api/azure-tts', { 
      ssml: processedContent, 
      voice 
    }, {
      responseType: 'blob'
    });

    const duration = Date.now() - startTime;
    logger.apiResponse('Azure TTS', response.status, {
      duration,
      headers: response.headers
    });

    const blob = response.data;
    logger.info('语音合成成功', {
      component: 'BackendAzureTTS',
      method: 'synthesizeSpeech',
      blobSize: blob.size,
      blobType: blob.type,
      duration
    });
    
    return blob;
  } catch (error) {
    const err = error as Error;
    const duration = Date.now() - startTime;
    
    logger.apiError('Azure TTS', err, {
      duration,
      voice,
      contentLength: content.length,
      isSSML
    });
    
    // 检查是否是网络错误
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      logger.error('网络连接错误，可能的原因:', {
        component: 'BackendAzureTTS',
        method: 'synthesizeSpeech',
        possibleCauses: [
          '后端服务器未启动',
          'API_BASE_URL 配置错误',
          'CORS 配置问题',
          '网络连接问题'
        ]
      });
    }
    
    throw error;
  }
}

/**
 * 一键语音合成（文本转语音）
 * @param text 要转换的文本
 * @param voice 语音名称
 * @returns 音频 Blob
 */
export async function textToSpeech(text: string, voice: string = 'zh-CN-XiaoxiaoNeural'): Promise<Blob> {
  const startTime = Date.now();
  
  logger.info('开始文本转语音', {
    component: 'BackendAzureTTS',
    method: 'textToSpeech',
    text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
    voice,
    textLength: text.length
  });
  
  try {
    // 直接调用 synthesizeSpeech，传入纯文本
    const audioBlob = await synthesizeSpeech(text, voice, false);
    
    const duration = Date.now() - startTime;
    logger.info('文本转语音完成', {
      component: 'BackendAzureTTS',
      method: 'textToSpeech',
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      duration
    });
    
    return audioBlob;
  } catch (error) {
    const err = error as Error;
    const duration = Date.now() - startTime;
    
    logger.error('文本转语音失败', {
      component: 'BackendAzureTTS',
      method: 'textToSpeech',
      error: err.message,
      errorType: err.constructor.name,
      text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
      voice,
      duration
    });
    throw error;
  }
}

/**
 * 播放音频
 * @param audioBlob 音频 Blob
 */
export function playAudio(audioBlob: Blob): void {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl); // 清理内存
  };
  
  audio.play().catch(error => {
    console.error('Audio playback error:', error);
    URL.revokeObjectURL(audioUrl);
  });
}

/**
 * 下载音频
 * @param audioBlob 音频 Blob
 * @param filename 文件名
 */
export function downloadAudio(audioBlob: Blob, filename: string = 'speech.mp3'): void {
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 获取可用的语音列表
 * @returns Promise<VoiceOption[]> 语音列表
 */
export async function fetchVoices(): Promise<VoiceOption[]> {
  // 后端模式下直接返回静态列表
  return availableVoices;
}

/**
 * 检查后端 Azure TTS 服务是否可用
 * @returns Promise<boolean>
 */
export async function checkBackendAvailability(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health');
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.warn('Backend Azure TTS not available:', error);
    return false;
  }
}
