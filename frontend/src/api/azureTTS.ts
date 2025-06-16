import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const SPEECH_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;

// Azure TTS API 封装（模板）
export async function synthesizeSpeech(
  text: string,
  voice: string = 'zh-CN-XiaoxiaoNeural',
): Promise<Blob> {
  if (!SPEECH_KEY || !SPEECH_REGION) {
    throw new Error('Azure Speech credentials not configured');
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
  speechConfig.speechSynthesisVoiceName = voice;

  const pullStream = sdk.AudioOutputStream.createPullStream();

  const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
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
  name: string; // Azure voice name identifier
  label: string; // Readable label shown in UI
}

/**
 * A curated list of commonly-used Azure neural voices.
 * You can extend this list or fetch voices dynamically from Azure REST API
 * (https://learn.microsoft.com/azure/cognitive-services/speech-service/rest-text-to-speech#list-voices).
 */
export const availableVoices: VoiceOption[] = [
  { name: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao – 中文女声' },
  { name: 'zh-CN-XiaoyiNeural', label: 'Xiaoyi – 中文女声' },
  { name: 'zh-CN-YunjianNeural', label: 'Yunjian – 中文男声' },
  { name: 'zh-CN-YunyangNeural', label: 'Yunyang – 中文男声' },
  // { name: 'en-US-AriaNeural', label: 'Aria – English Female' },
  // { name: 'en-US-GuyNeural', label: 'Guy – English Male' },
];

/** Azure REST API response voice schema */
interface AzureVoiceApiItem {
  Name: string; // "zh-CN-XiaoxiaoNeural"
  ShortName: string; // same as Name, but keep for completeness
  LocalName: string; // Localized display name, e.g. "晓晓"
  Gender: string;
  Locale: string;
  VoiceType: string;
}

/**
 * Fetch available voices from Azure Text-to-Speech REST endpoint.
 * Docs: https://learn.microsoft.com/azure/cognitive-services/speech-service/rest-text-to-speech#list-voices
 * Note: This call is subject to browser CORS policy. If your key is not allowed
 * to be exposed on the client, consider proxying this request on the server.
 */
export async function fetchVoices(): Promise<VoiceOption[]> {
  if (!SPEECH_KEY || !SPEECH_REGION) {
    throw new Error('Azure Speech credentials not configured');
  }
  const endpoint = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
  const res = await fetch(endpoint, {
    headers: {
      'Ocp-Apim-Subscription-Key': SPEECH_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch voices list: ${res.status} ${res.statusText}`);
  }
  const data: AzureVoiceApiItem[] = await res.json();
  // Map to VoiceOption – use ShortName as id, and combine LocalName with Locale for label
  return data.map((v) => ({
    name: v.ShortName || v.Name,
    label: `${v.Locale} – ${v.LocalName}`,
  }));
}
