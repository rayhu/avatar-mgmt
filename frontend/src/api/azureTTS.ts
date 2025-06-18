// Azure client-side TTS using Microsoft Cognitive Services SDK – for local development only
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const SPEECH_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;

const visemeName: Record<number, string> = {
  0: 'Silence', 1: 'AE', 2: 'AA', 3: 'AO', 4: 'EH', 5: 'ER',
  6: 'IY', 7: 'UW', 8: 'OW', 9: 'AW', 10: 'OY', 11: 'AY',
  12: 'HH', 13: 'R', 14: 'L', 15: 'S/Z', 16: 'SH/CH',
  17: 'TH', 18: 'F/V', 19: 'D/T/N', 20: 'K/G', 21: 'P/B/M',
};

const timeline: { id: number; t: number }[] = [];

function handleViseme(id:number, t:number){
  timeline.push({id, t});
  // 调 UI 组件更新
}

/**
 * 调用后端 `/api/azure-tts` 合成语音。
 * 如果提供的是纯文本，将自动包装为最简 SSML 并添加 <voice> 标签。
 */
export async function synthesizeSpeech(
  content: string,
  voice: string = 'zh-CN-XiaoxiaoNeural',
  isSSML: boolean = false,
  onViseme?: (id: number, timeMs: number, animation?: string) => void,
): Promise<Blob> {
  if (!SPEECH_KEY || !SPEECH_REGION) {
    throw new Error('Azure Speech credentials not configured');
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
  speechConfig.speechSynthesisVoiceName = voice;
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceConnection_SynthesisVisemeEvent,
    'true',
  );

  const pullStream = sdk.AudioOutputStream.createPullStream();
  const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  // 监听 visemeReceived
  synthesizer.visemeReceived = (_s, e) => {
    const timeMs = e.audioOffset / 10000; // audioOffset 单位为 100 纳秒
    // 将事件写入本地时间轴缓存（可选，用于调试）
    timeline.push({ id: e.visemeId, t: timeMs });

    // 如果外部提供了回调，则通知上层（Animate.vue 会继续记录并驱动模型口型）
    try {
      onViseme?.(e.visemeId, timeMs, e.animation);
    } catch (err) {
      console.warn('[azureTTS] onViseme callback error:', err);
    }

    // 调试日志
    // const name = visemeName[e.visemeId] ?? 'Unknown';
    // console.log(`[Viseme] ${timeMs.toFixed(1)} ms  id=${e.visemeId}  ${name}`);
  };

  if (isSSML) {
    // 不可靠的 SSML 直接重构为标准格式
    // 0st 是无效的，需要转换为 +0st
    content = content.replace(/pitch="0st"/g, 'pitch="+0st"');

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
        console.warn(
          `[azureTTS] LLM returned voice "${detected}" which differs from selected "${voice}". Using LLM-specified voice.`,
        );
      }
    } else {
      processed = `<voice name="${voice}">${inner}</voice>`;
    }
    const wrapped = processed;
    content = `<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts">${wrapped}</speak>`;
  }

  const speakFn = isSSML
    ? synthesizer.speakSsmlAsync.bind(synthesizer)
    : synthesizer.speakTextAsync.bind(synthesizer);
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
