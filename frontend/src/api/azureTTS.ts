// Azure client-side TTS using Microsoft Cognitive Services SDK – for local development only
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const SPEECH_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;

/**
 * 调用后端 `/api/azure-tts` 合成语音。
 * 如果提供的是纯文本，将自动包装为最简 SSML 并添加 <voice> 标签。
 */
export async function synthesizeSpeech(
  content: string,
  voice: string = 'zh-CN-XiaoxiaoNeural',
  isSSML: boolean = false,
): Promise<Blob> {
  if (!SPEECH_KEY || !SPEECH_REGION) {
    throw new Error('Azure Speech credentials not configured');
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
  speechConfig.speechSynthesisVoiceName = voice;

  const pullStream = sdk.AudioOutputStream.createPullStream();
  const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  if (isSSML) {
    // 不可靠的 SSML 直接重构为标准格式
    const inner = content
      .replace(/<speak[\s\S]*?>/, '')
      .replace(/<\/speak>/, '')
      .trim();

    content = `<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="${voice}">${inner}</voice></speak>`;
  }

  const speakFn = isSSML ? synthesizer.speakSsmlAsync.bind(synthesizer) : synthesizer.speakTextAsync.bind(synthesizer);
  console.log('[Content]', content);
  return new Promise((resolve, reject) => {
    speakFn(
      content,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const audioData = result.audioData;
          const blob = new Blob([audioData], { type: 'audio/wav' });
          resolve(blob);
        } else {
          reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
        }
        synthesizer.close();
      },
      (error) => {
        synthesizer.close();
        reject(error);
      },
    );
  });
}

export interface VoiceOption {
  name: string;
  label: string;
}

// 静态语音列表：如需完整列表可以让后端代理 Azure /voices/list
export const availableVoices: VoiceOption[] = [
  { name: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao – 中文女声' },
  { name: 'zh-CN-XiaoyiNeural', label: 'Xiaoyi – 中文女声' },
  { name: 'zh-CN-YunjianNeural', label: 'Yunjian – 中文男声' },
  { name: 'zh-CN-YunyangNeural', label: 'Yunyang – 中文男声' },
];

// In local dev we skip dynamic voice list fetching to avoid exposing keys
export async function fetchVoices(): Promise<VoiceOption[]> {
  return availableVoices;
}
